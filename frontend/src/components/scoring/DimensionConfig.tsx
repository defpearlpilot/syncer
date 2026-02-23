import React, { useEffect, useState } from 'react';
import { ScoringDimension } from '../../types';
import { Button } from '../common/Button';
import * as dimensionsApi from '../../api/dimensions';

interface Props {
  roomId: string;
}

export function DimensionConfig({ roomId }: Props) {
  const [dimensions, setDimensions] = useState<ScoringDimension[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [scaleType, setScaleType] = useState('numeric_range');
  const [min, setMin] = useState(1);
  const [max, setMax] = useState(5);
  const [weight, setWeight] = useState(1.0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    dimensionsApi.listDimensions(roomId).then(setDimensions).catch(() => {});
  }, [roomId]);

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
    setLoading(true);
    try {
      const dim = await dimensionsApi.createDimension(roomId, {
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
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await dimensionsApi.deleteDimension(id);
      setDimensions((prev) => prev.filter((d) => d.id !== id));
    } catch {
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700">Scoring Dimensions</h3>
        <Button size="sm" variant="secondary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : 'Add Dimension'}
        </Button>
      </div>

      {dimensions.length === 0 && !showForm && (
        <p className="text-sm text-gray-400">No dimensions configured yet.</p>
      )}

      {dimensions.length > 0 && (
        <div className="space-y-2 mb-3">
          {dimensions.map((dim) => (
            <div key={dim.id} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded">
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

      {showForm && (
        <form onSubmit={handleAdd} className="space-y-3 border-t border-gray-200 pt-3">
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
          <Button type="submit" size="sm" disabled={loading}>
            {loading ? 'Adding...' : 'Add'}
          </Button>
        </form>
      )}
    </div>
  );
}
