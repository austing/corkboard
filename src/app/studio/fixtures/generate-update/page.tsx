/**
 * Generate Update Fixture Page
 *
 * Generates and downloads an update fixture containing local changes.
 * Optionally filter by date to sync only recent changes.
 */

'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeftIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';

export default function GenerateUpdatePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [sinceDate, setSinceDate] = useState('');
  const [useFilter, setUseFilter] = useState(false);

  if (!session) {
    router.push('/auth/signin');
    return null;
  }

  const handleGenerate = async () => {
    setGenerating(true);
    setError('');
    setSuccess(false);

    try {
      const url = new URL('/api/fixtures/update/generate', window.location.origin);
      if (useFilter && sinceDate) {
        url.searchParams.set('since', sinceDate);
      }

      const response = await fetch(url.toString(), {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to generate fixture');
      }

      const fixture = await response.json();

      // Create download
      const blob = new Blob([JSON.stringify(fixture, null, 2)], {
        type: 'application/json',
      });
      const url2 = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url2;
      link.download = `update-fixture-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url2);

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto py-8 px-4">
        <Link
          href="/studio/fixtures"
          className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-800 mb-6"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Back to Fixtures
        </Link>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Generate Update Fixture</h1>
        <p className="text-gray-600 mb-8">
          Generate a fixture of your local changes to sync back to the server.
        </p>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">What will be included:</h2>
          <ul className="space-y-2 text-sm text-gray-700 mb-6">
            <li className="flex items-start">
              <span className="text-green-600 mr-2">✓</span>
              <span>All scraps you own (created or edited by you)</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-600 mr-2">✓</span>
              <span>Original IDs preserved for server matching</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-600 mr-2">✓</span>
              <span>Both public and private scraps you own</span>
            </li>
            <li className="flex items-start">
              <span className="text-red-600 mr-2">✗</span>
              <span>Scraps owned by other users (excluded)</span>
            </li>
          </ul>

          <div className="mb-6 p-4 border border-gray-200 rounded-md">
            <div className="flex items-start">
              <input
                id="use-filter"
                type="checkbox"
                checked={useFilter}
                onChange={(e) => setUseFilter(e.target.checked)}
                className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="use-filter" className="ml-3 flex-1">
                <span className="block text-sm font-medium text-gray-900 mb-1">
                  Filter by date (optional)
                </span>
                <p className="text-xs text-gray-600 mb-3">
                  Only include scraps modified after a specific date. Useful for syncing only recent
                  changes.
                </p>
                {useFilter && (
                  <div>
                    <label htmlFor="since-date" className="block text-xs font-medium text-gray-700 mb-1">
                      Include changes since:
                    </label>
                    <input
                      id="since-date"
                      type="date"
                      value={sinceDate}
                      onChange={(e) => setSinceDate(e.target.value)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                    />
                  </div>
                )}
              </label>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-800">
                ✓ Update fixture generated and downloaded successfully!
              </p>
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={generating || (useFilter && !sinceDate)}
            className="w-full flex items-center justify-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {generating ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Generating...
              </>
            ) : (
              <>
                <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                Generate and Download
              </>
            )}
          </button>

          {useFilter && !sinceDate && (
            <p className="mt-2 text-xs text-amber-600">
              Please select a date to enable filtering
            </p>
          )}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <p className="text-sm text-blue-800">
            <strong>Next step:</strong> Import this fixture to your online instance using the "Import
            Update Fixture" option. The import will handle conflicts automatically.
          </p>
        </div>
      </div>
    </div>
  );
}
