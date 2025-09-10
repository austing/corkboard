import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { hasPermissionForUser } from '@/lib/permissions';

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to update their own profile
    const canUpdateSelf = await hasPermissionForUser(session.user.id, 'users', 'update', session.user.id);
    if (!canUpdateSelf) {
      return NextResponse.json({ error: 'Permission denied: Cannot update profile' }, { status: 403 });
    }

    const { name, email, currentPassword, newPassword } = await request.json();

    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      );
    }

    // Get current user data
    const currentUser = await db
      .select()
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    if (!currentUser[0]) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if email is being changed and if it's already in use
    if (email !== currentUser[0].email) {
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (existingUser.length > 0) {
        return NextResponse.json(
          { error: 'Email address is already in use' },
          { status: 400 }
        );
      }
    }

    // Prepare update data
    const updateData: { name: string; email: string; updatedAt: Date; password?: string } = {
      name,
      email,
      updatedAt: new Date(),
    };

    // Handle password change if requested
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { error: 'Current password is required to change password' },
          { status: 400 }
        );
      }

      // Verify current password
      if (!currentUser[0].password) {
        return NextResponse.json(
          { error: 'Cannot change password for this account' },
          { status: 400 }
        );
      }

      const isValidPassword = await bcrypt.compare(currentPassword, currentUser[0].password);
      if (!isValidPassword) {
        return NextResponse.json(
          { error: 'Current password is incorrect' },
          { status: 400 }
        );
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 12);
      updateData.password = hashedPassword;
    }

    // Update user
    await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, session.user.id));

    return NextResponse.json({ message: 'Profile updated successfully' });
  } catch (error: unknown) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}