-- Run sign-ups are scoped by character and dungeon; only the server role can access them.
create table if not exists public.guild_dungeon_signups (
  dungeon_id text not null,
  character_id bigint not null,
  role text not null check (role in ('Tank', 'Healer', 'DPS', 'Flexible')),
  note text not null default '' check (length(note) <= 140),
  updated_at timestamptz not null default now(),
  primary key (dungeon_id, character_id)
);
create index if not exists guild_dungeon_signups_character_idx
  on public.guild_dungeon_signups (character_id, dungeon_id);
alter table public.guild_dungeon_signups enable row level security;
revoke all on table public.guild_dungeon_signups from public, anon, authenticated;
grant select, insert, update, delete on table public.guild_dungeon_signups to service_role;
