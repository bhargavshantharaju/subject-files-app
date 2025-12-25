# Subject Files App

A simple Next.js app that organizes uploaded files into *subjects* (folders) and uses Supabase for authentication and file storage.

Repository: https://github.com/bhargavshantharaju/subject-files-app


## Features (MVP)
- Google sign-in (Supabase Auth)
- Create and list Subjects (folders)
- Upload files into Subjects (Supabase Storage)
- Store file metadata in Supabase Postgres
- Signed URLs for downloads

## Local setup
1. Create a Supabase project and enable Google provider in Authentication.
2. Create a Storage bucket (recommended: `files`).
3. Create the following tables (SQL):

```sql
create extension if not exists "pgcrypto";

create table subjects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz default now(),
  created_by uuid references auth.users(id)
);

create table files (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid references subjects(id),
  name text,
  path text,
  size bigint,
  content_type text,
  uploaded_by uuid references auth.users(id),
  uploaded_at timestamptz default now()
);
```

4. Set environment variables in `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

5. Install and run locally:

```
npm install
npm run dev
```

## Deploy
- Deploy the Next.js app to Vercel and set the same environment variables there.
- Supabase handles DB & Storage; enable Google provider in Supabase Auth settings.

