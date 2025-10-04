/**
 * Generate Mirror Fixture Page
 *
 * Generates and downloads a mirror fixture containing all viewable scraps.
 */

'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeftIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';

export default function GenerateMirrorPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!session) {
    router.push('/auth/signin');
    return null;
  }

  const handleGenerate = async () => {
    setGenerating(true);
    setError('');
    setSuccess(false);

    try {
      const response = await fetch('/api/fixtures/mirror/generate', {
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
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `mirror-fixture-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

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
          href="/scrap-studio/fixtures"
          className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-800 mb-6"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Back to Fixtures
        </Link>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Generate Mirror Fixture</h1>
        <p className="text-gray-600 mb-8">
          Download a complete snapshot of all viewable scraps for offline work.
        </p>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">What will be included:</h2>
          <ul className="space-y-2 text-sm text-gray-700 mb-6">
            <li className="flex items-start">
              <span className="text-green-600 mr-2">✓</span>
              <span>All public scraps (viewable by everyone)</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-600 mr-2">✓</span>
              <span>Your own private scraps (with full content)</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-600 mr-2">✓</span>
              <span>Other users' private scraps (with content hidden)</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-600 mr-2">✓</span>
              <span>All other users mapped to single "dummy" user</span>
            </li>
            <li className="flex items-start">
              <span className="text-red-600 mr-2">✗</span>
              <span>Passwords (excluded for security)</span>
            </li>
          </ul>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-800">
                ✓ Mirror fixture generated and downloaded successfully!
              </p>
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={generating}
            className="w-full flex items-center justify-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
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
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <p className="text-sm text-blue-800">
            <strong>Next step:</strong> Import this fixture to your offline instance using the
            "Import Mirror Fixture" option.
          </p>
        </div>
      </div>
    </div>
  );
}
