-- Move scoring_dimensions from room-scoped to workspace-scoped

-- 1. Add workspace_id column (nullable initially)
ALTER TABLE scoring_dimensions
    ADD COLUMN workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE;

-- 2. Backfill workspace_id from decision_rooms via room_id
UPDATE scoring_dimensions sd
SET workspace_id = dr.workspace_id
FROM decision_rooms dr
WHERE sd.room_id = dr.id;

-- 3. Set workspace_id NOT NULL
ALTER TABLE scoring_dimensions
    ALTER COLUMN workspace_id SET NOT NULL;

-- 4. Drop the old unique constraint on (room_id, position)
ALTER TABLE scoring_dimensions
    DROP CONSTRAINT scoring_dimensions_room_id_position_key;

-- 5. Drop room_id column
ALTER TABLE scoring_dimensions
    DROP COLUMN room_id;

-- 6. Re-number positions per workspace to avoid collisions from merged rooms
WITH numbered AS (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY workspace_id ORDER BY position, created_at) - 1 AS new_pos
    FROM scoring_dimensions
)
UPDATE scoring_dimensions sd
SET position = numbered.new_pos
FROM numbered
WHERE sd.id = numbered.id;

-- 7. Add new unique constraint on (workspace_id, position)
ALTER TABLE scoring_dimensions
    ADD CONSTRAINT scoring_dimensions_workspace_id_position_key UNIQUE (workspace_id, position);
