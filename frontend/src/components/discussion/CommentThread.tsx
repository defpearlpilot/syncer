import React, { useEffect, useState } from 'react';
import { Comment } from '../../types';
import { CommentItem } from './CommentItem';
import { CommentForm } from './CommentForm';
import * as commentsApi from '../../api/comments';

interface CommentWithAuthor extends Comment {
  author_name: string;
  replies: CommentWithAuthor[];
}

interface Props {
  roomId: string;
  canComment: boolean;
}

export function CommentThread({ roomId, canComment }: Props) {
  const [comments, setComments] = useState<CommentWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);

  const loadComments = async () => {
    try {
      const data = await commentsApi.listComments(roomId);
      setComments(data as unknown as CommentWithAuthor[]);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComments();
  }, [roomId]);

  const handleCreated = () => {
    loadComments();
  };

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Discussion</h3>
      {loading ? (
        <p className="text-sm text-gray-400">Loading...</p>
      ) : comments.length === 0 ? (
        <p className="text-sm text-gray-400 mb-3">No comments yet</p>
      ) : (
        <div className="space-y-1 mb-4">
          {comments.map((c) => (
            <CommentItem key={c.id} comment={c} />
          ))}
        </div>
      )}
      {canComment && (
        <CommentForm roomId={roomId} onCreated={handleCreated} />
      )}
    </div>
  );
}
