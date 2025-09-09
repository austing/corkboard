'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
}

interface AddScrapModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScrapAdded: () => void;
}

export default function AddScrapModal({ isOpen, onClose, onScrapAdded }: AddScrapModalProps) {
  const [formData, setFormData] = useState({
    content: '',
    x: '',
    y: '',
    userId: '',
  });
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [_error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

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
          ...formData,
          x: parseInt(formData.x) || 0,
          y: parseInt(formData.y) || 0,
        }),
      });

      if (response.ok) {
        setFormData({ content: '', x: '', y: '', userId: '' });
        onScrapAdded();
        onClose();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to create scrap');
      }
    } catch (error) {
      setError('An error occurred while creating the scrap');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Add New Scrap</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
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
              rows={4}
              required
              value={formData.content}
              onChange={handleInputChange}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-2 border"
              placeholder="Enter scrap content..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="x" className="block text-sm font-medium text-gray-700">
                X Coordinate
              </label>
              <input
                type="number"
                name="x"
                id="x"
                required
                value={formData.x}
                onChange={handleInputChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-2 border"
                placeholder="0"
              />
            </div>

            <div>
              <label htmlFor="y" className="block text-sm font-medium text-gray-700">
                Y Coordinate
              </label>
              <input
                type="number"
                name="y"
                id="y"
                required
                value={formData.y}
                onChange={handleInputChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-2 border"
                placeholder="0"
              />
            </div>
          </div>

          <div>
            <label htmlFor="userId" className="block text-sm font-medium text-gray-700">
              Owner <span className="text-gray-500">(optional, defaults to you)</span>
            </label>
            <select
              name="userId"
              id="userId"
              value={formData.userId}
              onChange={handleInputChange}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-2 border"
            >
              <option value="">Current user (default)</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.email})
                </option>
              ))}
            </select>
          </div>

          {error && (
            <div className="text-red-600 text-sm">{error}</div>
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
              {loading ? 'Creating...' : 'Create Scrap'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}