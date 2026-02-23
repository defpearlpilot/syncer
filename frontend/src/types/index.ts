export interface User {
  id: string;
  email: string;
  display_name: string;
  avatar_url: string | null;
  created_at: string;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface WorkspaceMember {
  workspace_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  joined_at: string;
}

export interface MemberInfo {
  user_id: string;
  display_name: string;
  email: string;
  role: string;
  joined_at: string;
}

export interface WorkspaceWithMembers extends Workspace {
  members: MemberInfo[];
}

export type StageType = 'propose' | 'discuss' | 'score' | 'review' | 'decide' | 'open';

export interface RoomStage {
  id: string;
  room_id: string;
  name: string;
  stage_type: StageType;
  position: number;
  created_at: string;
}

export interface DecisionRoom {
  id: string;
  workspace_id: string;
  title: string;
  description: string;
  current_stage_id: string | null;
  created_by: string;
  decided_proposal_id: string | null;
  decision_summary: string | null;
  decided_by: string | null;
  decided_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DecisionRoomWithStages extends DecisionRoom {
  stages: RoomStage[];
  current_stage: RoomStage | null;
}

export interface ScoringDimension {
  id: string;
  room_id: string;
  name: string;
  scale_type: 'numeric_range' | 't_shirt' | 'custom_labels';
  scale_config: any;
  weight: number;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface Proposal {
  id: string;
  room_id: string;
  title: string;
  body: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: string;
  room_id: string;
  proposal_id: string | null;
  parent_id: string | null;
  body: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  replies?: Comment[];
  author_name?: string;
}

export interface Score {
  id: string;
  proposal_id: string;
  dimension_id: string;
  user_id: string;
  value: number;
  created_at: string;
  updated_at: string;
}

export interface ScoreSummary {
  proposal_id: string;
  proposal_title: string;
  dimensions: {
    dimension_id: string;
    dimension_name: string;
    weight: number;
    average: number;
    user_score: number | null;
    count: number;
  }[];
  weighted_average: number;
}

export interface ApiError {
  error: string;
}
