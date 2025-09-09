import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { users, userRoles, roles } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { requirePermission } from '@/lib/permissions';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await requirePermission(session.user.id, 'users', 'read');

    const allUsers = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        createdAt: users.createdAt,
        roleId: userRoles.roleId,
        roleName: roles.name,
      })
      .from(users)
      .leftJoin(userRoles, eq(users.id, userRoles.userId))
      .leftJoin(roles, eq(userRoles.roleId, roles.id));

    return NextResponse.json({ users: allUsers });
  } catch (error: unknown) {
    console.error('Error fetching users:', error);
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

    await requirePermission(session.user.id, 'users', 'create');

    const { name, email, password, roleId } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const userId = randomUUID();

    await db.insert(users).values({
      id: userId,
      name,
      email,
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Assign role if provided
    if (roleId) {
      await db.insert(userRoles).values({
        userId,
        roleId,
        assignedAt: new Date(),
      });
    }

    return NextResponse.json({ message: 'User created successfully', userId });
  } catch (error: unknown) {
    console.error('Error creating user:', error);
    if (error instanceof Error && error.message?.includes('Access denied')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}