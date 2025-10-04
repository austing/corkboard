/**
 * Import Mirror Fixture Page
 *
 * Imports a mirror fixture, wiping all existing scraps.
 * Includes confirmation dialog to prevent accidental data loss.
 */

'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, useRef } from 'react';
import Link from 'next/link';
import { ArrowLeftIcon, ArrowUpTrayIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

export default function ImportMirrorPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [fixtureStats, setFixtureStats] = useState<{ users: number; scraps: number } | null>(null);

  if (!session) {
    router.push('/auth/signin');
    return null;
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError('');
      setSuccess(false);
      setShowConfirm(false);

      // Parse file to show stats
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const fixture = JSON.parse(event.target?.result as string);
          setFixtureStats({
            users: fixture.users?.length || 0,
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
    setSuccess(false);

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const fixtureData = event.target?.result as string;

          const response = await fetch('/api/fixtures/mirror/import', {
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

          setSuccess(true);
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
      <div className="max-w-2xl mx-auto py-8 px-4">
        <Link
          href="/scrap-studio/fixtures"
          className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-800 mb-6"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Back to Fixtures
        </Link>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Import Mirror Fixture</h1>
        <p className="text-gray-600 mb-8">
          Import a mirror fixture to set up your offline instance.
        </p>

        {/* Warning Banner */}
        <div className="bg-red-50 border border-red-300 rounded-md p-4 mb-6">
          <div className="flex">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-red-800">
              <p className="font-semibold mb-1">⚠️ Warning: This action is destructive!</p>
              <p>
                Importing a mirror fixture will <strong>permanently delete all existing scraps</strong> in
                this database and replace them with the contents of the fixture file.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Fixture File</h2>

          <div className="mb-6">
            <label
              htmlFor="fixture-file"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Mirror Fixture JSON File
            </label>
            <input
              ref={fileInputRef}
              id="fixture-file"
              type="file"
              accept=".json"
              onChange={handleFileChange}
              disabled={importing}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {fixtureStats && (
            <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-md">
              <p className="text-sm font-medium text-gray-900 mb-2">Fixture Contents:</p>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• {fixtureStats.users} users</li>
                <li>• {fixtureStats.scraps} scraps</li>
              </ul>
            </div>
          )}

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-800">
                ✓ Mirror fixture imported successfully! All scraps have been replaced.
              </p>
            </div>
          )}

          {!showConfirm ? (
            <button
              onClick={handleRequestImport}
              disabled={!file || importing}
              className="w-full flex items-center justify-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              <ArrowUpTrayIcon className="h-5 w-5 mr-2" />
              Import Fixture
            </button>
          ) : (
            <div className="border-2 border-red-300 rounded-md p-6 bg-red-50">
              <p className="text-sm font-semibold text-red-900 mb-4">
                Are you absolutely sure?
              </p>
              <p className="text-sm text-red-800 mb-6">
                This will permanently delete all {fixtureStats?.scraps || 0} existing scraps and replace
                them with the fixture contents. This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleConfirmImport}
                  disabled={importing}
                  className="flex-1 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-700 hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {importing ? 'Importing...' : 'Yes, Import and Delete All Scraps'}
                </button>
                <button
                  onClick={handleCancelImport}
                  disabled={importing}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <p className="text-sm text-blue-800">
            <strong>Tip:</strong> After importing, you can work offline and later generate an Update
            Fixture to sync your changes back to the server.
          </p>
        </div>
      </div>
    </div>
  );
}
