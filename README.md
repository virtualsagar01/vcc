# Virtual Card Nepal

Premium e-commerce storefront for virtual dollar cards, prepaid cards, gift cards and game top-ups.

## Architecture

- **Frontend:** Next.js App Router + TypeScript + Tailwind CSS, deployed on Vercel.
- **Backend:** Express REST API, deployed on Render.
- **Database/Auth/Storage:** Supabase Postgres, Supabase Auth (admin only), and `payment-screenshots` Storage bucket.
- **Customer checkout:** No account required. Customer uploads an eSewa payment screenshot and receives a VCN order ID.
- **Admin:** Supabase email/password login. Render verifies the Supabase access token before protected actions.

## Local development

1. Create the Supabase project and run `supabase-schema.sql` in the Supabase SQL Editor.
2. Set `ADMIN_PASSWORD` and a long random `ADMIN_TOKEN_SECRET` only in Render. Never prefix either with `VITE_` or `NEXT_PUBLIC_`.
3. Copy `.env.example` values into the Vercel and Render environments as appropriate.
4. Install dependencies: `npm install`.
5. Run the frontend and backend together: `npm run dev`.

## Vercel variables

- `NEXT_PUBLIC_API_URL=https://YOUR-RENDER-SERVICE.onrender.com/api`
- `NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY`
- `NEXT_PUBLIC_ADMIN_ROUTE_PATH=/fkinr`

## Render variables

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` (server only; never expose this in Vercel)
- `SUPABASE_STORAGE_BUCKET=payment-screenshots`
- `ADMIN_PASSWORD` (Render only)
- `ADMIN_TOKEN_SECRET` (Render only)
- `FRONTEND_URL=https://YOUR-VERCEL-DOMAIN.vercel.app`
- `PORT` is supplied automatically by Render.

Render build command: `npm install && npm run build`

Render start command: `npm start`

## V2 deployment and configuration

### Render backend environment
Set these in the Render service Environment tab (never commit secret values):
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_STORAGE_BUCKET=payment-screenshots`
- `FRONTEND_URL=https://YOUR-VERCEL-DOMAIN`
- `ADMIN_PASSWORD`
- `ADMIN_TOKEN_SECRET`
- `PORT` (optional; Render supplies one automatically)

### Vercel frontend environment
- `NEXT_PUBLIC_API_URL=https://YOUR-RENDER-SERVICE.onrender.com/api`
- `NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY`
- `NEXT_PUBLIC_ADMIN_ROUTE_PATH=/fkinr`

Do not create `VITE_ADMIN_PASSWORD`, `NEXT_PUBLIC_ADMIN_PASSWORD`, or any other public password variable.

### Supabase
Run `supabase-schema.sql` in SQL Editor. The script creates the `reload_transactions` table and the `site-assets` bucket used for product/payment-method image uploads. The Render service role performs all database writes.

### Render
Build command: `npm install && npm run build`
Start command: `npm start`
The Express server listens on `0.0.0.0` and Render's `PORT`.

### Vercel
Deploy the Next.js frontend normally and point `NEXT_PUBLIC_API_URL` at the Render API. Configure the exact Vercel domain in Render's `FRONTEND_URL` CORS setting.
