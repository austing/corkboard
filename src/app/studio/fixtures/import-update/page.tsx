/**
 * Import Update Fixture Page
 *
 * Imports an update fixture with conflict resolution.
 * Shows detailed results of updated, created, and skipped scraps.
 */

'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, useRef } from 'react';
import Link from 'next/link';
import {
  ArrowLeftIcon,
  ArrowUpTrayIcon,
  CheckCircleIcon,
  XCircleIcon,
  PlusCircleIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';

interface ImportResult {
  updated: Array<{ id: string; code: string; content: string }>;
  created: Array<{ id: string; code: string; content: string }>;
  skipped: Array<{ scrap: { id: string; code: string }; reason: 'not_owner' | 'newer_on_server' }>;
  parentCreated: Array<{ parentId: string; childId: string }>;
}

export default function ImportUpdatePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<ImportResult | null>(null);
  const [fixtureStats, setFixtureStats] = useState<{ scraps: number } | null>(null);

  if (!session) {
    router.push('/auth/signin');
    return null;
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError('');
      setResult(null);
      setShowConfirm(false);

      // Parse file to show stats
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const fixture = JSON.parse(event.target?.result as string);
          setFixtureStats({
            scraps: fixture.scraps?.length || 0,
          });
        } catch (err) {
          setError('Invalid fixture file format');
        }
      };
      reader.readAsText(selectedFile);
    }
  };

  const handleRequestImport = () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }
    setShowConfirm(true);
  };

  const handleConfirmImport = async () => {
    if (!file) return;

    setImporting(true);
    setError('');
    setResult(null);

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const fixtureData = event.target?.result as string;

          const response = await fetch('/api/fixtures/update/import', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: fixtureData,
          });

          if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Failed to import fixture');
          }

          const importResult = await response.json();
          setResult(importResult);
          setShowConfirm(false);
          setFile(null);
          setFixtureStats(null);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        } catch (err) {
          setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
          setImporting(false);
        }
      };
      reader.readAsText(file);
    } catch (err) {
      setError('Failed to read file');
      setImporting(false);
    }
  };

  const handleCancelImport = () => {
    setShowConfirm(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto py-8 px-4">
        <Link
          href="/studio/fixtures"
          className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-800 mb-6"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Back to Fixtures
        </Link>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Import Update Fixture</h1>
        <p className="text-gray-600 mb-8">
          Import local changes with automatic conflict resolution.
        </p>

        {/* Results Section */}
        {result && (
          <div className="mb-8 space-y-4">
            {/* Summary */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Import Results</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-green-50 rounded-md">
                  <div className="text-2xl font-bold text-green-700">{result.updated.length}</div>
                  <div className="text-xs text-green-600 uppercase tracking-wide">Updated</div>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-md">
                  <div className="text-2xl font-bold text-blue-700">{result.created.length}</div>
                  <div className="text-xs text-blue-600 uppercase tracking-wide">Created</div>
                </div>
                <div className="text-center p-3 bg-amber-50 rounded-md">
                  <div className="text-2xl font-bold text-amber-700">{result.skipped.length}</div>
                  <div className="text-xs text-amber-600 uppercase tracking-wide">Skipped</div>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-md">
                  <div className="text-2xl font-bold text-purple-700">{result.parentCreated.length}</div>
                  <div className="text-xs text-purple-600 uppercase tracking-wide">Placeholders</div>
                </div>
              </div>
            </div>

            {/* Updated Scraps */}
            {result.updated.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center mb-4">
                  <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />
                  <h3 className="text-md font-semibold text-gray-900">
                    Updated Scraps ({result.updated.length})
                  </h3>
                </div>
                <div className="space-y-2">
                  {result.updated.slice(0, 10).map((scrap) => (
                    <div key={scrap.id} className="flex items-center text-sm text-gray-700 bg-green-50 px-3 py-2 rounded">
                      <span className="font-mono text-xs bg-white px-2 py-0.5 rounded mr-2">
                        {scrap.code}
                      </span>
                      <span className="truncate">{scrap.content.substring(0, 60)}...</span>
                    </div>
                  ))}
                  {result.updated.length > 10 && (
                    <p className="text-xs text-gray-500 italic">
                      ... and {result.updated.length - 10} more
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Created Scraps */}
            {result.created.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center mb-4">
                  <PlusCircleIcon className="h-5 w-5 text-blue-600 mr-2" />
                  <h3 className="text-md font-semibold text-gray-900">
                    Created Scraps ({result.created.length})
                  </h3>
                </div>
                <div className="space-y-2">
                  {result.created.slice(0, 10).map((scrap) => (
                    <div key={scrap.id} className="flex items-center text-sm text-gray-700 bg-blue-50 px-3 py-2 rounded">
                      <span className="font-mono text-xs bg-white px-2 py-0.5 rounded mr-2">
                        {scrap.code}
                      </span>
                      <span className="truncate">{scrap.content.substring(0, 60)}...</span>
                    </div>
                  ))}
                  {result.created.length > 10 && (
                    <p className="text-xs text-gray-500 italic">
                      ... and {result.created.length - 10} more
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Skipped Scraps */}
            {result.skipped.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-amber-200 p-6">
                <div className="flex items-center mb-4">
                  <XCircleIcon className="h-5 w-5 text-amber-600 mr-2" />
                  <h3 className="text-md font-semibold text-gray-900">
                    Skipped Scraps ({result.skipped.length})
                  </h3>
                </div>
                <div className="space-y-2">
                  {result.skipped.map((item) => (
                    <div key={item.scrap.id} className="flex items-center justify-between text-sm bg-amber-50 px-3 py-2 rounded">
                      <div className="flex items-center">
                        <span className="font-mono text-xs bg-white px-2 py-0.5 rounded mr-2">
                          {item.scrap.code}
                        </span>
                      </div>
                      <span className="text-xs text-amber-700">
                        {item.reason === 'not_owner' && '🔒 Not owner'}
                        {item.reason === 'newer_on_server' && '⏱️ Newer on server'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Placeholder Parents */}
            {result.parentCreated.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-purple-200 p-6">
                <div className="flex items-center mb-4">
                  <ExclamationCircleIcon className="h-5 w-5 text-purple-600 mr-2" />
                  <h3 className="text-md font-semibold text-gray-900">
                    Placeholder Parents Created ({result.parentCreated.length})
                  </h3>
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  These scraps were nested in parents that didn't exist, so placeholders were created:
                </p>
                <div className="space-y-2">
                  {result.parentCreated.map((item) => (
                    <div key={item.childId} className="text-sm text-gray-700 bg-purple-50 px-3 py-2 rounded">
                      Parent <span className="font-mono text-xs">{item.parentId.substring(0, 8)}...</span> created
                      for child <span className="font-mono text-xs">{item.childId.substring(0, 8)}...</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Update Fixture</h2>

          <div className="mb-6">
            <label
              htmlFor="fixture-file"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Update Fixture JSON File
            </label>
            <input
              ref={fileInputRef}
              id="fixture-file"
              type="file"
              accept=".json"
              onChange={handleFileChange}
              disabled={importing}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-green-50 file:text-green-700 hover:file:bg-green-100 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {fixtureStats && (
            <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-md">
              <p className="text-sm font-medium text-gray-900 mb-2">Fixture Contents:</p>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• {fixtureStats.scraps} scraps to sync</li>
              </ul>
            </div>
          )}

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {!showConfirm ? (
            <button
              onClick={handleRequestImport}
              disabled={!file || importing}
              className="w-full flex items-center justify-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              <ArrowUpTrayIcon className="h-5 w-5 mr-2" />
              Import Update Fixture
            </button>
          ) : (
            <div className="border-2 border-green-300 rounded-md p-6 bg-green-50">
              <p className="text-sm font-semibold text-green-900 mb-4">
                Ready to import {fixtureStats?.scraps || 0} scraps?
              </p>
              <p className="text-sm text-green-800 mb-6">
                The system will automatically update your scraps, create new ones, and skip any
                conflicts. You'll see a detailed report after import.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleConfirmImport}
                  disabled={importing}
                  className="flex-1 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-700 hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {importing ? 'Importing...' : 'Yes, Import Update Fixture'}
                </button>
                <button
                  onClick={handleCancelImport}
                  disabled={importing}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <p className="text-sm text-blue-800">
            <strong>How it works:</strong> The system will update scraps you own if your version is
            newer. Conflicts are automatically resolved and shown in the results.
          </p>
        </div>
      </div>
    </div>
  );
}
