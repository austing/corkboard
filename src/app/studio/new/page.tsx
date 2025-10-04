'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import StudioLayout from '@/components/studio/layout/StudioLayout';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';


export default function NewScrapPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    content: '',
    x: 0,
    y: 0,
  });
  const [loading, setLoading] = useState(false);
  const [_error, setError] = useState('');

  useEffect(() => {
    document.title = 'Corkboard > Scraps and Settings > New';
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/scraps', {
        method: 'POST',
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
        setError(data.error || 'Failed to create scrap');
      }
    } catch (err) {
      setError('An error occurred while creating the scrap');
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
          <h1 className="text-3xl font-bold text-gray-900">Create New Scrap</h1>
          <p className="mt-2 text-gray-600">
            Add a new content scrap to your corkboard. Each scrap will be assigned a unique code and can be positioned anywhere on your virtual board.
          </p>
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
                  placeholder="Enter your content here... This could be a note, idea, snippet, or any text you want to save to your corkboard."
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-base px-4 py-3 border resize-none"
                />
                <p className="mt-2 text-sm text-gray-500">
                  Write your content above. You can include text, notes, code snippets, or any other information.
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
                  {loading ? 'Creating Scrap...' : 'Create Scrap'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </StudioLayout>
  );
}