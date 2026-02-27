import React, { useCallback, useEffect, useState } from 'react';
import { ScoringDimension, ScoreSummary } from '../../types';
import { ScoreInput } from './ScoreInput';
import * as scoresApi from '../../api/scores';
import * as dimensionsApi from '../../api/dimensions';

interface Props {
  roomId: string;
  workspaceId: string;
  readOnly?: boolean;
}

export function ScoreMatrix({ roomId, workspaceId, readOnly }: Props) {
  const [summary, setSummary] = useState<ScoreSummary[]>([]);
  const [dimensions, setDimensions] = useState<ScoringDimension[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [s, d] = await Promise.allSettled([
        scoresApi.getScoreSummary(roomId),
        dimensionsApi.listDimensions(workspaceId),
      ]);
      if (s.status === 'fulfilled') setSummary(s.value);
      if (d.status === 'fulfilled') setDimensions(d.value);
    } finally {
      setLoading(false);
    }
  }, [roomId, workspaceId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleScore = async (proposalId: string, dimensionId: string, value: number) => {
    try {
      await scoresApi.upsertScore(proposalId, dimensionId, value);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to save score');
    }
  };

  if (loading) return <p className="text-sm text-gray-400">Loading scores...</p>;

  if (dimensions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400 text-sm">
        No scoring dimensions configured. Add dimensions to enable scoring.
      </div>
    );
  }

  if (summary.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400 text-sm">
        No proposals to score yet.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-2 pr-4 font-medium text-gray-700">Proposal</th>
            {dimensions.map((dim) => (
              <th key={dim.id} className="text-center py-2 px-2 font-medium text-gray-700">
                <div>{dim.name}</div>
                <div className="text-xs font-normal text-gray-400">{dim.weight}x</div>
              </th>
            ))}
            <th className="text-center py-2 pl-4 font-medium text-gray-700">Weighted Avg</th>
          </tr>
        </thead>
        <tbody>
          {summary.map((row) => (
            <tr key={row.proposal_id} className="border-b border-gray-100">
              <td className="py-3 pr-4 font-medium text-gray-900">{row.proposal_title}</td>
              {dimensions.map((dim) => {
                const dimScore = row.dimensions.find((d) => d.dimension_id === dim.id);
                return (
                  <td key={dim.id} className="py-3 px-2">
                    <div className="space-y-1">
                      <ScoreInput
                        dimension={dim}
                        value={dimScore?.user_score ?? null}
                        onChange={(val) => handleScore(row.proposal_id, dim.id, val)}
                        readOnly={readOnly}
                      />
                      {dimScore && dimScore.count > 0 && (
                        <div className="text-xs text-gray-400 text-center">
                          avg: {dimScore.average.toFixed(1)} ({dimScore.count})
                        </div>
                      )}
                    </div>
                  </td>
                );
              })}
              <td className="py-3 pl-4 text-center">
                <span className="inline-block px-2 py-1 bg-indigo-50 text-indigo-700 rounded font-semibold">
                  {row.weighted_average.toFixed(2)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
