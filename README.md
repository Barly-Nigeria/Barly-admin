# Barly Admin

Employee admin for Barly, a drinks and celebration-packages business. Staff can review orders and customers; managers can change prices and pay vendors.

Payouts and newsletters are recorded in the app. They are not sent to a bank or mailbox.

## Run locally

```bash
npm install
npx prisma migrate dev
npx prisma db seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Demo logins

| Role    | Email               | Password     |
| ------- | ------------------- | ------------ |
| Manager | olivia@barly.admin  | barly-admin  |
| Staff   | tunde@barly.ops     | barly-ops    |

Managers can create packages and items, change prices, and record vendor payouts. Staff can update order status, view the catalog, and send simulated campaigns.

## What you can do

- See orders and move them from pending to fulfilled
- Create packages and SKUs, then change prices
- Watch cash inflows from paid orders and outflows from payouts
- Pay vendors (recorded locally)
- See who joined, spend, favourite occasions/packages, and age groups
- Send a newsletter or birthday reminders (stored as campaigns)

Currency is Nigerian naira (₦).
