import { db } from './index';
import { users, roles, permissions, userRoles, rolePermissions } from './schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import Database from 'better-sqlite3';

export async function seedDatabase() {
  console.log('🌱 Seeding database...');

  // Run migrations first to ensure tables exist
  const isDevelopment = process.env.NODE_ENV !== 'production';
  if (isDevelopment) {
    const dbPath = process.env.DATABASE_URL?.replace('file:', '') || './sqlite.db';
    const sqlite = new Database(dbPath);
    const { drizzle } = require('drizzle-orm/better-sqlite3');
    const migrateDb = drizzle(sqlite);

    try {
      console.log('📦 Running migrations...');
      migrate(migrateDb, { migrationsFolder: './drizzle' });
      console.log('✅ Migrations complete');
    } catch (err) {
      console.log('ℹ️  Migrations already applied or not needed');
    }
  }

  // Create default permissions
  const defaultPermissions = [
    { resource: 'users', action: 'create', description: 'Create new users' },
    { resource: 'users', action: 'read', description: 'View users' },
    { resource: 'users', action: 'update', description: 'Edit users' },
    { resource: 'users', action: 'update_self', description: 'Edit own user profile' },
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
    const permName = `${perm.resource}:${perm.action}`;

    // Check if permission already exists
    const existing = await db
      .select()
      .from(permissions)
      .where(eq(permissions.name, permName))
      .limit(1);

    if (existing.length > 0) {
      permissionIds[permName] = existing[0].id;
    } else {
      const id = randomUUID();
      await db.insert(permissions).values({
        id,
        name: permName,
        description: perm.description,
        resource: perm.resource,
        action: perm.action,
        createdAt: new Date(),
      });
      permissionIds[permName] = id;
    }
  }

  // Create default roles (check if they exist first)
  const roleNames = ['admin', 'editor', 'viewer', 'scrapper'];
  const roleDescriptions = {
    admin: 'Full system access',
    editor: 'Can create and edit content',
    viewer: 'Read-only access',
    scrapper: 'Can create, read, update scraps and view all. Can edit own profile. Cannot delete or manage other users.',
  };

  const roleIds: Record<string, string> = {};

  for (const roleName of roleNames) {
    const existing = await db
      .select()
      .from(roles)
      .where(eq(roles.name, roleName))
      .limit(1);

    if (existing.length > 0) {
      roleIds[roleName] = existing[0].id;
    } else {
      const id = randomUUID();
      await db.insert(roles).values({
        id,
        name: roleName,
        description: roleDescriptions[roleName as keyof typeof roleDescriptions],
        createdAt: new Date(),
      });
      roleIds[roleName] = id;
    }
  }

  const adminRoleId = roleIds.admin;
  const editorRoleId = roleIds.editor;
  const viewerRoleId = roleIds.viewer;
  const scrapperRoleId = roleIds.scrapper;

  // Assign all permissions to admin role (skip if already assigned)
  for (const permissionId of Object.values(permissionIds)) {
    const existing = await db
      .select()
      .from(rolePermissions)
      .where(eq(rolePermissions.roleId, adminRoleId))
      .where(eq(rolePermissions.permissionId, permissionId))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(rolePermissions).values({
        roleId: adminRoleId,
        permissionId,
        assignedAt: new Date(),
      });
    }
  }

  // Assign limited permissions to editor role
  const editorPermissionNames = ['users:read', 'users:update', 'admin:access'];
  for (const name of editorPermissionNames) {
    const existing = await db
      .select()
      .from(rolePermissions)
      .where(eq(rolePermissions.roleId, editorRoleId))
      .where(eq(rolePermissions.permissionId, permissionIds[name]))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(rolePermissions).values({
        roleId: editorRoleId,
        permissionId: permissionIds[name],
        assignedAt: new Date(),
      });
    }
  }

  // Assign read permissions to viewer role
  const viewerPermissionNames = ['users:read', 'roles:read', 'permissions:read', 'admin:access'];
  for (const name of viewerPermissionNames) {
    const existing = await db
      .select()
      .from(rolePermissions)
      .where(eq(rolePermissions.roleId, viewerRoleId))
      .where(eq(rolePermissions.permissionId, permissionIds[name]))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(rolePermissions).values({
        roleId: viewerRoleId,
        permissionId: permissionIds[name],
        assignedAt: new Date(),
      });
    }
  }

  // Assign scrapper permissions - can create, read, update scraps and view all, edit own profile, but not delete or manage others
  const scrapperPermissionNames = [
    'scraps:create',
    'scraps:read',
    'scraps:update',
    'scraps:view_all',
    'users:update_self'
  ];
  for (const name of scrapperPermissionNames) {
    const existing = await db
      .select()
      .from(rolePermissions)
      .where(eq(rolePermissions.roleId, scrapperRoleId))
      .where(eq(rolePermissions.permissionId, permissionIds[name]))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(rolePermissions).values({
        roleId: scrapperRoleId,
        permissionId: permissionIds[name],
        assignedAt: new Date(),
      });
    }
  }

  // Create default admin user (skip if exists)
  const existingAdmin = await db
    .select()
    .from(users)
    .where(eq(users.email, 'admin@example.com'))
    .limit(1);

  let adminUserId: string;

  if (existingAdmin.length > 0) {
    adminUserId = existingAdmin[0].id;
    console.log('ℹ️  Admin user already exists');
  } else {
    const hashedPassword = await bcrypt.hash('admin123', 12);
    adminUserId = randomUUID();

    await db.insert(users).values({
      id: adminUserId,
      name: 'Admin User',
      email: 'admin@example.com',
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    console.log('✅ Created admin user');
  }

  // Assign admin role to admin user (skip if already assigned)
  const existingUserRole = await db
    .select()
    .from(userRoles)
    .where(eq(userRoles.userId, adminUserId))
    .where(eq(userRoles.roleId, adminRoleId))
    .limit(1);

  if (existingUserRole.length === 0) {
    await db.insert(userRoles).values({
      userId: adminUserId,
      roleId: adminRoleId,
      assignedAt: new Date(),
    });
  }

  console.log('✅ Database seeded successfully!');
  console.log('Admin credentials:');
  console.log('Email: admin@example.com');
  console.log('Password: admin123');
}

// Run the seeding function if this script is executed directly
if (require.main === module) {
  seedDatabase().catch(console.error);
}