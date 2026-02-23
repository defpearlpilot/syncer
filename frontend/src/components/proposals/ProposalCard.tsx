import React from 'react';
import { Proposal } from '../../types';

interface Props {
  proposal: Proposal;
  selected?: boolean;
  onClick?: () => void;
}

export function ProposalCard({ proposal, selected, onClick }: Props) {
  return (
    <div
      onClick={onClick}
      className={`bg-white border rounded-lg p-4 ${
        selected ? 'border-indigo-500 ring-2 ring-indigo-200' : 'border-gray-200'
      } ${onClick ? 'cursor-pointer hover:border-gray-300' : ''}`}
    >
      <h3 className="font-medium text-gray-900">{proposal.title}</h3>
      {proposal.body && (
        <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{proposal.body}</p>
      )}
      <p className="text-xs text-gray-400 mt-2">
        {new Date(proposal.created_at).toLocaleDateString()}
      </p>
    </div>
  );
}
