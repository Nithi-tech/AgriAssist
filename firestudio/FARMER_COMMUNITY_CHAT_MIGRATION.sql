-- WhatsApp-style Farmer Community Chat Migration
-- This script is idempotent and can be re-run safely

-- 1) Create tables
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null check (length(trim(content)) > 0),
  created_at timestamptz not null default now()
);

create table if not exists public.likes (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.messages(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (message_id, user_id)
);

create table if not exists public.replies (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.messages(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  reply_content text not null check (length(trim(reply_content)) > 0),
  created_at timestamptz not null default now()
);

-- 2) Create indexes for performance
create index if not exists idx_messages_created_at on public.messages(created_at);
create index if not exists idx_likes_message_id on public.likes(message_id);
create index if not exists idx_replies_message_id_created_at on public.replies(message_id, created_at);

-- 3) Create likes aggregate view for fast counts
create or replace view public.message_like_counts as
  select m.id as message_id, count(l.id)::int as like_count
  from public.messages m
  left join public.likes l on l.message_id = m.id
  group by m.id;

-- 4) Enable realtime for all tables
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.likes;
alter publication supabase_realtime add table public.replies;

-- 5) Enable Row Level Security (RLS)
alter table public.messages enable row level security;
alter table public.likes enable row level security;
alter table public.replies enable row level security;

-- 6) Create RLS policies

-- Read policies (all authenticated users can read everything)
create policy if not exists "read messages for all" on public.messages
  for select using (auth.role() = 'authenticated');

create policy if not exists "read likes for all" on public.likes
  for select using (auth.role() = 'authenticated');

create policy if not exists "read replies for all" on public.replies
  for select using (auth.role() = 'authenticated');

-- Insert policies (only as yourself)
create policy if not exists "insert own messages" on public.messages
  for insert with check (auth.uid() = user_id);

create policy if not exists "insert own likes" on public.likes
  for insert with check (auth.uid() = user_id);

create policy if not exists "insert own replies" on public.replies
  for insert with check (auth.uid() = user_id);

-- Delete policy for likes (to unlike)
create policy if not exists "delete own like" on public.likes
  for delete using (auth.uid() = user_id);
