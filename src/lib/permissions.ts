import { db } from '@/lib/db';
import { users, userRoles, rolePermissions, permissions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function getUserPermissions(userId: string) {
  const userPermissions = await db
    .select({
      permission: permissions.name,
      resource: permissions.resource,
      action: permissions.action,
    })
    .from(users)
    .innerJoin(userRoles, eq(users.id, userRoles.userId))
    .innerJoin(rolePermissions, eq(userRoles.roleId, rolePermissions.roleId))
    .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
    .where(eq(users.id, userId));

  return userPermissions;
}

export async function hasPermission(userId: string, resource: string, action: string) {
  const userPermissions = await getUserPermissions(userId);
  return userPermissions.some(
    (perm) => perm.resource === resource && perm.action === action
  );
}

export async function requirePermission(userId: string, resource: string, action: string) {
  const hasAccess = await hasPermission(userId, resource, action);
  if (!hasAccess) {
    throw new Error(`Access denied: ${resource}:${action}`);
  }
}

export async function hasPermissionForUser(userId: string, resource: string, action: string, targetUserId?: string) {
  // If targetUserId is provided and it's different from userId, check for general permission
  // If targetUserId is same as userId or not provided, check for self permission first, then general
  if (targetUserId && targetUserId !== userId) {
    return hasPermission(userId, resource, action);
  } else {
    // Check self permission first, then fall back to general permission
    const hasSelfPermission = await hasPermission(userId, resource, `${action}_self`);
    if (hasSelfPermission) {
      return true;
    }
    return hasPermission(userId, resource, action);
  }
}

export type Permission = {
  permission: string;
  resource: string;
  action: string;
};