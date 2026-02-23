import React from 'react';
import { Comment } from '../../types';

interface CommentWithAuthor extends Comment {
  author_name: string;
  replies: CommentWithAuthor[];
}

interface Props {
  comment: CommentWithAuthor;
  depth?: number;
}

export function CommentItem({ comment, depth = 0 }: Props) {
  return (
    <div className={depth > 0 ? 'ml-6 border-l-2 border-gray-100 pl-4' : ''}>
      <div className="py-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-900">{comment.author_name}</span>
          <span className="text-xs text-gray-400">
            {new Date(comment.created_at).toLocaleString()}
          </span>
        </div>
        <p className="text-sm text-gray-700 mt-1">{comment.body}</p>
      </div>
      {comment.replies?.map((reply) => (
        <CommentItem key={reply.id} comment={reply} depth={depth + 1} />
      ))}
    </div>
  );
}
