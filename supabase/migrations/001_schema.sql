-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Integrations
CREATE TABLE integrations (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id              UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plataforma           TEXT NOT NULL CHECK (plataforma IN ('instagram','facebook')),
  external_account_id  TEXT NOT NULL,
  nome_conta           TEXT,
  access_token_enc     TEXT NOT NULL,
  webhook_secret       TEXT,
  is_active            BOOLEAN NOT NULL DEFAULT TRUE,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, plataforma, external_account_id)
);

-- Leads
CREATE TABLE leads (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  integration_id    UUID REFERENCES integrations(id) ON DELETE SET NULL,
  nome              TEXT,
  username          TEXT,
  mensagem          TEXT NOT NULL,
  origem            TEXT NOT NULL CHECK (origem IN ('comentario','dm')),
  status            TEXT NOT NULL DEFAULT 'novo' CHECK (status IN ('novo','respondido','arquivado')),
  plataforma        TEXT CHECK (plataforma IN ('instagram','facebook')),
  external_lead_id  TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Messages
CREATE TABLE messages (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id       UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  mensagem      TEXT NOT NULL,
  is_from_user  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_leads_user_status   ON leads(user_id, status);
CREATE INDEX idx_leads_user_created  ON leads(user_id, created_at DESC);
CREATE INDEX idx_messages_lead       ON messages(lead_id, created_at ASC);
CREATE INDEX idx_integrations_user   ON integrations(user_id);

-- updated_at trigger
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- RLS
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads        ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages     ENABLE ROW LEVEL SECURITY;

CREATE POLICY integrations_own ON integrations FOR ALL
  USING (user_id = auth.uid());

CREATE POLICY leads_own ON leads FOR ALL
  USING (user_id = auth.uid());

CREATE POLICY messages_own ON messages FOR ALL
  USING (lead_id IN (SELECT id FROM leads WHERE user_id = auth.uid()));
