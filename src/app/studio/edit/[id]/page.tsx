'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import StudioLayout from '@/components/layout/studio-layout';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

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

export default function EditScrapPage() {
  const router = useRouter();
  const params = useParams();
  const scrapId = params.id as string;
  
  const [scrap, setScrap] = useState<Scrap | null>(null);
  const [formData, setFormData] = useState({
    content: '',
    x: 0,
    y: 0,
  });
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [_error, setError] = useState('');

  useEffect(() => {
    if (scrapId) {
      fetchScrap();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scrapId]);

  const fetchScrap = async () => {
    try {
      const response = await fetch(`/api/scraps/${scrapId}`);
      if (response.ok) {
        const data = await response.json();
        setScrap(data.scrap);
        setFormData({
          content: data.scrap.content,
          x: data.scrap.x,
          y: data.scrap.y,
        });
      } else {
        setError('Failed to load scrap');
      }
    } catch (err) {
      setError('An error occurred while loading the scrap');
    } finally {
      setFetchLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scrap) return;
    
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/scraps/${scrap.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: formData.content,
          x: formData.x,
          y: formData.y,
        }),
      });

      if (response.ok) {
        router.push('/studio');
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to update scrap');
      }
    } catch (err) {
      setError('An error occurred while updating the scrap');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: name === 'x' || name === 'y' ? parseInt(value) || 0 : value 
    }));
  };

  if (fetchLoading) {
    return (
      <StudioLayout>
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-500">Loading scrap...</div>
          </div>
        </div>
      </StudioLayout>
    );
  }

  if (!scrap) {
    return (
      <StudioLayout>
        <div className="max-w-2xl mx-auto">
          <div className="text-center py-12">
            <div className="text-gray-500">Scrap not found or you don&apos;t have permission to edit it.</div>
            <button
              onClick={() => router.push('/studio')}
              className="mt-4 text-indigo-600 hover:text-indigo-800"
            >
              Return to Content
            </button>
          </div>
        </div>
      </StudioLayout>
    );
  }

  return (
    <StudioLayout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Back to Content
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Edit Scrap #{scrap.code}</h1>
          <p className="mt-2 text-gray-600">
            Update your content scrap. Changes will be saved with a new timestamp.
          </p>
          <div className="mt-3 text-sm text-gray-500">
            Created: {new Date(scrap.createdAt).toLocaleDateString()} • 
            Last updated: {new Date(scrap.updatedAt).toLocaleDateString()}
          </div>
        </div>

        <div className="bg-white shadow-sm rounded-lg border border-gray-200">
          <div className="px-8 py-6">
            <form onSubmit={handleSubmit} className="space-y-8">
              <div>
                <label htmlFor="content" className="block text-lg font-medium text-gray-900 mb-2">
                  Content
                </label>
                <textarea
                  name="content"
                  id="content"
                  required
                  rows={12}
                  value={formData.content}
                  onChange={handleInputChange}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-base px-4 py-3 border resize-none"
                />
                <p className="mt-2 text-sm text-gray-500">
                  Edit your content above. Changes will be automatically timestamped.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="x" className="block text-lg font-medium text-gray-900 mb-2">
                    X Position
                  </label>
                  <input
                    type="number"
                    name="x"
                    id="x"
                    value={formData.x}
                    onChange={handleInputChange}
                    min={0}
                    max={999999}
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-base px-4 py-3 border"
                  />
                  <p className="mt-2 text-sm text-gray-500">
                    Horizontal position on the corkboard (0-999999)
                  </p>
                </div>

                <div>
                  <label htmlFor="y" className="block text-lg font-medium text-gray-900 mb-2">
                    Y Position
                  </label>
                  <input
                    type="number"
                    name="y"
                    id="y"
                    value={formData.y}
                    onChange={handleInputChange}
                    min={0}
                    max={999999}
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-base px-4 py-3 border"
                  />
                  <p className="mt-2 text-sm text-gray-500">
                    Vertical position on the corkboard (0-999999)
                  </p>
                </div>
              </div>

              {_error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                  <div className="text-red-800 text-sm font-medium">{_error}</div>
                </div>
              )}

              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="px-6 py-3 border border-gray-300 rounded-md text-base font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !formData.content.trim()}
                  className="px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Updating Scrap...' : 'Update Scrap'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </StudioLayout>
  );
}