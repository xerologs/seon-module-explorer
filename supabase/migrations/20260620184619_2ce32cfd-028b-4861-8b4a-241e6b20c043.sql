
CREATE TABLE public.skid_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  handle TEXT NOT NULL,
  handle_lower TEXT NOT NULL UNIQUE,
  secret_id TEXT NOT NULL UNIQUE,
  tier TEXT NOT NULL DEFAULT 'Basic',
  role TEXT NOT NULL DEFAULT 'user',
  total_lookups INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.skid_accounts TO service_role;
ALTER TABLE public.skid_accounts ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.usage_stats (
  user_id UUID NOT NULL PRIMARY KEY REFERENCES public.skid_accounts(id) ON DELETE CASCADE,
  daily_usage INTEGER NOT NULL DEFAULT 0,
  last_reset_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  one_time_credits INTEGER NOT NULL DEFAULT 0
);
GRANT ALL ON public.usage_stats TO service_role;
ALTER TABLE public.usage_stats ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.cases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.skid_accounts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.cases TO service_role;
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.case_findings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.skid_accounts(id) ON DELETE CASCADE,
  module_slug TEXT NOT NULL,
  module_name TEXT NOT NULL,
  module_category TEXT,
  query TEXT,
  result_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.case_findings TO service_role;
ALTER TABLE public.case_findings ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.chat_threads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.skid_accounts(id) ON DELETE CASCADE,
  case_id UUID REFERENCES public.cases(id) ON DELETE SET NULL,
  title TEXT NOT NULL DEFAULT 'New chat',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.chat_threads TO service_role;
ALTER TABLE public.chat_threads ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  thread_id UUID NOT NULL REFERENCES public.chat_threads(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.chat_messages TO service_role;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Seed master Xero account
INSERT INTO public.skid_accounts (handle, handle_lower, secret_id, tier, role)
VALUES ('xero', 'xero', 'XEROGOATLOLXD67', 'Lifetime', 'master_admin')
ON CONFLICT (handle_lower) DO NOTHING;
