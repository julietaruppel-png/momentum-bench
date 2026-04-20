-- Run this entire file in Supabase > SQL Editor

-- Candidates table
create table candidates (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  -- From form
  first_name text not null,
  last_name text not null,
  email text,
  phone text,
  social_url text,
  location text,
  is_us_based boolean default false,
  time_zones text[] default '{}',
  revops_background text,
  crm_experience text,
  hubspot_areas text[] default '{}',
  desired_salary text,
  proud_project text,

  -- Added by team after screening
  resume_drive_url text,
  fathom_recording_url text,
  recap_summary text,
  english_level text check (english_level in ('Intermediate', 'Advanced', 'Fluent')),
  availability text check (availability in ('Available now', '2 weeks notice', 'Part-time only', 'Not available')),
  internal_notes text,
  date_screened date,

  -- Skills (set manually by team after screening)
  -- CRM
  skill_hubspot boolean default false,
  skill_salesforce boolean default false,
  skill_zoho boolean default false,
  skill_pipedrive boolean default false,
  skill_gohighlevel boolean default false,
  skill_other_crm boolean default false,

  -- Automation & integrations
  skill_automation_tools boolean default false,  -- Zapier / Make / n8n grouped
  skill_api_integrations boolean default false,
  skill_webhooks boolean default false,

  -- Technical
  skill_sql boolean default false,
  skill_data_hygiene boolean default false,
  skill_crm_migrations boolean default false,
  skill_reporting_dashboards boolean default false,
  skill_ai_tools boolean default false,

  -- Sales ops
  skill_setter_closer boolean default false,
  skill_sales_enablement boolean default false,
  skill_change_management boolean default false,
  skill_forecasting boolean default false,
  skill_kpi_reviews boolean default false,

  -- Working style
  style_solo_operator boolean default false,
  style_team_environment boolean default false,
  style_client_facing boolean default false
);

-- Client access tokens table
create table client_tokens (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  client_name text not null,
  token text unique not null default encode(gen_random_bytes(12), 'hex'),
  active boolean default true,
  notes text
);

-- Admin password table (single row)
create table admin_config (
  id int primary key default 1,
  password_hash text not null
);

-- Insert default admin password: "momentum2024" (change this after setup)
insert into admin_config (password_hash) values ('$2a$10$placeholder_change_this');

-- Enable Row Level Security
alter table candidates enable row level security;
alter table client_tokens enable row level security;
alter table admin_config enable row level security;

-- Allow public read on candidates (tokens are validated in app logic)
create policy "Public can read candidates" on candidates for select using (true);

-- Only service role can write
create policy "Service role full access candidates" on candidates for all using (auth.role() = 'service_role');
create policy "Service role full access tokens" on client_tokens for all using (auth.role() = 'service_role');
create policy "Service role full access admin" on admin_config for all using (auth.role() = 'service_role');

-- Allow public read on tokens (for validation)
create policy "Public can read tokens" on client_tokens for select using (true);

-- Updated_at trigger
create or replace function update_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

create trigger candidates_updated_at before update on candidates
for each row execute function update_updated_at();
