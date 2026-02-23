import React, { useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Proposal } from '../types';
import { Navbar } from '../components/layout/Navbar';
import { Sidebar } from '../components/layout/Sidebar';
import { RoomHeader } from '../components/room/RoomHeader';
import { ProposalList } from '../components/proposals/ProposalList';
import { ProposalForm } from '../components/proposals/ProposalForm';
import { CommentThread } from '../components/discussion/CommentThread';
import { ScoreMatrix } from '../components/scoring/ScoreMatrix';
import { DimensionConfig } from '../components/scoring/DimensionConfig';
import { DecisionBanner } from '../components/decision/DecisionBanner';
import { PresenceBar } from '../components/presence/PresenceBar';
import { WebSocketProvider } from '../contexts/WebSocketContext';
import { useRoom } from '../hooks/useRoom';
import { useWebSocket } from '../hooks/useWebSocket';
import { usePresence } from '../hooks/usePresence';

export function RoomPage() {
  const { id: workspaceId, roomId } = useParams<{ id: string; roomId: string }>();
  const { room, proposals, scoreSummary, loading, dispatch, handleWsMessage, reload } = useRoom(roomId);
  const { users, handlePresenceMessage } = usePresence();

  const onWsMessage = useCallback((data: any) => {
    handleWsMessage(data);
    handlePresenceMessage(data);
  }, [handleWsMessage, handlePresenceMessage]);

  const { connected, send } = useWebSocket({
    roomId: roomId || '',
    onMessage: onWsMessage,
    enabled: !!roomId,
  });

  const handleProposalCreated = (proposal: Proposal) => {
    dispatch({ type: 'ADD_PROPOSAL', proposal });
  };

  const handleDecided = () => {
    reload();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center py-20 text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!room || !workspaceId) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center py-20 text-gray-500">Room not found</div>
      </div>
    );
  }

  return (
    <WebSocketProvider connected={connected} send={send}>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar workspaceId={workspaceId} />
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-4xl mx-auto">
              <div className="text-sm text-gray-500 mb-2">
                <Link to={`/workspaces/${workspaceId}`} className="hover:text-gray-700">
                  Workspace
                </Link>
                <span className="mx-1">/</span>
                <span className="text-gray-900">{room.title}</span>
              </div>

              <RoomHeader room={room} />
              <PresenceBar users={users} connected={connected} />

              <div className="space-y-6">
                <DimensionConfig roomId={room.id} />
                <ProposalForm roomId={room.id} onCreated={handleProposalCreated} />
                <ProposalList proposals={proposals} />
                <CommentThread roomId={room.id} canComment={true} />
                <ScoreMatrix roomId={room.id} readOnly={false} />
                <DecisionBanner
                  room={room}
                  proposals={proposals}
                  scoreSummary={scoreSummary}
                  onDecided={handleDecided}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </WebSocketProvider>
  );
}
