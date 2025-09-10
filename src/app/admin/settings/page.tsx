'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/layout/admin-layout';


export default function SettingsPage() {
  const [indexTitle, setIndexTitle] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    document.title = 'Corkboard Admin';
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    
    try {
      // Simulate saving - in real implementation, this would save to a config file or database
      await new Promise(resolve => setTimeout(resolve, 1000));
      setMessage('Settings saved successfully!');
    } catch (err) {
      setMessage('Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
        <p className="mt-2 text-sm text-gray-700">
          Configure system settings and preferences.
        </p>
        
        <div className="mt-8 space-y-6">
          {/* Index Title Setting */}
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Display Settings
              </h3>
              
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                <div className="sm:col-span-4">
                  <label htmlFor="index-title" className="block text-sm font-medium text-gray-700">
                    Index Title
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      name="index-title"
                      id="index-title"
                      value={indexTitle}
                      onChange={(e) => setIndexTitle(e.target.value)}
                      placeholder="Enter the title for the public index page"
                      className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md px-3 py-2 border"
                    />
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    This title will be displayed on the public index page where all scraps are listed.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* System Configuration */}
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                System Configuration
              </h3>
              <div className="mt-2 max-w-xl text-sm text-gray-500">
                <p>Additional configuration options will be added here as the system grows.</p>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 cursor-pointer"
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>

          {/* Message */}
          {message && (
            <div className={`p-4 rounded-md ${message.includes('success') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
              {message}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}