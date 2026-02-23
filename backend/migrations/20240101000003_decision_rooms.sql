CREATE TABLE decision_rooms (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id        UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    title               TEXT NOT NULL,
    description         TEXT NOT NULL DEFAULT '',
    current_stage_id    UUID,
    created_by          UUID NOT NULL REFERENCES users(id),
    decided_proposal_id UUID,
    decision_summary    TEXT,
    decided_by          UUID REFERENCES users(id),
    decided_at          TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE room_stages (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id     UUID NOT NULL REFERENCES decision_rooms(id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    stage_type  TEXT NOT NULL DEFAULT 'open'
                    CHECK (stage_type IN ('propose', 'discuss', 'score', 'review', 'decide', 'open')),
    position    INT NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (room_id, position)
);

ALTER TABLE decision_rooms
    ADD CONSTRAINT fk_current_stage FOREIGN KEY (current_stage_id) REFERENCES room_stages(id);

CREATE TABLE room_members (
    room_id   UUID NOT NULL REFERENCES decision_rooms(id) ON DELETE CASCADE,
    user_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (room_id, user_id)
);

CREATE TABLE scoring_dimensions (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id      UUID NOT NULL REFERENCES decision_rooms(id) ON DELETE CASCADE,
    name         TEXT NOT NULL,
    scale_type   TEXT NOT NULL CHECK (scale_type IN ('numeric_range', 't_shirt', 'custom_labels')),
    scale_config JSONB NOT NULL,
    weight       REAL NOT NULL DEFAULT 1.0,
    position     INT NOT NULL,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (room_id, position)
);

CREATE TABLE proposals (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id     UUID NOT NULL REFERENCES decision_rooms(id) ON DELETE CASCADE,
    title       TEXT NOT NULL,
    body        TEXT NOT NULL DEFAULT '',
    created_by  UUID NOT NULL REFERENCES users(id),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE decision_rooms
    ADD CONSTRAINT fk_decided_proposal FOREIGN KEY (decided_proposal_id) REFERENCES proposals(id);

CREATE TABLE comments (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id     UUID NOT NULL REFERENCES decision_rooms(id) ON DELETE CASCADE,
    proposal_id UUID REFERENCES proposals(id) ON DELETE CASCADE,
    parent_id   UUID REFERENCES comments(id) ON DELETE CASCADE,
    body        TEXT NOT NULL,
    created_by  UUID NOT NULL REFERENCES users(id),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE scores (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proposal_id  UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
    dimension_id UUID NOT NULL REFERENCES scoring_dimensions(id) ON DELETE CASCADE,
    user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    value        REAL NOT NULL,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (proposal_id, dimension_id, user_id)
);
