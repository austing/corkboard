import { NextRequest, NextResponse } from 'next/server';
import { hasPermission } from '@/lib/permissions';

export async function POST(request: NextRequest) {
  try {
    const { userId, resource, action } = await request.json();

    if (!userId || !resource || !action) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const userHasPermission = await hasPermission(userId, resource, action);

    return NextResponse.json({ hasPermission: userHasPermission });
  } catch (error) {
    console.error('Permission check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}