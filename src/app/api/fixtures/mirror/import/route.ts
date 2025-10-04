/**
 * Import Mirror Fixture API Route
 *
 * POST /api/fixtures/mirror/import
 * Imports a mirror fixture, replacing all existing scraps.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { importMirrorFixture, parseFixture, type MirrorFixture } from '@/lib/fixtures';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const fixture = parseFixture(JSON.stringify(body)) as MirrorFixture;

    // Validate fixture structure
    if (!fixture.users || !fixture.scraps) {
      return NextResponse.json(
        { error: 'Invalid fixture format' },
        { status: 400 }
      );
    }

    await importMirrorFixture(fixture);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error importing mirror fixture:', error);
    return NextResponse.json(
      { error: 'Failed to import mirror fixture' },
      { status: 500 }
    );
  }
}
