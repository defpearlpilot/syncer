import React, { useState } from 'react';
import { Button } from '../common/Button';
import * as commentsApi from '../../api/comments';
import { Comment } from '../../types';

interface Props {
  roomId: string;
  proposalId?: string;
  parentId?: string;
  onCreated: (comment: Comment) => void;
  placeholder?: string;
}

export function CommentForm({ roomId, proposalId, parentId, onCreated, placeholder }: Props) {
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;
    setLoading(true);
    try {
      const comment = await commentsApi.createComment(roomId, body, proposalId, parentId);
      onCreated(comment);
      setBody('');
    } catch (err: any) {
      alert(err.message || 'Failed to add comment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        placeholder={placeholder || 'Add a comment...'}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
      />
      <Button type="submit" size="sm" disabled={loading || !body.trim()}>
        Send
      </Button>
    </form>
  );
}
