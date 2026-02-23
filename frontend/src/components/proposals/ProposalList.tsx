import React from 'react';
import { Proposal } from '../../types';
import { ProposalCard } from './ProposalCard';

interface Props {
  proposals: Proposal[];
  selectedId?: string;
  onSelect?: (proposal: Proposal) => void;
}

export function ProposalList({ proposals, selectedId, onSelect }: Props) {
  if (proposals.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400 text-sm">
        No proposals yet
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {proposals.map((p) => (
        <ProposalCard
          key={p.id}
          proposal={p}
          selected={p.id === selectedId}
          onClick={onSelect ? () => onSelect(p) : undefined}
        />
      ))}
    </div>
  );
}
