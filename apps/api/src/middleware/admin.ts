import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma, executeWithDatabaseRetry } from '@cryb/database';
import { throwUnauthorized, throwForbidden, AppError } from './errorHandler';

/**
 * Admin permission levels
 */
export enum AdminPermission {
  SUPER_ADMIN = 'SUPER_ADMIN',
  USER_MANAGEMENT = 'USER_MANAGEMENT',
  CONTENT_MODERATION = 'CONTENT_MODERATION',
  ANALYTICS_VIEWER = 'ANALYTICS_VIEWER',
  COMMUNITY_MANAGEMENT = 'COMMUNITY_MANAGEMENT',
  SYSTEM_CONFIGURATION = 'SYSTEM_CONFIGURATION'
}

/**
 * Enhanced admin middleware with granular permissions
 */
export const adminMiddleware = (requiredPermissions: AdminPermission[] = [AdminPermission.SUPER_ADMIN]) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user) {
      throwUnauthorized('Authentication required');
    }

    try {
      // Check if user has admin privileges
      const adminUser = await executeWithDatabaseRetry(async () => {
        return await prisma.user.findUnique({
          where: { id: request.userId! },
          select: {
            id: true,
            username: true,
            email: true,
            isVerified: true,
            bannedAt: true,
            premiumType: true,
            publicFlags: true,
            flags: true,
            createdAt: true,
            lastSeenAt: true
          }
        });
      });

      if (!adminUser) {
        throwForbidden('User not found');
      }

      // Check if user is banned
      if (adminUser.bannedAt && adminUser.bannedAt > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) {
        throwForbidden('Access denied: User account is banned');
      }

      // For now, use a combination of checks for admin privileges
      // This can be enhanced later with a proper admin roles system
      const hasAdminAccess = checkAdminAccess(adminUser, requiredPermissions);

      if (!hasAdminAccess) {
        request.log.warn(`Admin access denied for user ${adminUser.username} (${adminUser.id})`);
        throwForbidden('Administrator privileges required');
      }

      // Attach admin context to request
      request.adminUser = adminUser;
      request.adminPermissions = getAdminPermissions(adminUser);

      request.log.info(`Admin access granted for user ${adminUser.username} (${adminUser.id})`);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      
      request.log.error({ error, userId: request.userId }, 'Admin middleware error');
      throw new AppError('Admin access verification failed', 500, 'ADMIN_VERIFICATION_FAILED');
    }
  };
};

/**
 * Check if user has admin access based on various criteria
 */
function checkAdminAccess(user: any, requiredPermissions: AdminPermission[]): boolean {
  // Super admin check - these users can do anything
  if (isSuperAdmin(user)) {
    return true;
  }

  // If no specific permissions required, just check basic admin status
  if (requiredPermissions.length === 0 || requiredPermissions.includes(AdminPermission.SUPER_ADMIN)) {
    return isBasicAdmin(user);
  }

  // Check specific permissions
  const userPermissions = getAdminPermissions(user);
  return requiredPermissions.some(permission => userPermissions.includes(permission));
}

/**
 * Check if user is a super admin
 */
function isSuperAdmin(user: any): boolean {
  // Super admin criteria:
  // 1. Must be verified
  // 2. Account older than 30 days
  // 3. Has specific flag bits set (using bitwise operations)
  // 4. Premium user or specific email domains
  
  const accountAge = Date.now() - user.createdAt.getTime();
  const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
  
  const isSuperAdminEmail = user.email && (
    user.email.endsWith('@cryb.ai') ||
    user.email.endsWith('@cryb.com') ||
    // Add specific admin emails here
    ['admin@example.com', 'superadmin@example.com'].includes(user.email)
  );

  const hasAdminFlags = (user.flags & 0x1) !== 0; // Custom admin flag bit
  const hasVerifiedStatus = user.isVerified;
  const hasOldAccount = accountAge >= thirtyDaysInMs;
  const hasPremium = user.premiumType !== 'NONE';

  return (isSuperAdminEmail && hasVerifiedStatus) || 
         (hasAdminFlags && hasVerifiedStatus && hasOldAccount) ||
         (hasPremium && hasVerifiedStatus && hasOldAccount && user.publicFlags > 0);
}

/**
 * Check if user is a basic admin
 */
function isBasicAdmin(user: any): boolean {
  // Basic admin criteria:
  // 1. Must be verified
  // 2. Account older than 7 days
  // 3. Has some special status
  
  const accountAge = Date.now() - user.createdAt.getTime();
  const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
  
  const hasVerifiedStatus = user.isVerified;
  const hasOldEnoughAccount = accountAge >= sevenDaysInMs;
  const hasSpecialStatus = user.premiumType !== 'NONE' || user.publicFlags > 0;

  return hasVerifiedStatus && hasOldEnoughAccount && hasSpecialStatus;
}

/**
 * Get admin permissions for a user
 */
function getAdminPermissions(user: any): AdminPermission[] {
  const permissions: AdminPermission[] = [];

  if (isSuperAdmin(user)) {
    // Super admins get all permissions
    return Object.values(AdminPermission);
  }

  // Basic admin gets limited permissions
  if (isBasicAdmin(user)) {
    permissions.push(AdminPermission.ANALYTICS_VIEWER);
    
    // Premium users get additional permissions
    if (user.premiumType !== 'NONE') {
      permissions.push(AdminPermission.CONTENT_MODERATION);
      permissions.push(AdminPermission.COMMUNITY_MANAGEMENT);
    }

    // Users with high public flags get user management
    if (user.publicFlags > 5) {
      permissions.push(AdminPermission.USER_MANAGEMENT);
    }
  }

  return permissions;
}

/**
 * Middleware to check specific admin permission
 */
export const requireAdminPermission = (permission: AdminPermission) => {
  return adminMiddleware([permission]);
};

/**
 * Middleware for super admin only
 */
export const superAdminMiddleware = adminMiddleware([AdminPermission.SUPER_ADMIN]);

/**
 * Middleware for user management operations
 */
export const userManagementMiddleware = adminMiddleware([AdminPermission.USER_MANAGEMENT, AdminPermission.SUPER_ADMIN]);

/**
 * Middleware for content moderation operations
 */
export const contentModerationMiddleware = adminMiddleware([AdminPermission.CONTENT_MODERATION, AdminPermission.SUPER_ADMIN]);

/**
 * Middleware for analytics viewing
 */
export const analyticsViewerMiddleware = adminMiddleware([AdminPermission.ANALYTICS_VIEWER, AdminPermission.SUPER_ADMIN]);

// Extend FastifyRequest interface to include admin context
declare module 'fastify' {
  interface FastifyRequest {
    adminUser?: any;
    adminPermissions?: AdminPermission[];
  }
}