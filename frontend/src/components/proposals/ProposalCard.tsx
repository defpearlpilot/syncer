import React from 'react';
import { Link } from 'react-router-dom';
import { Proposal } from '../../types';

interface Props {
  proposal: Proposal;
  selected?: boolean;
  onClick?: () => void;
  linkTo?: string;
}

export function ProposalCard({ proposal, selected, onClick, linkTo }: Props) {
  const className = `bg-white border rounded-lg p-4 ${
    selected ? 'border-indigo-500 ring-2 ring-indigo-200' : 'border-gray-200'
  } ${onClick || linkTo ? 'cursor-pointer hover:border-gray-300' : ''}`;

  const content = (
    <>
      <h3 className="font-medium text-gray-900">{proposal.title}</h3>
      {proposal.body && (
        <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{proposal.body}</p>
      )}
      <p className="text-xs text-gray-400 mt-2">
        {new Date(proposal.created_at).toLocaleDateString()}
      </p>
    </>
  );

  if (linkTo) {
    return (
      <Link to={linkTo} className={`block ${className}`}>
        {content}
      </Link>
    );
  }

  return (
    <div onClick={onClick} className={className}>
      {content}
    </div>
  );
}
