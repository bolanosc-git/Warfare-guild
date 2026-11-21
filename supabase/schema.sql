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
