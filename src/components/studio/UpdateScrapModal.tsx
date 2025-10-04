'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

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

interface EditScrapModalProps {
  isOpen: boolean;
  scrap: Scrap | null;
  onClose: () => void;
  onScrapUpdated: () => void;
}

export default function EditScrapModal({ isOpen, scrap, onClose, onScrapUpdated }: EditScrapModalProps) {
  const [formData, setFormData] = useState({
    content: '',
    x: 0,
    y: 0,
  });
  const [loading, setLoading] = useState(false);
  const [_error, setError] = useState('');

  useEffect(() => {
    if (isOpen && scrap) {
      setFormData({
        content: scrap.content,
        x: scrap.x,
        y: scrap.y,
      });
    }
  }, [isOpen, scrap]);

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
        onScrapUpdated();
        onClose();
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

  if (!isOpen || !scrap) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Edit Scrap #{scrap.code}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-700">
              Content
            </label>
            <textarea
              name="content"
              id="content"
              required
              rows={4}
              value={formData.content}
              onChange={handleInputChange}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-2 border"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="x" className="block text-sm font-medium text-gray-700">
                X Position
              </label>
              <input
                type="number"
                name="x"
                id="x"
                value={formData.x}
                onChange={handleInputChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-2 border"
              />
            </div>

            <div>
              <label htmlFor="y" className="block text-sm font-medium text-gray-700">
                Y Position
              </label>
              <input
                type="number"
                name="y"
                id="y"
                value={formData.y}
                onChange={handleInputChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-2 border"
              />
            </div>
          </div>

          {_error && (
            <div className="text-red-600 text-sm">{_error}</div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Update Scrap'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}