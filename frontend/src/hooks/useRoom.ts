import { useCallback, useEffect, useReducer, useState } from 'react';
import { DecisionRoomWithStages, Proposal, ScoreSummary } from '../types';
import * as roomsApi from '../api/rooms';
import * as proposalsApi from '../api/proposals';
import * as scoresApi from '../api/scores';

interface RoomState {
  room: DecisionRoomWithStages | null;
  proposals: Proposal[];
  scoreSummary: ScoreSummary[];
}

type RoomAction =
  | { type: 'SET_ROOM'; room: DecisionRoomWithStages }
  | { type: 'SET_PROPOSALS'; proposals: Proposal[] }
  | { type: 'ADD_PROPOSAL'; proposal: Proposal }
  | { type: 'UPDATE_PROPOSAL'; proposal: Proposal }
  | { type: 'SET_SCORES'; scores: ScoreSummary[] };

function roomReducer(state: RoomState, action: RoomAction): RoomState {
  switch (action.type) {
    case 'SET_ROOM':
      return { ...state, room: action.room };
    case 'SET_PROPOSALS':
      return { ...state, proposals: action.proposals };
    case 'ADD_PROPOSAL':
      if (state.proposals.some((p) => p.id === action.proposal.id)) return state;
      return { ...state, proposals: [...state.proposals, action.proposal] };
    case 'UPDATE_PROPOSAL':
      return {
        ...state,
        proposals: state.proposals.map((p) =>
          p.id === action.proposal.id ? action.proposal : p
        ),
      };
    case 'SET_SCORES':
      return { ...state, scoreSummary: action.scores };
    default:
      return state;
  }
}

export function useRoom(roomId: string | undefined) {
  const [state, dispatch] = useReducer(roomReducer, {
    room: null,
    proposals: [],
    scoreSummary: [],
  });
  const [loading, setLoading] = useState(true);

  const loadRoom = useCallback(async () => {
    if (!roomId) return;
    try {
      const [room, proposals, scores] = await Promise.allSettled([
        roomsApi.getRoom(roomId),
        proposalsApi.listProposals(roomId),
        scoresApi.getScoreSummary(roomId),
      ]);
      if (room.status === 'fulfilled') dispatch({ type: 'SET_ROOM', room: room.value });
      if (proposals.status === 'fulfilled') dispatch({ type: 'SET_PROPOSALS', proposals: proposals.value });
      if (scores.status === 'fulfilled') dispatch({ type: 'SET_SCORES', scores: scores.value });
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  useEffect(() => {
    setLoading(true);
    loadRoom();
  }, [loadRoom]);

  const handleWsMessage = useCallback((data: any) => {
    switch (data.type) {
      case 'proposal_created':
        dispatch({ type: 'ADD_PROPOSAL', proposal: data.payload });
        break;
      case 'proposal_updated':
        dispatch({ type: 'UPDATE_PROPOSAL', proposal: data.payload });
        break;
      case 'score_updated':
        if (roomId) {
          scoresApi.getScoreSummary(roomId).then((scores) => {
            dispatch({ type: 'SET_SCORES', scores });
          }).catch(() => {});
        }
        break;
      case 'comment_created':
        break;
    }
  }, [roomId]);

  return {
    ...state,
    loading,
    dispatch,
    handleWsMessage,
    reload: loadRoom,
  };
}
