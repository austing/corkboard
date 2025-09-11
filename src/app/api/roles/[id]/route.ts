import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { roles, rolePermissions, permissions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { requirePermission } from '@/lib/permissions';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await requirePermission(session.user.id, 'roles', 'read');

    const role = await db
      .select({
        id: roles.id,
        name: roles.name,
        description: roles.description,
        createdAt: roles.createdAt,
      })
      .from(roles)
      .where(eq(roles.id, id))
      .limit(1);

    if (!role[0]) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    // Get permissions for this role
    const rolePerms = await db
      .select({
        permissionId: permissions.id,
        permission: permissions.name,
      })
      .from(rolePermissions)
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(eq(rolePermissions.roleId, id));

    const roleWithPermissions = {
      ...role[0],
      permissions: rolePerms.map(p => ({ id: p.permissionId, name: p.permission })),
    };

    return NextResponse.json({ role: roleWithPermissions });
  } catch (error: unknown) {
    console.error('Error fetching role:', error);
    if (error instanceof Error && error.message?.includes('Access denied')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await requirePermission(session.user.id, 'roles', 'update');

    const { name, description, permissionIds } = await request.json();

    if (!name) {
      return NextResponse.json(
        { error: 'Role name is required' },
        { status: 400 }
      );
    }

    // Check if the role exists
    const existingRole = await db
      .select()
      .from(roles)
      .where(eq(roles.id, id))
      .limit(1);

    if (existingRole.length === 0) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    // Check if another role with this name exists
    const duplicateRole = await db
      .select()
      .from(roles)
      .where(eq(roles.name, name.toLowerCase()))
      .limit(1);

    if (duplicateRole.length > 0 && duplicateRole[0].id !== id) {
      return NextResponse.json(
        { error: 'Another role with this name already exists' },
        { status: 400 }
      );
    }

    await db
      .update(roles)
      .set({
        name: name.toLowerCase(),
        description: description || '',
      })
      .where(eq(roles.id, id));

    // Update permissions
    if (permissionIds !== undefined) {
      // Remove existing permissions
      await db
        .delete(rolePermissions)
        .where(eq(rolePermissions.roleId, id));

      // Add new permissions
      if (permissionIds.length > 0) {
        const rolePermissionValues = permissionIds.map((permissionId: string) => ({
          roleId: id,
          permissionId,
          assignedAt: new Date(),
        }));
        
        await db.insert(rolePermissions).values(rolePermissionValues);
      }
    }

    return NextResponse.json({ message: 'Role updated successfully' });
  } catch (error: unknown) {
    console.error('Error updating role:', error);
    if (error instanceof Error && error.message?.includes('Access denied')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await requirePermission(session.user.id, 'roles', 'delete');

    // Don't allow deleting the admin role
    const role = await db
      .select()
      .from(roles)
      .where(eq(roles.id, id))
      .limit(1);

    if (!role[0]) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    if (role[0].name === 'admin') {
      return NextResponse.json(
        { error: 'Cannot delete the admin role' },
        { status: 400 }
      );
    }

    // Delete role (cascade will handle rolePermissions and userRoles)
    await db.delete(roles).where(eq(roles.id, id));

    return NextResponse.json({ message: 'Role deleted successfully' });
  } catch (error: unknown) {
    console.error('Error deleting role:', error);
    if (error instanceof Error && error.message?.includes('Access denied')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}