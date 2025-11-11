-- Create users table
CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  spotify_id TEXT UNIQUE NOT NULL,
  email TEXT,
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create personas table
CREATE TABLE public.personas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  archetype TEXT NOT NULL,
  caption TEXT NOT NULL,
  traits JSONB NOT NULL DEFAULT '[]'::jsonb,
  recommendations JSONB NOT NULL DEFAULT '{}'::jsonb,
  rationale TEXT,
  style TEXT DEFAULT 'witty',
  listening_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  public_slug TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personas ENABLE ROW LEVEL SECURITY;

-- Users policies (users can only see their own data)
CREATE POLICY "Users can view their own data"
  ON public.users FOR SELECT
  USING (auth.uid()::text = spotify_id);

CREATE POLICY "Users can insert their own data"
  ON public.users FOR INSERT
  WITH CHECK (auth.uid()::text = spotify_id);

CREATE POLICY "Users can update their own data"
  ON public.users FOR UPDATE
  USING (auth.uid()::text = spotify_id);

-- Personas policies
CREATE POLICY "Users can view their own personas"
  ON public.personas FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = personas.user_id
      AND users.spotify_id = auth.uid()::text
    )
  );

CREATE POLICY "Anyone can view public personas"
  ON public.personas FOR SELECT
  USING (public_slug IS NOT NULL);

CREATE POLICY "Users can create their own personas"
  ON public.personas FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = user_id
      AND users.spotify_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can update their own personas"
  ON public.personas FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = personas.user_id
      AND users.spotify_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can delete their own personas"
  ON public.personas FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = personas.user_id
      AND users.spotify_id = auth.uid()::text
    )
  );

-- Create index for faster queries
CREATE INDEX idx_personas_user_id ON public.personas(user_id);
CREATE INDEX idx_personas_public_slug ON public.personas(public_slug);
CREATE INDEX idx_personas_created_at ON public.personas(created_at DESC);