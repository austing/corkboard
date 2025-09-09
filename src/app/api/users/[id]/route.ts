import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { users, userRoles } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { requirePermission } from '@/lib/permissions';
import bcrypt from 'bcryptjs';

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

    await requirePermission(session.user.id, 'users', 'read');

    const user = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (!user[0]) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user: user[0] });
  } catch (error: unknown) {
    console.error('Error fetching user:', error);
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

    await requirePermission(session.user.id, 'users', 'update');

    const { name, email, password, roleId } = await request.json();

    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      );
    }

    const updateData: { name: string; email: string; updatedAt: Date; password?: string } = {
      name,
      email,
      updatedAt: new Date(),
    };

    if (password) {
      updateData.password = await bcrypt.hash(password, 12);
    }

    await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id));

    // Update role - handle both setting and removing roles
    if (roleId !== undefined) {
      // Remove existing roles first
      await db
        .delete(userRoles)
        .where(eq(userRoles.userId, id));
      
      // Add new role only if roleId is not empty
      if (roleId) {
        await db.insert(userRoles).values({
          userId: id,
          roleId,
          assignedAt: new Date(),
        });
      }
    }

    return NextResponse.json({ message: 'User updated successfully' });
  } catch (error: unknown) {
    console.error('Error updating user:', error);
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

    await requirePermission(session.user.id, 'users', 'delete');

    // Don't allow deleting yourself
    if (session.user.id === id) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    // Delete user (cascade will handle userRoles)
    await db.delete(users).where(eq(users.id, id));

    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error: unknown) {
    console.error('Error deleting user:', error);
    if (error instanceof Error && error.message?.includes('Access denied')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}