-- Create a table for storing user repertoires
create table repertoires (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  data jsonb,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Enforce one row per user (optional, depends on if you want multiple slots later)
  -- For now, let's assume one main repertoire per user
  unique(user_id)
);

-- Enable Row Level Security (RLS)
alter table repertoires enable row level security;

-- Create Policy: Users can only see their own data
create policy "Users can view own repertoire"
  on repertoires for select
  using ( auth.uid() = user_id );

-- Create Policy: Users can insert their own data
create policy "Users can insert own repertoire"
  on repertoires for insert
  with check ( auth.uid() = user_id );

-- Create Policy: Users can update their own data
create policy "Users can update own repertoire"
  on repertoires for update
  using ( auth.uid() = user_id );

-- Function to handle updated_at
create extension if not exists moddatetime schema extensions;

create trigger handle_updated_at before update on repertoires
  for each row execute procedure moddatetime (updated_at);
