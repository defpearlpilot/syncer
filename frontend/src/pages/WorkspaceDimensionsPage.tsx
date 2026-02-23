import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ScoringDimension, WorkspaceWithMembers } from '../types';
import { Navbar } from '../components/layout/Navbar';
import { Sidebar } from '../components/layout/Sidebar';
import { Button } from '../components/common/Button';
import * as workspacesApi from '../api/workspaces';
import * as dimensionsApi from '../api/dimensions';

export function WorkspaceDimensionsPage() {
  const { id: workspaceId } = useParams<{ id: string }>();
  const [workspace, setWorkspace] = useState<WorkspaceWithMembers | null>(null);
  const [dimensions, setDimensions] = useState<ScoringDimension[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [scaleType, setScaleType] = useState('numeric_range');
  const [min, setMin] = useState(1);
  const [max, setMax] = useState(5);
  const [weight, setWeight] = useState(1.0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!workspaceId) return;
    Promise.all([
      workspacesApi.getWorkspace(workspaceId),
      dimensionsApi.listDimensions(workspaceId),
    ])
      .then(([ws, dims]) => { setWorkspace(ws); setDimensions(dims); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [workspaceId]);

  const buildScaleConfig = () => {
    if (scaleType === 'numeric_range') {
      return { min, max, step: 1 };
    }
    if (scaleType === 't_shirt') {
      return { options: ['XS', 'S', 'M', 'L', 'XL'], values: [1, 2, 3, 4, 5] };
    }
    return { options: [{ label: 'Low', value: 1 }, { label: 'Medium', value: 2 }, { label: 'High', value: 3 }] };
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceId) return;
    setSubmitting(true);
    try {
      const dim = await dimensionsApi.createDimension(workspaceId, {
        name,
        scale_type: scaleType,
        scale_config: buildScaleConfig(),
        weight,
      });
      setDimensions((prev) => [...prev, dim]);
      setName('');
      setShowForm(false);
    } catch (err: any) {
      alert(err.message || 'Failed to add dimension');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await dimensionsApi.deleteDimension(id);
      setDimensions((prev) => prev.filter((d) => d.id !== id));
    } catch {
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center py-20 text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!workspace || !workspaceId) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center py-20 text-gray-500">Workspace not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar workspaceId={workspaceId} />
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-sm text-gray-500 mb-2">
              <Link to="/workspaces" className="hover:text-gray-700">Workspaces</Link>
              <span className="mx-1">/</span>
              <Link to={`/workspaces/${workspaceId}`} className="hover:text-gray-700">{workspace.name}</Link>
              <span className="mx-1">/</span>
              <span className="text-gray-900">Scoring Dimensions</span>
            </div>

            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Scoring Dimensions</h1>
              <Button size="sm" onClick={() => setShowForm(!showForm)}>
                {showForm ? 'Cancel' : 'Add Dimension'}
              </Button>
            </div>

            {showForm && (
              <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
                <form onSubmit={handleAdd} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600">Name</label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g., Expected Value"
                        className="mt-1 block w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600">Scale Type</label>
                      <select
                        value={scaleType}
                        onChange={(e) => setScaleType(e.target.value)}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
                      >
                        <option value="numeric_range">Numeric Range</option>
                        <option value="t_shirt">T-Shirt Sizes</option>
                        <option value="custom_labels">Custom Labels</option>
                      </select>
                    </div>
                  </div>
                  {scaleType === 'numeric_range' && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600">Min</label>
                        <input
                          type="number"
                          value={min}
                          onChange={(e) => setMin(Number(e.target.value))}
                          className="mt-1 block w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600">Max</label>
                        <input
                          type="number"
                          value={max}
                          onChange={(e) => setMax(Number(e.target.value))}
                          className="mt-1 block w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
                        />
                      </div>
                    </div>
                  )}
                  <div>
                    <label className="block text-xs font-medium text-gray-600">Weight</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      value={weight}
                      onChange={(e) => setWeight(Number(e.target.value))}
                      className="mt-1 block w-32 rounded-md border border-gray-300 px-2 py-1.5 text-sm"
                    />
                  </div>
                  <Button type="submit" size="sm" disabled={submitting}>
                    {submitting ? 'Adding...' : 'Add'}
                  </Button>
                </form>
              </div>
            )}

            {dimensions.length === 0 && !showForm && (
              <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
                <p className="text-sm text-gray-400">No dimensions configured yet. Add dimensions to enable scoring across all rooms.</p>
              </div>
            )}

            {dimensions.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-200">
                {dimensions.map((dim) => (
                  <div key={dim.id} className="flex items-center justify-between px-4 py-3">
                    <div>
                      <span className="text-sm font-medium text-gray-900">{dim.name}</span>
                      <span className="text-xs text-gray-400 ml-2">
                        {dim.scale_type} &middot; {dim.weight}x
                      </span>
                    </div>
                    <button
                      onClick={() => handleDelete(dim.id)}
                      className="text-xs text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
