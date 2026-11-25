create table if not exists public.guild_sim_reports (
  report_id text primary key check (report_id ~ '^[A-Za-z0-9]{8,64}$'),
  character_id bigint not null,
  character_name text not null,
  dps double precision not null check (dps > 0 and dps <= 1000000000),
  scenario text not null,
  report_url text not null,
  report_date timestamptz,
  imported_at timestamptz not null default now(),
  sort_date timestamptz generated always as (coalesce(report_date, imported_at)) stored
);
create index if not exists guild_sim_reports_sort_idx on public.guild_sim_reports (sort_date desc, report_id desc);
alter table public.guild_sim_reports enable row level security;
revoke all on table public.guild_sim_reports from public, anon, authenticated;
grant select, insert on table public.guild_sim_reports to service_role;

create table if not exists public.guild_progress (
  character_id bigint not null,
  kind text not null check (kind in ('dungeon', 'dungeon-log', 'unlock', 'need')),
  entry_key text not null check (length(entry_key) between 1 and 120),
  data jsonb not null check (jsonb_typeof(data) = 'object'),
  updated_at timestamptz not null default now(),
  primary key (character_id, kind, entry_key)
);
create index if not exists guild_progress_kind_idx on public.guild_progress (kind, character_id, entry_key);
alter table public.guild_progress enable row level security;
revoke all on table public.guild_progress from public, anon, authenticated;
grant select, insert, update, delete on table public.guild_progress to service_role;

create table if not exists public.guild_dungeon_signups (
  dungeon_id text not null,
  character_id bigint not null,
  role text not null check (role in ('Tank', 'Healer', 'DPS', 'Flexible')),
  note text not null default '' check (length(note) <= 140),
  updated_at timestamptz not null default now(),
  primary key (dungeon_id, character_id)
);
create index if not exists guild_dungeon_signups_character_idx on public.guild_dungeon_signups (character_id, dungeon_id);
alter table public.guild_dungeon_signups enable row level security;
revoke all on table public.guild_dungeon_signups from public, anon, authenticated;
grant select, insert, update, delete on table public.guild_dungeon_signups to service_role;
