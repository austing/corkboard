'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import AdminLayout from '@/components/layout/admin-layout';
import PermissionCheck from '@/guards/PermissionCheck';
import AddRoleModal from '@/components/admin/add-role-modal';
import EditRoleModal from '@/components/admin/edit-role-modal';
import { TrashIcon } from '@heroicons/react/24/outline';


interface Role {
  id: string;
  name: string;
  description: string;
  createdAt: number;
  permissions: string[];
}

export default function RolesPage() {
  const { data: _session } = useSession();
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [_error, setError] = useState('');

  useEffect(() => {
    document.title = 'Corkboard Admin';
  }, []);

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      const response = await fetch('/api/roles');
      if (response.ok) {
        const data = await response.json();
        setRoles(data.roles);
      } else {
        setError('Failed to fetch roles');
      }
    } catch (err) {
      setError('An error occurred while fetching roles');
    } finally {
      setLoading(false);
    }
  };

  const handleEditRole = (role: Role) => {
    setSelectedRole(role);
    setIsEditModalOpen(true);
  };

  const handleDeleteRole = async (roleId: string, roleName: string) => {
    if (!confirm(`Are you sure you want to delete the "${roleName}" role?`)) return;

    try {
      const response = await fetch(`/api/roles/${roleId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchRoles(); // Refresh the list
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete role');
      }
    } catch (err) {
      alert('An error occurred while deleting the role');
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-8">
          <div className="text-gray-500">Loading roles...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div>
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-xl font-semibold text-gray-900">Roles</h1>
            <p className="mt-2 text-sm text-gray-700">
              Manage user roles and their associated permissions.
            </p>
          </div>
          <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
            <PermissionCheck
              resource="roles"
              action="create"
              fallback={<div></div>}
            >
              <button
                type="button"
                onClick={() => setIsAddModalOpen(true)}
                className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 cursor-pointer"
              >
                Add role
              </button>
            </PermissionCheck>
          </div>
        </div>
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {roles.map((role) => (
            <div key={role.id} className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900 capitalize">
                  {role.name}
                </h3>
                <div className="flex space-x-2">
                  <PermissionCheck
                    resource="roles"
                    action="update"
                    fallback={<div></div>}
                  >
                    <button 
                      onClick={() => handleEditRole(role)}
                      className="text-indigo-600 hover:text-indigo-900 text-sm cursor-pointer"
                    >
                      Edit
                    </button>
                  </PermissionCheck>
                  <PermissionCheck
                    resource="roles"
                    action="delete"
                    fallback={<div></div>}
                  >
                    <button
                      onClick={() => handleDeleteRole(role.id, role.name)}
                      className="text-red-600 hover:text-red-900 cursor-pointer"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </PermissionCheck>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                {role.description || 'No description'}
              </p>
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">
                  Permissions ({role.permissions.length})
                </h4>
                <div className="space-y-1">
                  {role.permissions.slice(0, 3).map((permission) => (
                    <span
                      key={permission}
                      className="inline-block text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded-full mr-1"
                    >
                      {permission}
                    </span>
                  ))}
                  {role.permissions.length > 3 && (
                    <span className="inline-block text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded-full">
                      +{role.permissions.length - 3} more
                    </span>
                  )}
                </div>
              </div>
              <div className="text-xs text-gray-500">
                Created: {role.createdAt ? new Date(role.createdAt).toLocaleDateString() : 'N/A'}
              </div>
            </div>
          ))}
        </div>
        
        {_error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800">{_error}</p>
          </div>
        )}
      </div>
      
      <AddRoleModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onRoleAdded={fetchRoles}
      />
      
      <EditRoleModal
        isOpen={isEditModalOpen}
        role={selectedRole}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedRole(null);
        }}
        onRoleUpdated={fetchRoles}
      />
    </AdminLayout>
  );
}