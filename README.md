# Waypoint Franchise Advisors Cold Email System

This Next.js application serves as an Admin Dashboard to manage highly-personalized, AI-generated cold email campaigns orchestration by **Inngest**.

## Deployment (Vercel)

The database schema is pre-configured for **PostgreSQL**. The easiest deployment path is via Vercel:

1. Create a private repository on GitHub and commit this codebase.
2. Push the codebase to GitHub.
3. Log into [Vercel](https://vercel.com) and click **"Add New Project"**.
4. Import your newly pushed GitHub repository.
5. In the Vercel deployment setup screen, go to the **"Storage"** tab.
6. Click **"Create Database"** and select **Vercel Postgres**. (This will automatically populate your `DATABASE_URL` environment variable for production).
7. Click **Deploy**.

## Setting up API Keys (Post-Deployment)

Once Vercel finishes deploying your live link:
1. Visit your live URL (e.g., `https://waypoint-xyz.vercel.app`)
2. Navigate to **`/settings`**.
3. Input your **OpenAI API Key** and **Resend API Key** directly in the UI. They will be saved securely to the Vercel Postgres database.

## Integrating Inngest (Post-Deployment)

To let your background scripts run reliably:
1. Log into your Inngest Cloud Dashboard.
2. Create a new environment.
3. Link the environment to your live Vercel deploy URL (e.g., `https://waypoint-xyz.vercel.app/api/inngest`).

The Inngest orchestrator will now securely ping your deployed API routes to run the AI lead enricher, personalizer, and sender on their scheduled cron jobs!

## Local Development (Optional)

If you ever wish to develop locally again instead of trusting the live cloud DB:
1. Change `provider = "postgresql"` back to `sqlite` in `prisma/schema.prisma`.
2. Delete the `/prisma/migrations` folder and run `npx prisma migrate dev --name init`.
3. Add `DATABASE_URL="file:./dev.db"` to your local `.env`.
