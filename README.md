# Barly Admin

Employee admin for Barly, a drinks and celebration-packages business. Staff can review orders and customers; admins can change prices, pay vendors, and invite teammates.

Auth and team management go through **barly-api**. Catalog and orders still use the local Prisma database for now.

Payouts and newsletters are recorded in the app. They are not sent to a bank or mailbox.

## Run locally

1. Start [barly-api](../barly-api) on port 4000, apply migrations, and seed the first admin:

```bash
make migrate-up
make seed
```

2. Copy env and start this app:

```bash
cp .env.example .env
npm install
npx prisma migrate dev
npm run dev
```

Open [http://localhost:4783](http://localhost:4783).

`BARLY_API_BASE_URL` should point at the API (default `http://localhost:4000`). Invite emails use `ADMIN_APP_URL` on the API side (default `http://localhost:4783`).

### Seeded login

| Role  | Email              | Password    |
| ----- | ------------------ | ----------- |
| Admin | olivia@barly.admin | barly-admin |

These credentials are created by `make seed` in barly-api (`ADMIN_SEED_EMAIL` / `ADMIN_SEED_PASSWORD`). Invite additional Admin or Staff accounts from **Team**. Staff cannot open Team or send invites.

Admins can create packages and items, pick SKUs into packages, add item photos, change prices, onboard or remove vendors, and record vendor payouts. Staff can update order status, view the catalog, and send simulated campaigns. Both roles can change their own password from **Account**.

## What you can do

- See orders and move them from pending to fulfilled
- Open an order breakdown, calculate the customer invoice, and print it
- Send vendors a fulfilment sheet with SKUs and quantities only (no prices)
- Create packages and SKUs, pick items into packages, add item photos, then change prices
- Watch cash inflows from paid orders and outflows from payouts
- Onboard vendors with an address and email, or remove suppliers that have no catalog SKUs
- Pay vendors (recorded locally)
- See who joined, spend, favourite occasions/packages, and age groups
- Send a newsletter or birthday reminders (stored as campaigns)
- Invite admins and staff, revoke pending invites, and deactivate members

Currency is Nigerian naira (₦).
