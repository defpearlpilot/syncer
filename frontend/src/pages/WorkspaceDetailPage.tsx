import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { WorkspaceWithMembers, DecisionRoom } from '../types';
import * as workspacesApi from '../api/workspaces';
import * as roomsApi from '../api/rooms';
import { Navbar } from '../components/layout/Navbar';
import { Button } from '../components/common/Button';

export function WorkspaceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [workspace, setWorkspace] = useState<WorkspaceWithMembers | null>(null);
  const [rooms, setRooms] = useState<DecisionRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [roomTitle, setRoomTitle] = useState('');
  const [roomDesc, setRoomDesc] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteError, setInviteError] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState('');

  useEffect(() => {
    if (!id) return;
    Promise.all([
      workspacesApi.getWorkspace(id),
      roomsApi.listRooms(id),
    ])
      .then(([ws, r]) => { setWorkspace(ws); setRooms(r); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    try {
      const room = await roomsApi.createRoom(id, roomTitle, roomDesc || undefined);
      navigate(`/workspaces/${id}/rooms/${room.id}`);
    } catch (err: any) {
      alert(err.message || 'Failed to create room');
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setInviteError('');
    setInviteSuccess('');
    try {
      await workspacesApi.inviteMember(id, inviteEmail);
      setInviteSuccess(`Invited ${inviteEmail}`);
      setInviteEmail('');
      const updated = await workspacesApi.getWorkspace(id);
      setWorkspace(updated);
    } catch (err: any) {
      setInviteError(err.message || 'Failed to invite');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <p className="text-gray-500">Workspace not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
          <Link to="/workspaces" className="hover:text-gray-700">Workspaces</Link>
          <span>/</span>
          <span className="text-gray-900">{workspace.name}</span>
        </div>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{workspace.name}</h1>
            <p className="text-sm text-gray-500">/{workspace.slug}</p>
          </div>
        </div>

        {/* Decision Rooms */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Decision Rooms</h2>
            <Button size="sm" onClick={() => setShowCreateRoom(!showCreateRoom)}>
              {showCreateRoom ? 'Cancel' : 'New Room'}
            </Button>
          </div>

          {showCreateRoom && (
            <form onSubmit={handleCreateRoom} className="space-y-3 mb-4 pb-4 border-b border-gray-200">
              <input
                type="text"
                placeholder="Room title"
                required
                value={roomTitle}
                onChange={(e) => setRoomTitle(e.target.value)}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <input
                type="text"
                placeholder="Description (optional)"
                value={roomDesc}
                onChange={(e) => setRoomDesc(e.target.value)}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <Button type="submit" size="sm">Create Room</Button>
            </form>
          )}

          {rooms.length === 0 ? (
            <p className="text-gray-500 text-sm">No rooms yet. Create one to start making decisions together.</p>
          ) : (
            <div className="space-y-2">
              {rooms.map((room) => (
                <Link
                  key={room.id}
                  to={`/workspaces/${id}/rooms/${room.id}`}
                  className="block px-4 py-3 rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all"
                >
                  <h3 className="font-medium text-gray-900">{room.title}</h3>
                  {room.description && (
                    <p className="text-sm text-gray-500 mt-0.5">{room.description}</p>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Members */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Members</h2>
          <div className="space-y-3">
            {workspace.members.map((member) => (
              <div key={member.user_id} className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-gray-900">{member.display_name}</span>
                  <span className="text-sm text-gray-500 ml-2">{member.email}</span>
                </div>
                <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-100 text-gray-600 capitalize">
                  {member.role}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Invite */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Invite Member</h2>
          <form onSubmit={handleInvite} className="flex gap-2">
            <input
              type="email"
              placeholder="Email address"
              required
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="flex-1 rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
            />
            <Button type="submit" size="sm">Invite</Button>
          </form>
          {inviteError && <p className="mt-2 text-sm text-red-600">{inviteError}</p>}
          {inviteSuccess && <p className="mt-2 text-sm text-green-600">{inviteSuccess}</p>}
        </div>
      </div>
    </div>
  );
}
