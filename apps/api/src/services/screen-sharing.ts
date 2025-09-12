import { Server } from 'socket.io';
import { LiveKitService } from './livekit';
import { prisma } from '@cryb/database';
import Redis from 'ioredis';

export interface ScreenShareSession {
  sessionId: string;
  userId: string;
  channelId?: string;
  roomName: string;
  presenterIdentity: string;
  trackSid?: string;
  
  // Screen sharing settings
  source: 'screen' | 'window' | 'tab' | 'application';
  hasAudio: boolean;
  quality: 'low' | 'medium' | 'high' | 'ultra';
  frameRate: number;
  
  // Viewer management
  viewers: string[];
  maxViewers: number;
  requiresPermission: boolean;
  allowedViewers?: string[];
  
  // Control and interaction
  allowViewerControl: boolean;
  controllerUserId?: string;
  annotations: boolean;
  recording: boolean;
  
  // Session metadata
  startedAt: Date;
  lastActivityAt: Date;
  metadata?: Record<string, any>;
}

export interface ScreenShareControls {
  sessionId: string;
  controllerUserId: string;
  permissions: {
    mouse: boolean;
    keyboard: boolean;
    clipboard: boolean;
    fileTransfer: boolean;
  };
  grantedAt: Date;
  expiresAt?: Date;
}

export interface ViewerPermissions {
  userId: string;
  sessionId: string;
  canView: boolean;
  canControl: boolean;
  canAnnotate: boolean;
  canRecord: boolean;
  grantedBy: string;
  grantedAt: Date;
}

export class ScreenSharingService {
  private io: Server;
  private redis: Redis;
  private liveKitService: LiveKitService;
  private activeSessions: Map<string, ScreenShareSession> = new Map();
  private activeControls: Map<string, ScreenShareControls> = new Map();
  private viewerPermissions: Map<string, ViewerPermissions[]> = new Map();

  constructor(io: Server, redis: Redis, liveKitService: LiveKitService) {
    this.io = io;
    this.redis = redis;
    this.liveKitService = liveKitService;
    this.setupCleanupTasks();
  }

  /**
   * Start a new screen sharing session
   */
  async startScreenShare(params: {
    userId: string;
    channelId?: string;
    roomName: string;
    source: 'screen' | 'window' | 'tab' | 'application';
    hasAudio: boolean;
    quality: 'low' | 'medium' | 'high' | 'ultra';
    maxViewers?: number;
    requiresPermission?: boolean;
    allowViewerControl?: boolean;
    annotations?: boolean;
    recording?: boolean;
    metadata?: Record<string, any>;
  }): Promise<{ sessionId: string; session: ScreenShareSession }> {
    
    // Check if user already has an active screen share session
    const existingSession = Array.from(this.activeSessions.values())
      .find(session => session.userId === params.userId);
    
    if (existingSession) {
      await this.stopScreenShare(existingSession.sessionId, params.userId);
    }

    const sessionId = `screenshare_${Date.now()}_${params.userId}`;
    const presenterIdentity = `screenshare_${params.userId}_${Date.now()}`;

    // Determine quality settings
    const qualitySettings = this.getQualitySettings(params.quality);

    const session: ScreenShareSession = {
      sessionId,
      userId: params.userId,
      channelId: params.channelId,
      roomName: params.roomName,
      presenterIdentity,
      source: params.source,
      hasAudio: params.hasAudio,
      quality: params.quality,
      frameRate: qualitySettings.frameRate,
      viewers: [],
      maxViewers: params.maxViewers || 50,
      requiresPermission: params.requiresPermission || false,
      allowViewerControl: params.allowViewerControl || false,
      annotations: params.annotations || false,
      recording: params.recording || false,
      startedAt: new Date(),
      lastActivityAt: new Date(),
      metadata: params.metadata
    };

    this.activeSessions.set(sessionId, session);

    // Store in Redis for persistence and scalability
    await this.redis.hset(
      `screenshare:${sessionId}`,
      {
        userId: params.userId,
        channelId: params.channelId || '',
        roomName: params.roomName,
        source: params.source,
        hasAudio: params.hasAudio.toString(),
        quality: params.quality,
        startedAt: session.startedAt.toISOString(),
        metadata: JSON.stringify(params.metadata || {})
      }
    );

    // Set expiration for Redis key (24 hours)
    await this.redis.expire(`screenshare:${sessionId}`, 24 * 60 * 60);

    console.log(`🖥️ Started screen sharing session ${sessionId} for user ${params.userId}`);

    return { sessionId, session };
  }

  /**
   * Stop a screen sharing session
   */
  async stopScreenShare(sessionId: string, userId: string): Promise<boolean> {
    const session = this.activeSessions.get(sessionId);
    if (!session) return false;

    // Verify user has permission to stop this session
    if (session.userId !== userId) {
      throw new Error('Permission denied: Cannot stop another user\'s screen share');
    }

    // Remove all viewers
    for (const viewerId of session.viewers) {
      this.io.to(`user:${viewerId}`).emit('screenshare:session_ended', {
        sessionId,
        reason: 'presenter_stopped'
      });
    }

    // Revoke any active control sessions
    const controlSessions = Array.from(this.activeControls.values())
      .filter(control => control.sessionId === sessionId);
    
    for (const control of controlSessions) {
      await this.revokeViewerControl(sessionId, control.controllerUserId, userId);
    }

    // Clean up session data
    this.activeSessions.delete(sessionId);
    this.viewerPermissions.delete(sessionId);
    
    // Clean up Redis data
    await this.redis.del(`screenshare:${sessionId}`);
    await this.redis.del(`screenshare:viewers:${sessionId}`);
    await this.redis.del(`screenshare:controls:${sessionId}`);

    // Notify channel if applicable
    if (session.channelId) {
      this.io.to(`voice:${session.channelId}`).emit('screenshare:stopped', {
        sessionId,
        userId,
        channelId: session.channelId
      });
    }

    console.log(`🖥️ Stopped screen sharing session ${sessionId}`);
    return true;
  }

  /**
   * Join a screen sharing session as a viewer
   */
  async joinAsViewer(sessionId: string, viewerId: string): Promise<{
    success: boolean;
    session?: ScreenShareSession;
    liveKitToken?: string;
    error?: string;
  }> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      return { success: false, error: 'Session not found' };
    }

    // Check if session has reached max viewers
    if (session.viewers.length >= session.maxViewers) {
      return { success: false, error: 'Session is full' };
    }

    // Check if user is already a viewer
    if (session.viewers.includes(viewerId)) {
      return { success: false, error: 'Already viewing this session' };
    }

    // Check permissions if required
    if (session.requiresPermission) {
      const hasPermission = await this.checkViewerPermission(sessionId, viewerId);
      if (!hasPermission) {
        return { success: false, error: 'Permission required to view this session' };
      }
    }

    // Add viewer to session
    session.viewers.push(viewerId);
    session.lastActivityAt = new Date();

    // Generate LiveKit token for viewer
    const viewerToken = this.liveKitService.generateAccessToken(session.roomName, {
      identity: `viewer_${viewerId}_${Date.now()}`,
      name: 'Screen Share Viewer',
      metadata: JSON.stringify({
        userId: viewerId,
        role: 'viewer',
        sessionId,
        joinedAt: Date.now()
      }),
      permissions: {
        canPublish: false,
        canSubscribe: true,
        canPublishData: session.annotations,
        hidden: false,
        recorder: false
      }
    });

    // Store viewer in Redis
    await this.redis.sadd(`screenshare:viewers:${sessionId}`, viewerId);

    // Notify presenter and other viewers
    this.io.to(`user:${session.userId}`).emit('screenshare:viewer_joined', {
      sessionId,
      viewerId,
      viewerCount: session.viewers.length
    });

    console.log(`👀 User ${viewerId} joined screen share session ${sessionId}`);

    return {
      success: true,
      session,
      liveKitToken: viewerToken
    };
  }

  /**
   * Leave a screen sharing session as a viewer
   */
  async leaveAsViewer(sessionId: string, viewerId: string): Promise<boolean> {
    const session = this.activeSessions.get(sessionId);
    if (!session) return false;

    const viewerIndex = session.viewers.indexOf(viewerId);
    if (viewerIndex === -1) return false;

    // Remove viewer from session
    session.viewers.splice(viewerIndex, 1);
    session.lastActivityAt = new Date();

    // Revoke any active control
    if (this.activeControls.has(sessionId)) {
      const control = this.activeControls.get(sessionId);
      if (control?.controllerUserId === viewerId) {
        await this.revokeViewerControl(sessionId, viewerId, session.userId);
      }
    }

    // Remove from Redis
    await this.redis.srem(`screenshare:viewers:${sessionId}`, viewerId);

    // Notify presenter and other viewers
    this.io.to(`user:${session.userId}`).emit('screenshare:viewer_left', {
      sessionId,
      viewerId,
      viewerCount: session.viewers.length
    });

    console.log(`👀 User ${viewerId} left screen share session ${sessionId}`);
    return true;
  }

  /**
   * Grant control to a viewer
   */
  async grantViewerControl(
    sessionId: string, 
    viewerId: string, 
    grantedBy: string,
    permissions: {
      mouse?: boolean;
      keyboard?: boolean;
      clipboard?: boolean;
      fileTransfer?: boolean;
    } = {},
    duration?: number // duration in minutes
  ): Promise<boolean> {
    const session = this.activeSessions.get(sessionId);
    if (!session) return false;

    // Verify granter has permission
    if (session.userId !== grantedBy) {
      throw new Error('Only the presenter can grant control');
    }

    if (!session.allowViewerControl) {
      throw new Error('Viewer control is not enabled for this session');
    }

    // Check if viewer is actually viewing the session
    if (!session.viewers.includes(viewerId)) {
      throw new Error('User is not viewing this session');
    }

    // Revoke existing control if any
    const existingControl = this.activeControls.get(sessionId);
    if (existingControl) {
      await this.revokeViewerControl(sessionId, existingControl.controllerUserId, grantedBy);
    }

    const control: ScreenShareControls = {
      sessionId,
      controllerUserId: viewerId,
      permissions: {
        mouse: permissions.mouse !== false,
        keyboard: permissions.keyboard !== false,
        clipboard: permissions.clipboard !== false,
        fileTransfer: permissions.fileTransfer !== false
      },
      grantedAt: new Date(),
      expiresAt: duration ? new Date(Date.now() + duration * 60 * 1000) : undefined
    };

    this.activeControls.set(sessionId, control);
    session.controllerUserId = viewerId;

    // Store in Redis
    await this.redis.hset(`screenshare:controls:${sessionId}`, {
      controllerUserId: viewerId,
      permissions: JSON.stringify(control.permissions),
      grantedAt: control.grantedAt.toISOString(),
      expiresAt: control.expiresAt?.toISOString() || ''
    });

    // Notify both parties
    this.io.to(`user:${viewerId}`).emit('screenshare:control_granted', {
      sessionId,
      permissions: control.permissions,
      expiresAt: control.expiresAt
    });

    this.io.to(`user:${grantedBy}`).emit('screenshare:control_granted_to', {
      sessionId,
      controllerUserId: viewerId,
      permissions: control.permissions
    });

    console.log(`🎮 Granted control of session ${sessionId} to user ${viewerId}`);
    return true;
  }

  /**
   * Revoke control from a viewer
   */
  async revokeViewerControl(sessionId: string, viewerId: string, revokedBy: string): Promise<boolean> {
    const session = this.activeSessions.get(sessionId);
    const control = this.activeControls.get(sessionId);
    
    if (!session || !control || control.controllerUserId !== viewerId) {
      return false;
    }

    // Verify permission to revoke
    if (session.userId !== revokedBy && viewerId !== revokedBy) {
      throw new Error('Permission denied: Cannot revoke control');
    }

    this.activeControls.delete(sessionId);
    session.controllerUserId = undefined;

    // Clean up Redis
    await this.redis.del(`screenshare:controls:${sessionId}`);

    // Notify both parties
    this.io.to(`user:${viewerId}`).emit('screenshare:control_revoked', {
      sessionId,
      reason: revokedBy === viewerId ? 'user_released' : 'presenter_revoked'
    });

    if (revokedBy !== viewerId) {
      this.io.to(`user:${revokedBy}`).emit('screenshare:control_revoked_from', {
        sessionId,
        viewerId
      });
    }

    console.log(`🎮 Revoked control of session ${sessionId} from user ${viewerId}`);
    return true;
  }

  /**
   * Handle control input from viewer
   */
  async handleControlInput(sessionId: string, controllerId: string, input: {
    type: 'mouse_move' | 'mouse_click' | 'key_press' | 'scroll' | 'clipboard';
    data: any;
  }): Promise<boolean> {
    const control = this.activeControls.get(sessionId);
    if (!control || control.controllerUserId !== controllerId) {
      return false;
    }

    // Check if control has expired
    if (control.expiresAt && control.expiresAt < new Date()) {
      await this.revokeViewerControl(sessionId, controllerId, 'system');
      return false;
    }

    // Validate permissions for the input type
    const hasPermission = this.validateControlPermission(control.permissions, input.type);
    if (!hasPermission) {
      return false;
    }

    const session = this.activeSessions.get(sessionId);
    if (!session) return false;

    // Forward control input to presenter
    this.io.to(`user:${session.userId}`).emit('screenshare:control_input', {
      sessionId,
      controllerId,
      input
    });

    return true;
  }

  /**
   * Get active screen sharing sessions
   */
  getActiveSessions(): ScreenShareSession[] {
    return Array.from(this.activeSessions.values());
  }

  /**
   * Get sessions for a specific user
   */
  getUserSessions(userId: string): {
    presenting: ScreenShareSession[];
    viewing: ScreenShareSession[];
  } {
    const presenting = Array.from(this.activeSessions.values())
      .filter(session => session.userId === userId);
    
    const viewing = Array.from(this.activeSessions.values())
      .filter(session => session.viewers.includes(userId));
    
    return { presenting, viewing };
  }

  /**
   * Get session statistics
   */
  getSessionStats() {
    const sessions = Array.from(this.activeSessions.values());
    
    return {
      totalSessions: sessions.length,
      totalViewers: sessions.reduce((sum, session) => sum + session.viewers.length, 0),
      totalControlSessions: this.activeControls.size,
      sessionsWithControl: sessions.filter(s => s.allowViewerControl).length,
      averageViewersPerSession: sessions.length > 0 
        ? sessions.reduce((sum, session) => sum + session.viewers.length, 0) / sessions.length 
        : 0
    };
  }

  private getQualitySettings(quality: 'low' | 'medium' | 'high' | 'ultra') {
    const settings = {
      low: { frameRate: 15, bitrate: 500000 },
      medium: { frameRate: 24, bitrate: 1000000 },
      high: { frameRate: 30, bitrate: 2000000 },
      ultra: { frameRate: 60, bitrate: 4000000 }
    };
    
    return settings[quality] || settings.medium;
  }

  private async checkViewerPermission(sessionId: string, viewerId: string): Promise<boolean> {
    const permissions = this.viewerPermissions.get(sessionId) || [];
    const userPermission = permissions.find(p => p.userId === viewerId);
    return userPermission?.canView || false;
  }

  private validateControlPermission(permissions: ScreenShareControls['permissions'], inputType: string): boolean {
    switch (inputType) {
      case 'mouse_move':
      case 'mouse_click':
        return permissions.mouse;
      case 'key_press':
        return permissions.keyboard;
      case 'clipboard':
        return permissions.clipboard;
      case 'scroll':
        return permissions.mouse;
      default:
        return false;
    }
  }

  private setupCleanupTasks() {
    // Clean up expired sessions every 5 minutes
    setInterval(() => {
      this.cleanupExpiredSessions();
    }, 5 * 60 * 1000);

    // Clean up expired controls every minute
    setInterval(() => {
      this.cleanupExpiredControls();
    }, 60 * 1000);
  }

  private async cleanupExpiredSessions() {
    const now = new Date();
    const expiredThreshold = 30 * 60 * 1000; // 30 minutes of inactivity

    for (const [sessionId, session] of this.activeSessions.entries()) {
      if (now.getTime() - session.lastActivityAt.getTime() > expiredThreshold) {
        console.log(`🧹 Cleaning up expired screen share session ${sessionId}`);
        await this.stopScreenShare(sessionId, session.userId);
      }
    }
  }

  private async cleanupExpiredControls() {
    const now = new Date();

    for (const [sessionId, control] of this.activeControls.entries()) {
      if (control.expiresAt && control.expiresAt < now) {
        console.log(`🧹 Control session expired for ${sessionId}`);
        await this.revokeViewerControl(sessionId, control.controllerUserId, 'system');
      }
    }
  }
}