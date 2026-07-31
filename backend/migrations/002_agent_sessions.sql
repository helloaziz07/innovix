-- ============================================
-- Innovix — Agent Sessions Table
-- Run this in your Supabase SQL Editor
-- (only needed if you haven't run 001_create_tables.sql yet)
-- ============================================

-- This table stores bot conversation sessions for Telegram/WhatsApp/Web
CREATE TABLE IF NOT EXISTS agent_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    platform TEXT NOT NULL CHECK (platform IN ('telegram', 'whatsapp', 'web')),
    chat_id TEXT NOT NULL,
    conversation_history JSONB DEFAULT '[]',
    last_active TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(platform, chat_id)
);

CREATE INDEX IF NOT EXISTS idx_agent_sessions_user ON agent_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_sessions_platform_chat ON agent_sessions(platform, chat_id);
