# J.A Services -- Phase 1 backend

This is the Next.js migration of the site (visually/functionally identical
to the old static `index.html`) plus the first backend building blocks.

## What's done

- **Frontend migrated 1:1** -- `src/app/page.tsx` embeds the exact same
  CSS/HTML/JS from the old `index.html`, split into `public/js/site.js` and
  inline styles. Verified it builds and prerenders with no changes to markup.
- **Supabase schema** (`supabase/schema.sql`) -- profiles, products,
  masterclass tiers (+ a *separate*, non-public table for the WhatsApp link),
  enrollments, bookings, orders/order_items, a provider-agnostic `payments`
  ledger, and `visitor_events`. Row Level Security throughout: customers can
  only see their own bookings/orders/enrollments; payment status can only
  ever be written by the server (webhook), never the client.
- **Visitor tracking** -- `src/lib/track.ts` + `<VisitorTracker />`, logs a
  `page_view` event (with session id) on load and on every in-app
  navigation.
- **Payment layer** -- `src/lib/payments/` defines a provider-agnostic
  interface; `campay.ts` implements it against Campay's `/token/`,
  `/collect/`, `/transaction/` endpoints. `/api/payments/checkout` starts a
  payment (looks up the real amount server-side, never trusts the client).
  `/api/payments/webhook/campay` receives Campay's webhook, **re-verifies the
  transaction status directly against Campay's API** (doesn't trust the
  webhook body alone), then flips the enrollment/order to paid.
- **WhatsApp link auto-reveal** -- `/api/enrollments/[id]/whatsapp-link`
  only returns the link once `status = 'confirmed'`, and the link itself
  lives in a table with no public read policy at all.

## What's NOT done yet (next phases, per the roadmap)

- Auth pages (sign up/in, email + phone OTP) -- Phase 2
- Admin dashboard -- Phase 4 (note: the *old* frontend has a hardcoded
  client-side "admin" password in `site.js` (`STAFF_PASSWORD`) -- that's not
  real auth and should be replaced, not extended)
- AI assistant widget -- Phase 5
- WhatsApp Business API -- Phase 6
- CinetPay/NotchPay adapters (interface is ready, just needs an
  implementation file each, same shape as `campay.ts`)
- Frontend UI to actually call `/api/payments/checkout` from the "Choose
  payment method" section, and to poll/subscribe for the WhatsApp link --
  right now the backend exists but the old frontend JS still shows the
  manual "send a screenshot on WhatsApp" flow. Wiring that button up is a
  quick next step once you've confirmed the schema.

## Setup

1. Create a Supabase project at supabase.com.
2. In the SQL editor, run `supabase/schema.sql`.
3. Copy `.env.example` to `.env.local` and fill in your Supabase keys
   (Project Settings -> API) and Campay app credentials once you've signed
   up at campay.net.
4. Insert your masterclass tier(s) and their real WhatsApp link:
   ```sql
   insert into masterclass_tiers (name, price_xaf, description)
   values ('Standard', 25000, 'Full masterclass access')
   returning id; -- copy this id

   insert into masterclass_tier_secrets (tier_id, whatsapp_group_link)
   values ('<id from above>', 'https://chat.whatsapp.com/...');
   ```
5. `npm install && npm run dev` to run locally.
6. Deploy: push this to the GitHub repo (replacing the old static files) and
   Vercel will pick it up automatically as a Next.js project -- add the same
   env vars in the Vercel project settings.

## Testing the payment flow before going live

Campay has a sandbox (`CAMPAY_BASE_URL=https://demo.campay.net/api`) --
use that first. Point the webhook URL in your Campay dashboard at
`https://<your-deployed-domain>/api/payments/webhook/campay` (webhooks can't
reach `localhost`, so use a tunnel like `ngrok` for local testing, or test
against a Vercel preview deployment).
