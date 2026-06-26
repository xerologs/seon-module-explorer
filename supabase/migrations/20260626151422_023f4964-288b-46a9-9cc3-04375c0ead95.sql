
-- 1. chat_messages: add user_id, backfill from chat_threads, enforce NOT NULL
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS user_id uuid;
UPDATE public.chat_messages m
SET user_id = t.user_id
FROM public.chat_threads t
WHERE m.thread_id = t.id AND m.user_id IS NULL;
ALTER TABLE public.chat_messages ALTER COLUMN user_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS chat_messages_user_id_idx ON public.chat_messages(user_id);

-- 2. Add explicit deny-all RLS policies for anon + authenticated on every public table.
--    All app access goes through the server using the service_role key, which bypasses RLS.
--    These policies make the "no policy" lint go away while keeping the Data API fully locked.

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'skid_accounts','usage_stats','cases','case_findings','chat_threads','chat_messages'
  ] LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Deny all anon access" ON public.%I', t);
    EXECUTE format('DROP POLICY IF EXISTS "Deny all authenticated access" ON public.%I', t);
    EXECUTE format(
      'CREATE POLICY "Deny all anon access" ON public.%I AS RESTRICTIVE FOR ALL TO anon USING (false) WITH CHECK (false)', t);
    EXECUTE format(
      'CREATE POLICY "Deny all authenticated access" ON public.%I AS RESTRICTIVE FOR ALL TO authenticated USING (false) WITH CHECK (false)', t);
  END LOOP;
END $$;

-- 3. Defense-in-depth: ensure secret_id column is never reachable by anon/authenticated even
--    if a future permissive policy is added by accident.
REVOKE ALL (secret_id) ON public.skid_accounts FROM anon, authenticated, PUBLIC;
