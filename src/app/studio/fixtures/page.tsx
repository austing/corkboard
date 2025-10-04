/**
 * Studio Fixtures Page
 *
 * Main page for fixture generation and import operations.
 * Provides offline sync functionality for working without internet.
 */

'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  CloudArrowDownIcon,
  CloudArrowUpIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

export default function FixturesPage() {
  const { data: session } = useSession();
  const router = useRouter();

  if (!session) {
    router.push('/auth/signin');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Offline Sync Fixtures</h1>
        <p className="text-gray-600 mb-8">
          Generate and import fixtures for working offline and syncing changes back to the server.
        </p>

        {/* Information Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-8">
          <div className="flex">
            <InformationCircleIcon className="h-5 w-5 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-2">How it works:</p>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>Generate a <strong>Mirror Fixture</strong> from your online instance</li>
                <li>Import it to your offline instance (wipes local scraps)</li>
                <li>Work offline - create and edit scraps</li>
                <li>Generate an <strong>Update Fixture</strong> with your changes</li>
                <li>Import it back to your online instance (with conflict resolution)</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Mirror Fixture Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-start mb-4">
            <CloudArrowDownIcon className="h-6 w-6 text-indigo-600 mr-3 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Mirror Fixture</h2>
              <p className="text-sm text-gray-600 mb-4">
                Download a complete snapshot of all scraps for offline work.
                Includes all scraps (public and private), but hides content of other users'
                private scraps. All other users are mapped to a single dummy user. Excludes passwords.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              href="/studio/fixtures/generate-mirror"
              className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
              Generate Mirror Fixture
            </Link>

            <Link
              href="/studio/fixtures/import-mirror"
              className="flex items-center justify-center px-4 py-3 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 transition-colors"
            >
              <ArrowUpTrayIcon className="h-5 w-5 mr-2" />
              Import Mirror Fixture
            </Link>
          </div>

          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-xs text-yellow-800">
              ⚠️ <strong>Warning:</strong> Importing a mirror fixture will delete all existing scraps in this database!
            </p>
          </div>
        </div>

        {/* Update Fixture Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-start mb-4">
            <CloudArrowUpIcon className="h-6 w-6 text-green-600 mr-3 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Update Fixture</h2>
              <p className="text-sm text-gray-600 mb-4">
                Generate a fixture of your local changes to sync back to the server.
                Only includes scraps you own. Optionally filter by date to sync only recent changes.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              href="/studio/fixtures/generate-update"
              className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
              Generate Update Fixture
            </Link>

            <Link
              href="/studio/fixtures/import-update"
              className="flex items-center justify-center px-4 py-3 border border-green-300 rounded-md shadow-sm text-sm font-medium text-green-700 bg-white hover:bg-green-50 transition-colors"
            >
              <ArrowUpTrayIcon className="h-5 w-5 mr-2" />
              Import Update Fixture
            </Link>
          </div>

          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-xs text-blue-800">
              ℹ️ The import will show conflicts if scraps are not owned by you or have newer server versions.
            </p>
          </div>
        </div>

        {/* Documentation Link */}
        <div className="mt-8 text-center">
          <a
            href="/OFFLINE_SYNC_TESTING.md"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-indigo-600 hover:text-indigo-800 hover:underline"
          >
            View complete documentation →
          </a>
        </div>
      </div>
    </div>
  );
}
