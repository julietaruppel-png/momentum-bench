# Momentum Bench — Deployment Guide

## What you're deploying
- `/admin` — password-protected panel to add/edit candidates and generate client links
- `/admin/candidates` — candidate list, add, edit, delete
- `/admin/tokens` — generate private links per client
- `/bench/[token]` — client-facing filterable candidate bench

---

## Step 1 — Run the database schema in Supabase

1. Go to your Supabase project → **SQL Editor**
2. Open `supabase-schema.sql` from this folder
3. Paste the entire contents and click **Run**
4. You should see "Success" — this creates the candidates and client_tokens tables

---

## Step 2 — Get your Supabase service role key

1. In Supabase → **Settings → API Keys**
2. Click the **Legacy anon, service_role API keys** tab
3. Copy the `service_role` key (starts with `eyJ...`)
4. Keep this safe — it has full database access

---

## Step 3 — Push code to GitHub

1. Create a new repository at github.com (name it `momentum-bench`)
2. Download this folder as a zip, unzip it
3. Open Terminal, navigate to the folder:
   ```
   cd momentum-bench
   git init
   git add .
   git commit -m "initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/momentum-bench.git
   git push -u origin main
   ```

---

## Step 4 — Deploy to Vercel

1. Go to vercel.com → **Add New Project**
2. Import your `momentum-bench` GitHub repository
3. Before clicking Deploy, click **Environment Variables** and add these:

| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://lhtfrmmuporsldmnmhtj.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxodGZybW11cG9yc2xkbW5taHRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY3MTY1OTcsImV4cCI6MjA5MjI5MjU5N30.xOp_dWTa0H2Uva6udTs62MnFZBeZ44A6VcjMDnUKWYU` |
| `SUPABASE_SERVICE_ROLE_KEY` | *(your service_role key from Step 2)* |
| `ADMIN_PASSWORD` | *(choose any password, e.g. `momentum2024`)* |

4. Click **Deploy**
5. Vercel gives you a URL like `momentum-bench.vercel.app`

---

## Step 5 — Test it

1. Go to `your-url.vercel.app/admin` → log in with your ADMIN_PASSWORD
2. Click **+ Add candidate** → fill in a test candidate → save
3. Go to **Client links** → generate a link for a test client → copy it
4. Open the link in an incognito window → you should see the bench with filters

---

## Day to day usage

**Adding a new screened candidate:**
1. `/admin/candidates` → + Add candidate
2. Fill in form fields (most come from the HubSpot form)
3. After screening: add Fathom URL, resume Drive link, recap summary, English level, availability, date screened
4. Toggle on skills manually based on what you confirmed in the call
5. Save

**Sending a bench link to a client:**
1. `/admin/tokens` → type client name → Generate link
2. Copy the link → send to client via Slack or email
3. To revoke access later: click Disable on that token

---

## Optional: Custom domain

In Vercel → your project → Settings → Domains → add your domain (e.g. `bench.salesmomentum.io`)
