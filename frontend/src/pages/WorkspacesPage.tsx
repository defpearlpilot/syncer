import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Workspace } from '../types';
import * as workspacesApi from '../api/workspaces';
import { Navbar } from '../components/layout/Navbar';

export function WorkspacesPage() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    workspacesApi.listWorkspaces()
      .then(setWorkspaces)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const ws = await workspacesApi.createWorkspace(name, slug);
      setWorkspaces((prev) => [ws, ...prev]);
      setShowCreate(false);
      setName('');
      setSlug('');
    } catch (err: any) {
      setError(err.message || 'Failed to create workspace');
    }
  };

  const autoSlug = (value: string) => {
    setName(value);
    setSlug(value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Workspaces</h1>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm font-medium"
          >
            New Workspace
          </button>
        </div>

        {showCreate && (
          <form onSubmit={handleCreate} className="bg-white p-6 rounded-lg shadow mb-6 space-y-4">
            {error && (
              <div className="bg-red-50 text-red-700 p-3 rounded text-sm">{error}</div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => autoSlug(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Slug</label>
              <input
                type="text"
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <p className="mt-1 text-xs text-gray-500">URL-friendly identifier (lowercase, hyphens)</p>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm font-medium"
              >
                Create
              </button>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : workspaces.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg">No workspaces yet</p>
            <p className="text-sm mt-1">Create one to get started</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {workspaces.map((ws) => (
              <Link
                key={ws.id}
                to={`/workspaces/${ws.id}`}
                className="block bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
              >
                <h2 className="text-lg font-semibold text-gray-900">{ws.name}</h2>
                <p className="text-sm text-gray-500 mt-1">/{ws.slug}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
