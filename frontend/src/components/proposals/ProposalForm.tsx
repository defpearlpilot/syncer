import React, { useState } from 'react';
import { Button } from '../common/Button';
import * as proposalsApi from '../../api/proposals';
import { Proposal } from '../../types';

interface Props {
  roomId: string;
  onCreated: (proposal: Proposal) => void;
}

export function ProposalForm({ roomId, onCreated }: Props) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const proposal = await proposalsApi.createProposal(roomId, title, body || undefined);
      onCreated(proposal);
      setTitle('');
      setBody('');
    } catch (err: any) {
      setError(err.message || 'Failed to create proposal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
      <h3 className="text-sm font-semibold text-gray-700">New Proposal</h3>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <input
        type="text"
        placeholder="Proposal title"
        required
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
      />
      <textarea
        placeholder="Description (optional)"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
        className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
      />
      <Button type="submit" size="sm" disabled={loading}>
        {loading ? 'Adding...' : 'Add Proposal'}
      </Button>
    </form>
  );
}
