# Supabase setup for Alphabet Flipper

This branch uses Supabase Auth + Postgres for accounts, access control and learner progress.

## 1. Create the free Supabase project

Create a Supabase project and copy:
- Project URL
- Publishable key

The browser only receives the publishable key. Never put the Supabase secret key in React, GitHub source, or any browser bundle.

## 2. Create the database

Open Supabase Dashboard -> SQL Editor and run:

supabase/schema.sql

## 3. Create the first admin

For the first admin only, create an Auth user in Authentication -> Users -> Add user.

Use the username convention: username + @login.alphabetflipper.app

Example: admin -> admin@login.alphabetflipper.app

Then copy the Auth user's UUID and run the two INSERT statements at the bottom of supabase/schema.sql, replacing AUTH_USER_UUID.

After this, disable public signups in Supabase Auth settings. The app itself has no public registration screen.

## 4. Deploy the protected admin Edge Function

Deploy:

supabase/functions/admin-users/index.ts

The function must have the Supabase secret key available as a server-side secret named:

SUPABASE_SECRET_KEY

Do NOT put this key in VITE_ variables or the React code.

The function is protected by the signed-in user's Supabase Auth token and checks the caller's profile role before performing admin actions.

## 5. Configure the React app

Copy .env.example to .env.local for local development and set:

VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...

For GitHub Pages, add the same two values as GitHub Actions repository secrets and expose them as build-time environment variables in the deployment workflow.

## 6. What is now stored remotely

- Supabase Auth: login credentials and sessions
- profiles: learner/admin identity, level, active state
- user_access: per-user Home/Learn/Games/Worksheets/Progress permissions
- user_progress: progress separated by LKG/UKG/Class 1

Passwords are never stored in the application's own database tables.

## 7. Important security rule

Never use a Supabase secret/service-role key in the React app. Supabase documents publishable keys as browser-safe when RLS is enabled, while secret keys bypass RLS and must remain server-side.
