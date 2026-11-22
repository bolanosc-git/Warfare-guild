create table if not exists public.guild_progress (
  character_id bigint not null,
  kind text not null check (kind in ('dungeon', 'dungeon-log', 'unlock', 'need', 'wish')),
  entry_key text not null check (length(entry_key) between 1 and 120),
  data jsonb not null check (jsonb_typeof(data) = 'object'),
  updated_at timestamptz not null default now(),
  primary key (character_id, kind, entry_key)
);
create index if not exists guild_progress_kind_idx on public.guild_progress (kind, character_id, entry_key);

create table if not exists public.guild_events (
  id uuid primary key default gen_random_uuid(),
  character_id bigint not null,
  title text not null check (length(title) between 1 and 100),
  starts_at timestamptz not null,
  dungeon_id text,
  details text not null default '' check (length(details) <= 600),
  cancelled boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists guild_events_starts_idx on public.guild_events (starts_at, id) where not cancelled;

create table if not exists public.guild_event_rsvps (
  event_id uuid not null references public.guild_events(id) on delete cascade,
  character_id bigint not null,
  role text not null check (role in ('Tank', 'Healer', 'DPS')),
  status text not null check (status in ('Going', 'Maybe', 'Declined')),
  updated_at timestamptz not null default now(),
  primary key (event_id, character_id)
);

alter table public.guild_progress enable row level security;
alter table public.guild_events enable row level security;
alter table public.guild_event_rsvps enable row level security;
revoke all on table public.guild_progress, public.guild_events, public.guild_event_rsvps from public, anon, authenticated;
grant select, insert, update, delete on table public.guild_progress to service_role;
grant select, insert, update on table public.guild_events, public.guild_event_rsvps to service_role;
