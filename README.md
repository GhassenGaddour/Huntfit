# HuntFit v2 — Setup Guide

## What's New
- Login / Sign up with email + password
- Each user has their own saved collection
- Fixed chatbot that searches the real web for products
- All 100% free

## Setup (3 services, all free)

### 1. Gemini API Key (you already have this)
Keep your existing key from https://aistudio.google.com/apikey

### 2. Supabase (free database + login system)

**Create account:**
1. Go to https://supabase.com and sign up (free)
2. Click "New Project"
3. Name it `huntfit`, set a database password (save it), pick the closest region
4. Wait ~2 minutes for it to set up

**Get your keys:**
1. Go to Settings → API
2. Copy the "Project URL" (looks like `https://xxxx.supabase.co`)
3. Copy the "anon public" key (the long one starting with `eyJ...`)

**Create the database table:**
1. In Supabase, go to "SQL Editor" in the left sidebar
2. Click "New query"
3. Paste this ENTIRE block and click "Run":

```sql
create table user_collections (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade unique,
  items jsonb default '[]'::jsonb,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

alter table user_collections enable row level security;

create policy "Users can view their own data"
  on user_collections for select
  using (auth.uid() = user_id);

create policy "Users can insert their own data"
  on user_collections for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own data"
  on user_collections for update
  using (auth.uid() = user_id);
```

4. You should see "Success" — that's it!

**Optional — disable email confirmation (recommended for testing):**
1. Go to Authentication → Providers → Email
2. Turn OFF "Confirm email"
3. Click Save
This lets users sign up and immediately log in without checking their email.

### 3. Vercel Environment Variables

Go to your Vercel project → Settings → Environment Variables.
You need FOUR variables total:

| Name | Value |
|------|-------|
| `GEMINI_API_KEY` | Your Gemini key (`AIzaSy...`) |
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL (`https://xxxx.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key (`eyJ...`) |

After adding these, go to Deployments → Redeploy.

### 4. Update GitHub

Delete all old files and upload the new ones from huntfit-v2.zip.
Your repo should look like:

```
app/
  layout.jsx
  page.jsx
  api/
    chat/
      route.js
package.json
next.config.js
vercel.json
README.md
```

## How It Works
1. Users sign up with email + password
2. They search for clothes via the chatbot
3. Results are real products found via Google Search
4. Items automatically save to their personal collection
5. Collections persist between sessions (stored in Supabase)
