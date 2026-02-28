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
    Promise.allSettled([
      workspacesApi.getWorkspace(workspaceId),
      dimensionsApi.listDimensions(workspaceId),
    ])
      .then(([ws, dims]) => {
        if (ws.status === 'fulfilled') setWorkspace(ws.value);
        if (dims.status === 'fulfilled') setDimensions(dims.value);
      })
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

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editWeight, setEditWeight] = useState(1.0);
  const [saving, setSaving] = useState(false);

  const startEditing = (dim: ScoringDimension) => {
    setEditingId(dim.id);
    setEditName(dim.name);
    setEditWeight(dim.weight);
  };

  const cancelEditing = () => {
    setEditingId(null);
  };

  const handleSaveEdit = async (id: string) => {
    setSaving(true);
    try {
      const updated = await dimensionsApi.updateDimension(id, {
        name: editName,
        weight: editWeight,
      });
      setDimensions((prev) => prev.map((d) => (d.id === id ? updated : d)));
      setEditingId(null);
    } catch (err: any) {
      alert(err.message || 'Failed to update dimension');
    } finally {
      setSaving(false);
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
                  <div key={dim.id} className="px-4 py-3">
                    {editingId === dim.id ? (
                      <form onSubmit={(e) => { e.preventDefault(); handleSaveEdit(dim.id); }} className="flex items-center gap-3">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="flex-1 rounded-md border border-gray-300 px-2 py-1 text-sm"
                          required
                        />
                        <div className="flex items-center gap-1">
                          <label className="text-xs text-gray-500">Weight:</label>
                          <input
                            type="number"
                            step="0.1"
                            min="0.1"
                            value={editWeight}
                            onChange={(e) => setEditWeight(Number(e.target.value))}
                            className="w-16 rounded-md border border-gray-300 px-2 py-1 text-sm"
                          />
                        </div>
                        <button type="submit" disabled={saving} className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">
                          {saving ? 'Saving...' : 'Save'}
                        </button>
                        <button type="button" onClick={cancelEditing} className="text-xs text-gray-500 hover:text-gray-700">
                          Cancel
                        </button>
                      </form>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-sm font-medium text-gray-900">{dim.name}</span>
                          <span className="text-xs text-gray-400 ml-2">
                            {dim.scale_type} &middot; {dim.weight}x
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => startEditing(dim)}
                            className="text-xs text-indigo-600 hover:text-indigo-800"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(dim.id)}
                            className="text-xs text-red-500 hover:text-red-700"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    )}
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
