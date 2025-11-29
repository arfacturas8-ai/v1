import { Redis } from 'ioredis';
import { prisma } from '@cryb/database';
import { AUTH_CONSTANTS } from '../models/auth-models';
import logger from '../utils/logger';

export interface Permission {
  id: string;
  name: string;
  description?: string;
  resource: string;
  action: string;
  created_at: Date;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: string[];
  is_system: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface UserPermissions {
  user_id: string;
  roles: Role[];
  permissions: Permission[];
  computed_permissions: string[];
}

export interface AccessCheckResult {
  allowed: boolean;
  reason?: string;
  required_permission?: string;
  user_permissions?: string[];
  missing_permissions?: string[];
}

export interface RoleAssignment {
  id: string;
  user_id: string;
  role_id: string;
  role_name: string;
  granted_by: string;
  granted_at: Date;
  expires_at?: Date;
  is_active: boolean;
}

export class RBACService {
  private redis: Redis;
  private readonly CACHE_TTL = 3600; // 1 hour
  private readonly USER_PERMISSIONS_PREFIX = 'user_permissions:';
  private readonly ROLE_PERMISSIONS_PREFIX = 'role_permissions:';
  private readonly PERMISSION_CACHE_PREFIX = 'permission_cache:';

  constructor(redis: Redis) {
    this.redis = redis;
  }

  /**
   * Create a new permission
   */
  async createPermission(data: {
    name: string;
    description?: string;
    resource: string;
    action: string;
  }): Promise<Permission> {
    try {
      // Check if permission already exists
      const existing = await prisma.permission.findFirst({
        where: {
          OR: [
            { name: data.name },
            { resource: data.resource, action: data.action }
          ]
        }
      });

      if (existing) {
        throw new Error('Permission already exists');
      }

      const permission = await prisma.permission.create({
        data: {
          name: data.name,
          description: data.description,
          resource: data.resource,
          action: data.action
        }
      });

      // Clear permission cache
      await this.clearPermissionCache();

      logger.info(`Permission created: ${permission.name}`);
      return permission;

    } catch (error) {
      logger.error('Error creating permission:', error);
      throw error;
    }
  }

  /**
   * Create a new role
   */
  async createRole(data: {
    name: string;
    description?: string;
    permissions: string[];
    is_system?: boolean;
  }): Promise<Role> {
    try {
      // Check if role already exists
      const existing = await prisma.role.findUnique({
        where: { name: data.name }
      });

      if (existing) {
        throw new Error('Role already exists');
      }

      // Validate permissions exist
      const validPermissions = await this.validatePermissions(data.permissions);
      if (validPermissions.length !== data.permissions.length) {
        throw new Error('Some permissions do not exist');
      }

      const role = await prisma.role.create({
        data: {
          name: data.name,
          description: data.description,
          permissions: data.permissions,
          is_system: data.is_system || false
        }
      });

      // Clear role cache
      await this.clearRoleCache(role.id);

      logger.info(`Role created: ${role.name}`);
      return role;

    } catch (error) {
      logger.error('Error creating role:', error);
      throw error;
    }
  }

  /**
   * Update role permissions
   */
  async updateRolePermissions(roleId: string, permissions: string[]): Promise<Role> {
    try {
      const role = await prisma.role.findUnique({
        where: { id: roleId }
      });

      if (!role) {
        throw new Error('Role not found');
      }

      if (role.is_system) {
        throw new Error('Cannot modify system role');
      }

      // Validate permissions exist
      const validPermissions = await this.validatePermissions(permissions);
      if (validPermissions.length !== permissions.length) {
        throw new Error('Some permissions do not exist');
      }

      const updatedRole = await prisma.role.update({
        where: { id: roleId },
        data: {
          permissions,
          updated_at: new Date()
        }
      });

      // Clear caches
      await this.clearRoleCache(roleId);
      await this.clearUserPermissionsCacheByRole(roleId);

      logger.info(`Role permissions updated: ${updatedRole.name}`);
      return updatedRole;

    } catch (error) {
      logger.error('Error updating role permissions:', error);
      throw error;
    }
  }

  /**
   * Assign role to user
   */
  async assignRoleToUser(data: {
    user_id: string;
    role_id: string;
    granted_by: string;
    expires_at?: Date;
  }): Promise<RoleAssignment> {
    try {
      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { id: data.user_id }
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Check if role exists
      const role = await prisma.role.findUnique({
        where: { id: data.role_id }
      });

      if (!role) {
        throw new Error('Role not found');
      }

      // Check if user already has this role
      const existing = await prisma.userRole.findFirst({
        where: {
          user_id: data.user_id,
          role_id: data.role_id,
          OR: [
            { expires_at: null },
            { expires_at: { gt: new Date() } }
          ]
        }
      });

      if (existing) {
        throw new Error('User already has this role');
      }

      const userRole = await prisma.userRole.create({
        data: {
          user_id: data.user_id,
          role_id: data.role_id,
          granted_by: data.granted_by,
          expires_at: data.expires_at
        }
      });

      // Clear user permissions cache
      await this.clearUserPermissionsCache(data.user_id);

      // Log role assignment
      await this.logSecurityEvent({
        user_id: data.user_id,
        event_type: 'role_assigned',
        ip_address: '0.0.0.0',
        user_agent: 'system',
        metadata: {
          role_id: data.role_id,
          role_name: role.name,
          granted_by: data.granted_by,
          expires_at: data.expires_at
        }
      });

      logger.info(`Role assigned: ${role.name} to user ${data.user_id}`);

      return {
        id: userRole.id,
        user_id: userRole.user_id,
        role_id: userRole.role_id,
        role_name: role.name,
        granted_by: userRole.granted_by,
        granted_at: userRole.granted_at,
        expires_at: userRole.expires_at,
        is_active: true
      };

    } catch (error) {
      logger.error('Error assigning role to user:', error);
      throw error;
    }
  }

  /**
   * Revoke role from user
   */
  async revokeRoleFromUser(userId: string, roleId: string, revokedBy: string): Promise<void> {
    try {
      const userRole = await prisma.userRole.findFirst({
        where: {
          user_id: userId,
          role_id: roleId,
          OR: [
            { expires_at: null },
            { expires_at: { gt: new Date() } }
          ]
        },
        include: {
          role: true
        }
      });

      if (!userRole) {
        throw new Error('User does not have this role');
      }

      if (userRole.role.is_system && userRole.role.name === AUTH_CONSTANTS.SYSTEM_ROLES.USER) {
        throw new Error('Cannot revoke basic user role');
      }

      await prisma.userRole.delete({
        where: { id: userRole.id }
      });

      // Clear user permissions cache
      await this.clearUserPermissionsCache(userId);

      // Log role revocation
      await this.logSecurityEvent({
        user_id: userId,
        event_type: 'role_revoked',
        ip_address: '0.0.0.0',
        user_agent: 'system',
        metadata: {
          role_id: roleId,
          role_name: userRole.role.name,
          revoked_by: revokedBy
        }
      });

      logger.info(`Role revoked: ${userRole.role.name} from user ${userId}`);

    } catch (error) {
      logger.error('Error revoking role from user:', error);
      throw error;
    }
  }

  /**
   * Get user permissions (with caching)
   */
  async getUserPermissions(userId: string): Promise<UserPermissions> {
    try {
      // Check cache first
      const cacheKey = `${this.USER_PERMISSIONS_PREFIX}${userId}`;
      const cached = await this.redis.get(cacheKey);

      if (cached) {
        const data = JSON.parse(cached);
        return {
          ...data,
          roles: data.roles.map((r: any) => ({
            ...r,
            created_at: new Date(r.created_at),
            updated_at: new Date(r.updated_at)
          })),
          permissions: data.permissions.map((p: any) => ({
            ...p,
            created_at: new Date(p.created_at)
          }))
        };
      }

      // Get from database
      const userRoles = await prisma.userRole.findMany({
        where: {
          user_id: userId,
          OR: [
            { expires_at: null },
            { expires_at: { gt: new Date() } }
          ]
        },
        include: {
          role: true
        }
      });

      const roles = userRoles.map(ur => ur.role);
      
      // Collect all permission names from roles
      const permissionNames = new Set<string>();
      roles.forEach(role => {
        const rolePermissions = Array.isArray(role.permissions) 
          ? role.permissions 
          : JSON.parse(role.permissions as string || '[]');
        rolePermissions.forEach(p => permissionNames.add(p));
      });

      // Get permission details
      const permissions = await prisma.permission.findMany({
        where: {
          name: {
            in: Array.from(permissionNames)
          }
        }
      });

      const userPermissions: UserPermissions = {
        user_id: userId,
        roles,
        permissions,
        computed_permissions: Array.from(permissionNames)
      };

      // Cache the result
      await this.redis.setex(
        cacheKey,
        this.CACHE_TTL,
        JSON.stringify({
          ...userPermissions,
          roles: userPermissions.roles.map(r => ({
            ...r,
            created_at: r.created_at.toISOString(),
            updated_at: r.updated_at.toISOString()
          })),
          permissions: userPermissions.permissions.map(p => ({
            ...p,
            created_at: p.created_at.toISOString()
          }))
        })
      );

      return userPermissions;

    } catch (error) {
      logger.error('Error getting user permissions:', error);
      throw error;
    }
  }

  /**
   * Check if user has permission
   */
  async checkPermission(userId: string, requiredPermission: string): Promise<AccessCheckResult> {
    try {
      const userPermissions = await this.getUserPermissions(userId);
      const hasPermission = userPermissions.computed_permissions.includes(requiredPermission);

      if (hasPermission) {
        return {
          allowed: true,
          user_permissions: userPermissions.computed_permissions
        };
      }

      // Check for wildcard permissions
      const wildcardPermission = this.checkWildcardPermission(
        userPermissions.computed_permissions,
        requiredPermission
      );

      if (wildcardPermission) {
        return {
          allowed: true,
          user_permissions: userPermissions.computed_permissions
        };
      }

      return {
        allowed: false,
        reason: 'Insufficient permissions',
        required_permission: requiredPermission,
        user_permissions: userPermissions.computed_permissions,
        missing_permissions: [requiredPermission]
      };

    } catch (error) {
      logger.error('Error checking permission:', error);
      return {
        allowed: false,
        reason: 'Permission check failed'
      };
    }
  }

  /**
   * Check if user has any of the required permissions
   */
  async checkAnyPermission(userId: string, requiredPermissions: string[]): Promise<AccessCheckResult> {
    try {
      const userPermissions = await this.getUserPermissions(userId);
      const hasAnyPermission = requiredPermissions.some(permission => 
        userPermissions.computed_permissions.includes(permission) ||
        this.checkWildcardPermission(userPermissions.computed_permissions, permission)
      );

      if (hasAnyPermission) {
        return {
          allowed: true,
          user_permissions: userPermissions.computed_permissions
        };
      }

      return {
        allowed: false,
        reason: 'Insufficient permissions',
        user_permissions: userPermissions.computed_permissions,
        missing_permissions: requiredPermissions
      };

    } catch (error) {
      logger.error('Error checking any permission:', error);
      return {
        allowed: false,
        reason: 'Permission check failed'
      };
    }
  }

  /**
   * Check if user has all required permissions
   */
  async checkAllPermissions(userId: string, requiredPermissions: string[]): Promise<AccessCheckResult> {
    try {
      const userPermissions = await this.getUserPermissions(userId);
      const missingPermissions = requiredPermissions.filter(permission => 
        !userPermissions.computed_permissions.includes(permission) &&
        !this.checkWildcardPermission(userPermissions.computed_permissions, permission)
      );

      if (missingPermissions.length === 0) {
        return {
          allowed: true,
          user_permissions: userPermissions.computed_permissions
        };
      }

      return {
        allowed: false,
        reason: 'Missing required permissions',
        user_permissions: userPermissions.computed_permissions,
        missing_permissions: missingPermissions
      };

    } catch (error) {
      logger.error('Error checking all permissions:', error);
      return {
        allowed: false,
        reason: 'Permission check failed'
      };
    }
  }

  /**
   * Get all permissions
   */
  async getAllPermissions(): Promise<Permission[]> {
    try {
      return await prisma.permission.findMany({
        orderBy: [
          { resource: 'asc' },
          { action: 'asc' }
        ]
      });
    } catch (error) {
      logger.error('Error getting all permissions:', error);
      return [];
    }
  }

  /**
   * Get all roles
   */
  async getAllRoles(): Promise<Role[]> {
    try {
      return await prisma.role.findMany({
        orderBy: { name: 'asc' }
      });
    } catch (error) {
      logger.error('Error getting all roles:', error);
      return [];
    }
  }

  /**
   * Get user role assignments
   */
  async getUserRoleAssignments(userId: string): Promise<RoleAssignment[]> {
    try {
      const userRoles = await prisma.userRole.findMany({
        where: {
          user_id: userId,
          OR: [
            { expires_at: null },
            { expires_at: { gt: new Date() } }
          ]
        },
        include: {
          role: true
        },
        orderBy: { granted_at: 'desc' }
      });

      return userRoles.map(ur => ({
        id: ur.id,
        user_id: ur.user_id,
        role_id: ur.role_id,
        role_name: ur.role.name,
        granted_by: ur.granted_by,
        granted_at: ur.granted_at,
        expires_at: ur.expires_at,
        is_active: !ur.expires_at || ur.expires_at > new Date()
      }));

    } catch (error) {
      logger.error('Error getting user role assignments:', error);
      return [];
    }
  }

  /**
   * Delete role (only non-system roles)
   */
  async deleteRole(roleId: string): Promise<void> {
    try {
      const role = await prisma.role.findUnique({
        where: { id: roleId }
      });

      if (!role) {
        throw new Error('Role not found');
      }

      if (role.is_system) {
        throw new Error('Cannot delete system role');
      }

      // Check if role is assigned to any users
      const assignments = await prisma.userRole.findMany({
        where: { role_id: roleId }
      });

      if (assignments.length > 0) {
        throw new Error('Cannot delete role that is assigned to users');
      }

      await prisma.role.delete({
        where: { id: roleId }
      });

      // Clear caches
      await this.clearRoleCache(roleId);

      logger.info(`Role deleted: ${role.name}`);

    } catch (error) {
      logger.error('Error deleting role:', error);
      throw error;
    }
  }

  /**
   * Clean up expired role assignments
   */
  async cleanupExpiredRoleAssignments(): Promise<number> {
    try {
      const expired = await prisma.userRole.findMany({
        where: {
          expires_at: { lt: new Date() }
        }
      });

      const userIds = [...new Set(expired.map(r => r.user_id))];

      await prisma.userRole.deleteMany({
        where: {
          expires_at: { lt: new Date() }
        }
      });

      // Clear affected user permissions caches
      for (const userId of userIds) {
        await this.clearUserPermissionsCache(userId);
      }

      logger.info(`Cleaned up ${expired.length} expired role assignments`);
      return expired.length;

    } catch (error) {
      logger.error('Error cleaning up expired role assignments:', error);
      return 0;
    }
  }

  /**
   * Private helper methods
   */

  private async validatePermissions(permissionNames: string[]): Promise<Permission[]> {
    return await prisma.permission.findMany({
      where: {
        name: {
          in: permissionNames
        }
      }
    });
  }

  private checkWildcardPermission(userPermissions: string[], requiredPermission: string): boolean {
    // Check for admin permissions
    if (userPermissions.includes('admin:*') || userPermissions.includes('*:*')) {
      return true;
    }

    // Extract resource and action from required permission
    const [resource, action] = requiredPermission.split(':');

    // Check for resource-level wildcard
    if (userPermissions.includes(`${resource}:*`)) {
      return true;
    }

    // Check for action-level wildcard
    if (userPermissions.includes(`*:${action}`)) {
      return true;
    }

    return false;
  }

  private async clearUserPermissionsCache(userId: string): Promise<void> {
    const cacheKey = `${this.USER_PERMISSIONS_PREFIX}${userId}`;
    await this.redis.del(cacheKey);
  }

  private async clearRoleCache(roleId: string): Promise<void> {
    const cacheKey = `${this.ROLE_PERMISSIONS_PREFIX}${roleId}`;
    await this.redis.del(cacheKey);
  }

  private async clearUserPermissionsCacheByRole(roleId: string): Promise<void> {
    // Get all users with this role
    const userRoles = await prisma.userRole.findMany({
      where: { role_id: roleId },
      select: { user_id: true }
    });

    // Clear their permission caches
    for (const userRole of userRoles) {
      await this.clearUserPermissionsCache(userRole.user_id);
    }
  }

  private async clearPermissionCache(): Promise<void> {
    const pattern = `${this.PERMISSION_CACHE_PREFIX}*`;
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }

  /**
   * Log security event
   */
  private async logSecurityEvent(event: {
    user_id?: string;
    event_type: string;
    ip_address: string;
    user_agent: string;
    location?: any;
    metadata?: any;
    risk_score?: number;
  }): Promise<void> {
    try {
      await prisma.securityEvent.create({
        data: {
          user_id: event.user_id,
          event_type: event.event_type as any,
          ip_address: event.ip_address,
          user_agent: event.user_agent,
          location: event.location,
          metadata: event.metadata || {},
          risk_score: event.risk_score || 0
        }
      });
    } catch (error) {
      logger.error('Error logging security event:', error);
    }
  }
}