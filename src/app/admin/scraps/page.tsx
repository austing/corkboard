'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import AdminLayout from '@/components/layout/admin-layout';
import PermissionCheck from '@/components/auth/permission-check';
import AddScrapModal from '@/components/admin/add-scrap-modal';
import EditScrapModal from '@/components/admin/edit-scrap-modal';
import { TrashIcon, MapPinIcon } from '@heroicons/react/24/outline';


interface Scrap {
  id: string;
  code: string;
  content: string;
  x: number;
  y: number;
  userId: string;
  userName?: string;
  userEmail?: string;
  createdAt: number;
  updatedAt: number;
}

export default function ScrapsPage() {
  const { data: _session } = useSession();
  const [scraps, setScraps] = useState<Scrap[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedScrap, setSelectedScrap] = useState<Scrap | null>(null);
  const [_error, setError] = useState('');

  useEffect(() => {
    document.title = 'Corkboard Admin';
  }, []);

  useEffect(() => {
    fetchScraps();
  }, []);

  const fetchScraps = async () => {
    try {
      const response = await fetch('/api/scraps');
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
    setSelectedScrap(scrap);
    setIsEditModalOpen(true);
  };

  const handleDeleteScrap = async (scrapId: string, scrapCode: string) => {
    if (!confirm(`Are you sure you want to delete scrap "${scrapCode}"?`)) return;

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

  const truncateContent = (content: string, maxLength: number = 100) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-8">
          <div className="text-gray-500">Loading scraps...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div>
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-xl font-semibold text-gray-900">Scraps</h1>
            <p className="mt-2 text-sm text-gray-700">
              Manage scraps - snippets of content with coordinates and unique codes.
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
                onClick={() => setIsAddModalOpen(true)}
                className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 cursor-pointer"
              >
                Add scrap
              </button>
            </PermissionCheck>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {scraps.map((scrap) => (
            <div key={scrap.id} className="bg-white shadow rounded-lg p-6 border">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 font-mono">
                    {scrap.code}
                  </h3>
                  <div className="flex items-center text-sm text-gray-500 mt-1">
                    <MapPinIcon className="h-4 w-4 mr-1" />
                    ({scrap.x}, {scrap.y})
                  </div>
                </div>
                <div className="flex space-x-2">
                  <PermissionCheck
                    resource="scraps"
                    action="update"
                    fallback={<div></div>}
                  >
                    <button 
                      onClick={() => handleEditScrap(scrap)}
                      className="text-indigo-600 hover:text-indigo-900 text-sm cursor-pointer"
                    >
                      Edit
                    </button>
                  </PermissionCheck>
                  <PermissionCheck
                    resource="scraps"
                    action="delete"
                    fallback={<div></div>}
                  >
                    <button
                      onClick={() => handleDeleteScrap(scrap.id, scrap.code)}
                      className="text-red-600 hover:text-red-900 cursor-pointer"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </PermissionCheck>
                </div>
              </div>
              
              <div className="mb-4">
                <p className="text-sm text-gray-800 whitespace-pre-wrap">
                  {truncateContent(scrap.content)}
                </p>
              </div>
              
              <div className="border-t pt-4">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>
                    Owner: {scrap.userName || 'Unknown'}
                  </span>
                  <span>
                    {scrap.createdAt ? new Date(scrap.createdAt).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                {scrap.updatedAt !== scrap.createdAt && (
                  <div className="text-xs text-gray-400 mt-1">
                    Updated: {new Date(scrap.updatedAt).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {scraps.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="text-gray-500">No scraps found</div>
            <PermissionCheck
              resource="scraps"
              action="create"
              fallback={<div></div>}
            >
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-600 bg-indigo-100 hover:bg-indigo-200 cursor-pointer"
              >
                Create your first scrap
              </button>
            </PermissionCheck>
          </div>
        )}
        
        {_error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800">{_error}</p>
          </div>
        )}
      </div>
      
      <AddScrapModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onScrapAdded={fetchScraps}
      />
      
      <EditScrapModal
        isOpen={isEditModalOpen}
        scrap={selectedScrap}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedScrap(null);
        }}
        onScrapUpdated={fetchScraps}
      />
    </AdminLayout>
  );
}