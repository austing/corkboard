import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { roles, rolePermissions, permissions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { requirePermission } from '@/lib/permissions';
import { randomUUID } from 'crypto';

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await requirePermission(session.user.id, 'roles', 'read');

    const allRoles = await db
      .select({
        id: roles.id,
        name: roles.name,
        description: roles.description,
        createdAt: roles.createdAt,
      })
      .from(roles);

    // Get permissions for each role
    const rolesWithPermissions = await Promise.all(
      allRoles.map(async (role) => {
        const rolePerms = await db
          .select({
            permission: permissions.name,
          })
          .from(rolePermissions)
          .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
          .where(eq(rolePermissions.roleId, role.id));

        return {
          ...role,
          permissions: rolePerms.map(p => p.permission),
        };
      })
    );

    return NextResponse.json({ roles: rolesWithPermissions });
  } catch (error: unknown) {
    console.error('Error fetching roles:', error);
    if (error instanceof Error && error.message?.includes('Access denied')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await requirePermission(session.user.id, 'roles', 'create');

    const { name, description, permissionIds } = await request.json();

    if (!name) {
      return NextResponse.json(
        { error: 'Role name is required' },
        { status: 400 }
      );
    }

    // Check if role already exists
    const existingRole = await db
      .select()
      .from(roles)
      .where(eq(roles.name, name.toLowerCase()))
      .limit(1);

    if (existingRole.length > 0) {
      return NextResponse.json(
        { error: 'Role with this name already exists' },
        { status: 400 }
      );
    }

    const roleId = randomUUID();

    await db.insert(roles).values({
      id: roleId,
      name: name.toLowerCase(),
      description: description || '',
      createdAt: new Date(),
    });

    // Assign permissions if provided
    if (permissionIds && permissionIds.length > 0) {
      const rolePermissionValues = permissionIds.map((permissionId: string) => ({
        roleId,
        permissionId,
        assignedAt: new Date(),
      }));
      
      await db.insert(rolePermissions).values(rolePermissionValues);
    }

    return NextResponse.json({ message: 'Role created successfully', roleId });
  } catch (error: unknown) {
    console.error('Error creating role:', error);
    if (error instanceof Error && error.message?.includes('Access denied')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}