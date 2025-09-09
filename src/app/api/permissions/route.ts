import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { permissions } from '@/lib/db/schema';
import { requirePermission } from '@/lib/permissions';

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await requirePermission(session.user.id, 'permissions', 'read');

    const allPermissions = await db
      .select({
        id: permissions.id,
        name: permissions.name,
        description: permissions.description,
        resource: permissions.resource,
        action: permissions.action,
      })
      .from(permissions);

    return NextResponse.json({ permissions: allPermissions });
  } catch (error: unknown) {
    console.error('Error fetching permissions:', error);
    if (error instanceof Error && error.message?.includes('Access denied')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}