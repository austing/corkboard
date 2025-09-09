import { db } from './index';
import { users, roles, permissions, userRoles, rolePermissions } from './schema';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

export async function seedDatabase() {
  console.log('🌱 Seeding database...');

  // Create default permissions
  const defaultPermissions = [
    { resource: 'users', action: 'create', description: 'Create new users' },
    { resource: 'users', action: 'read', description: 'View users' },
    { resource: 'users', action: 'update', description: 'Edit users' },
    { resource: 'users', action: 'delete', description: 'Delete users' },
    { resource: 'roles', action: 'create', description: 'Create new roles' },
    { resource: 'roles', action: 'read', description: 'View roles' },
    { resource: 'roles', action: 'update', description: 'Edit roles' },
    { resource: 'roles', action: 'delete', description: 'Delete roles' },
    { resource: 'permissions', action: 'read', description: 'View permissions' },
    { resource: 'permissions', action: 'assign', description: 'Assign permissions to roles' },
    { resource: 'scraps', action: 'create', description: 'Create new scraps' },
    { resource: 'scraps', action: 'read', description: 'View scraps' },
    { resource: 'scraps', action: 'update', description: 'Edit scraps' },
    { resource: 'scraps', action: 'delete', description: 'Delete scraps' },
    { resource: 'scraps', action: 'create_for_others', description: 'Create scraps for other users' },
    { resource: 'scraps', action: 'update_others', description: 'Edit scraps owned by other users' },
    { resource: 'scraps', action: 'delete_others', description: 'Delete scraps owned by other users' },
    { resource: 'scraps', action: 'view_all', description: 'View all scraps regardless of owner' },
    { resource: 'admin', action: 'access', description: 'Access admin panel' },
  ];

  const permissionIds: Record<string, string> = {};

  for (const perm of defaultPermissions) {
    const id = randomUUID();
    await db.insert(permissions).values({
      id,
      name: `${perm.resource}:${perm.action}`,
      description: perm.description,
      resource: perm.resource,
      action: perm.action,
      createdAt: new Date(),
    });
    permissionIds[`${perm.resource}:${perm.action}`] = id;
  }

  // Create default roles
  const adminRoleId = randomUUID();
  const editorRoleId = randomUUID();
  const viewerRoleId = randomUUID();

  await db.insert(roles).values([
    {
      id: adminRoleId,
      name: 'admin',
      description: 'Full system access',
      createdAt: new Date(),
    },
    {
      id: editorRoleId,
      name: 'editor',
      description: 'Can create and edit content',
      createdAt: new Date(),
    },
    {
      id: viewerRoleId,
      name: 'viewer',
      description: 'Read-only access',
      createdAt: new Date(),
    },
  ]);

  // Assign all permissions to admin role
  const adminPermissions = Object.values(permissionIds).map(permissionId => ({
    roleId: adminRoleId,
    permissionId,
    assignedAt: new Date(),
  }));
  await db.insert(rolePermissions).values(adminPermissions);

  // Assign limited permissions to editor role
  const editorPermissionNames = ['users:read', 'users:update', 'admin:access'];
  const editorPermissions = editorPermissionNames.map(name => ({
    roleId: editorRoleId,
    permissionId: permissionIds[name],
    assignedAt: new Date(),
  }));
  await db.insert(rolePermissions).values(editorPermissions);

  // Assign read permissions to viewer role
  const viewerPermissionNames = ['users:read', 'roles:read', 'permissions:read', 'admin:access'];
  const viewerPermissions = viewerPermissionNames.map(name => ({
    roleId: viewerRoleId,
    permissionId: permissionIds[name],
    assignedAt: new Date(),
  }));
  await db.insert(rolePermissions).values(viewerPermissions);

  // Create default admin user
  const hashedPassword = await bcrypt.hash('admin123', 12);
  const adminUserId = randomUUID();

  await db.insert(users).values({
    id: adminUserId,
    name: 'Admin User',
    email: 'admin@example.com',
    password: hashedPassword,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // Assign admin role to admin user
  await db.insert(userRoles).values({
    userId: adminUserId,
    roleId: adminRoleId,
    assignedAt: new Date(),
  });

  console.log('✅ Database seeded successfully!');
  console.log('Admin credentials:');
  console.log('Email: admin@example.com');
  console.log('Password: admin123');
}

// Run the seeding function if this script is executed directly
if (require.main === module) {
  seedDatabase().catch(console.error);
}