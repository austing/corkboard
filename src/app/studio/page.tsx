'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import StudioLayout from '@/components/layout/studio-layout';
import PermissionCheck from '@/components/auth/permission-check';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import config from '../../../corkboard.config';

interface Scrap {
  id: string;
  code: string;
  content: string;
  x: number;
  y: number;
  userId: string;
  userName: string;
  userEmail: string;
  createdAt: number;
  updatedAt: number;
}

export default function StudioPage() {
  const { data: _session } = useSession();
  const router = useRouter();
  const [scraps, setScraps] = useState<Scrap[]>([]);
  const [loading, setLoading] = useState(true);
  const [_error, setError] = useState('');

  useEffect(() => {
    fetchScraps();
  }, []);

  const fetchScraps = async () => {
    try {
      const response = await fetch('/api/scraps?onlyMine=true');
      if (response.ok) {
        const data = await response.json();
        setScraps(data.scraps);
      } else {
        setError('Failed to fetch scraps');
      }
    } catch (err) {
      setError('An error occurred while fetching scraps');
    } finally {
      setLoading(false);
    }
  };

  const handleEditScrap = (scrap: Scrap) => {
    router.push(`/studio/edit/${scrap.id}`);
  };

  const handleDeleteScrap = async (scrapId: string) => {
    if (!confirm('Are you sure you want to delete this scrap?')) return;

    try {
      const response = await fetch(`/api/scraps/${scrapId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchScraps(); // Refresh the list
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete scrap');
      }
    } catch (err) {
      alert('An error occurred while deleting the scrap');
    }
  };

  if (loading) {
    return (
      <StudioLayout>
        <div className="flex items-center justify-center py-8">
          <div className="text-gray-500">Loading content...</div>
        </div>
      </StudioLayout>
    );
  }

  return (
    <StudioLayout>
      <div>
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-2xl font-bold text-gray-900">Welcome to {config.panels.content.title}</h1>
            <p className="mt-2 text-sm text-gray-700">
              Create and manage your content scraps. Each scrap has a unique code and can be positioned anywhere on your virtual corkboard.
            </p>
          </div>
          <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
            <PermissionCheck
              resource="scraps"
              action="create"
              fallback={<div></div>}
            >
              <button
                type="button"
                onClick={() => router.push('/studio/new')}
                className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                <PlusIcon className="-ml-0.5 mr-1.5 h-5 w-5" />
                New Scrap
              </button>
            </PermissionCheck>
          </div>
        </div>

        <div className="mt-8">
          {scraps.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-500">No scraps yet. Create your first content scrap!</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {scraps.map((scrap) => (
                <div
                  key={scrap.id}
                  className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="text-xs font-mono text-gray-500 mb-1">#{scrap.code}</div>
                      <div className="text-xs text-gray-400">
                        Position: ({scrap.x}, {scrap.y})
                      </div>
                    </div>
                    <div className="flex space-x-1">
                      <PermissionCheck
                        resource="scraps"
                        action="update"
                        fallback={<div></div>}
                      >
                        <button
                          onClick={() => handleEditScrap(scrap)}
                          className="text-indigo-600 hover:text-indigo-900 p-1"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                      </PermissionCheck>
                      <PermissionCheck
                        resource="scraps"
                        action="delete"
                        fallback={<div></div>}
                      >
                        <button
                          onClick={() => handleDeleteScrap(scrap.id)}
                          className="text-red-600 hover:text-red-900 p-1"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </PermissionCheck>
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-900 mb-3 line-clamp-3">
                    {scrap.content}
                  </div>
                  
                  <div className="text-xs text-gray-500 border-t pt-2">
                    <div>By: {scrap.userName || scrap.userEmail}</div>
                    <div>Created: {new Date(scrap.createdAt).toLocaleDateString()}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {_error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800">{_error}</p>
          </div>
        )}
      </div>
    </StudioLayout>
  );
}