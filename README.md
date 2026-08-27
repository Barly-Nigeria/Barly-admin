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

Open [http://localhost:4783](http://localhost:4783).

### Demo logins

| Role    | Email               | Password     |
| ------- | ------------------- | ------------ |
| Manager | olivia@barly.admin  | barly-admin  |
| Staff   | tunde@barly.ops     | barly-ops    |

Managers can create packages and items, change prices, onboard or remove vendors, and record vendor payouts. Staff can update order status, view the catalog, and send simulated campaigns.

## What you can do

- See orders and move them from pending to fulfilled
- Open an order breakdown, calculate the customer invoice, and print it
- Send vendors a fulfilment sheet with SKUs and quantities only (no prices)
- Create packages and SKUs, then change prices
- Watch cash inflows from paid orders and outflows from payouts
- Onboard vendors with an address and email, or remove suppliers that have no catalog SKUs
- Pay vendors (recorded locally)
- See who joined, spend, favourite occasions/packages, and age groups
- Send a newsletter or birthday reminders (stored as campaigns)

Currency is Nigerian naira (₦).
