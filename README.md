This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

##Things learned during process

-layout.tsx is root page
-page.tsx is home page ( main page or main route - route is a page in website )
-installed components from shadcn (eg: npx shadcn@latest add button) : learn more in shadcn official website
-Lucide react is for icon library (npm install lucide-react)

-navbar.tsx in components folder for header bar
-"use client" have to be on top of page to use useEffect, useState

sources used
-lucide icons
-inline svgs from font awesome icons
-svgs from simple icons

connecting with telegram bot
-bot create
-token in .env.local file
-route.ts in app/api/feedback/ to handle message data from user to send to bot
-input form in footer.tsx to get message data from user

backend part (admin dashboard)
-use Supabase (postgresql) for database
-integrate github with chatgpt

-These are steps done: (Setting at Supabase and creating tables)
Open Supabase Dashboard.
Sign in or create an account.
Select New project.
Choose your organization.
Set the project name to personal-portfolio.
Create a strong database password and save it somewhere secure.
Choose a region appropriate for your visitors.
Create the project and wait for it to finish provisioning.
Open SQL Editor in Supabase.
Select New query.
Open the migration file from GitHub.
Copy its complete SQL contents.
Paste into the SQL Editor.
Click Run.

(Setting up Supabase in project)
-npm install @supabase/supabase-js @supabase/ssr
-url and publishable key in env file

(Checking connection with Supabase and project)
-app/api/health/supabase/route.ts do this mission
-test the connection in localhost::3000/api/health/supabase and it shows json string success

Database
-create tables in Supabase
-inserting data and information

-api management files in nextjs for each table
-test security to limit access to admin dashboard
-crud for each information section to customize the information as wish
-limit submit rate for feedback ( to avoid spam messages requests )
-test validation for text, emails, other necessary information in each section (admin,profile,skills,projects,achievements,interests,site settings, contact messages)

## -rate limiting for deployment production

using Supabase PostgreSQL-backed rate limiter
