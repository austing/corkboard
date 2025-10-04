/**
 * Generate Mirror Fixture API Route
 *
 * POST /api/fixtures/mirror/generate
 * Generates a mirror fixture for the current user.
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { generateMirrorFixture } from '@/lib/fixtures';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const fixture = await generateMirrorFixture(session.user.id);

    return NextResponse.json(fixture);
  } catch (error) {
    console.error('Error generating mirror fixture:', error);
    return NextResponse.json(
      { error: 'Failed to generate mirror fixture' },
      { status: 500 }
    );
  }
}
