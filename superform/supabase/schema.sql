-- Superform V1 Schema
-- Run this in Supabase SQL editor

-- Enable UUID extension
create extension if not exists "pgcrypto";

-- Forms table
create table public.forms (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade, -- Removed NOT NULL
  title text not null default 'Untitled Form',
  slug text unique not null,
  settings jsonb not null default '{
    "ending_type": "simple",
    "ending_redirect_url": "",
    "ending_status_message": "Your response has been recorded.",
    "collect_email": false,
    "show_progress": true
  }'::jsonb,
  is_published boolean default false,
  created_at timestamp with time zone default timezone('utc', now()) not null,
  updated_at timestamp with time zone default timezone('utc', now()) not null
);

-- Questions table
create table public.questions (
  id uuid default gen_random_uuid() primary key,
  form_id uuid references public.forms(id) on delete cascade not null,
  type text not null check (type in (
    'short_text','long_text','multiple_choice','yes_no',
    'rating','email','phone','date','statement','file_upload'
  )),
  title text not null default 'Untitled Question',
  description text,
  placeholder text,
  required boolean default false,
  "order" integer not null default 0,
  options jsonb default '[]'::jsonb,
  logic jsonb default '[]'::jsonb,
  created_at timestamp with time zone default timezone('utc', now()) not null
);

-- Form styles table
create table public.form_styles (
  id uuid default gen_random_uuid() primary key,
  form_id uuid references public.forms(id) on delete cascade unique not null,
  art_direction text not null default 'minimal' check (art_direction in (
    'minimal','editorial','glass','brutalist','cinematic'
  )),
  surface text not null default 'flat' check (surface in ('flat','card','glass','frame')),
  typography text not null default 'md' check (typography in ('sm','md','lg','xl')),
  radius text not null default 'sm' check (radius in ('none','sm','md','full')),
  canvas jsonb default '{}'::jsonb,
  custom_tokens jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc', now()) not null,
  updated_at timestamp with time zone default timezone('utc', now()) not null
);

-- Responses table
create table public.responses (
  id uuid default gen_random_uuid() primary key,
  form_id uuid references public.forms(id) on delete cascade not null,
  started_at timestamp with time zone default timezone('utc', now()) not null,
  completed_at timestamp with time zone,
  metadata jsonb default '{}'::jsonb
);

-- Answers table
create table public.answers (
  id uuid default gen_random_uuid() primary key,
  response_id uuid references public.responses(id) on delete cascade not null,
  question_id uuid references public.questions(id) on delete cascade not null,
  value text not null default '',
  created_at timestamp with time zone default timezone('utc', now()) not null
);

-- Indexes
create index on public.questions (form_id, "order");
create index on public.responses (form_id);
create index on public.answers (response_id);

-- RLS Policies
alter table public.forms enable row level security;
alter table public.questions enable row level security;
alter table public.form_styles enable row level security;
alter table public.responses enable row level security;
alter table public.answers enable row level security;

-- Forms policies
create policy "Anyone can manage forms" on public.forms for all using (true) with check (true);

-- Questions policies
create policy "Anyone can manage questions" on public.questions for all using (true) with check (true);

-- Form styles policies
create policy "Anyone can manage styles" on public.form_styles for all using (true) with check (true);

-- Responses policies
create policy "Anyone can submit responses" on public.responses for insert with check (true);
create policy "Anyone can view responses" on public.responses for select using (true);

-- Answers policies
create policy "Anyone can submit answers" on public.answers for insert with check (true);
create policy "Anyone can view answers" on public.answers for select using (true);

-- Responses policies
create policy "Anyone can submit to published forms"
  on public.responses for insert
  with check (exists (
    select 1 from public.forms where id = form_id and is_published = true
  ));

create policy "Form owners can view responses"
  on public.responses for select
  using (exists (
    select 1 from public.forms where id = form_id and user_id = auth.uid()
  ));

-- Answers policies
create policy "Anyone can submit answers to published form responses"
  on public.answers for insert
  with check (true);

create policy "Form owners can view answers"
  on public.answers for select
  using (exists (
    select 1 from public.responses r
    join public.forms f on f.id = r.form_id
    where r.id = response_id and f.user_id = auth.uid()
  ));

-- Function: auto-update updated_at
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$ language plpgsql;

create trigger forms_updated_at before update on public.forms
  for each row execute function update_updated_at();

create trigger form_styles_updated_at before update on public.form_styles
  for each row execute function update_updated_at();
