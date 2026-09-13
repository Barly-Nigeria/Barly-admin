# Barly Admin

Employee admin for Barly, a drinks and celebration-packages business. Staff can review orders and customers; admins can manage catalog, picks, occasions, and teammates.

All data goes through **barly-api**.

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
npm run dev
```

Open [http://localhost:4783](http://localhost:4783).

`BARLY_API_BASE_URL` should point at the API (default `http://localhost:4000`). Invite emails use `ADMIN_APP_URL` on the API side (default `http://localhost:4783`).

### Seeded login

| Role  | Email              | Password    |
| ----- | ------------------ | ----------- |
| Admin | olivia@barly.admin | barly-admin |

These credentials are created by `make seed` in barly-api (`ADMIN_SEED_EMAIL` / `ADMIN_SEED_PASSWORD`). Invite additional Admin or Staff accounts from **Team**. Staff cannot open Team or send invites.

Admins can manage products, variants, picks, and occasions, and invite teammates. Staff can update order status, view the catalog, and email drinks.ng. Both roles can change their own password from **Account**.

## What you can do

- See paid orders and move them from paid to completed or cancelled
- Open an order breakdown, print the customer invoice, and print a vendor sheet
- Email drinks.ng the priced customer invoice
- Manage catalog, picks, and occasions
- See who joined, spend, favourite occasions/packages, and age groups
- Invite admins and staff, revoke pending invites, and deactivate members

Currency is Nigerian naira (₦).
