import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  await prisma.orderLine.deleteMany();
  await prisma.cashEntry.deleteMany();
  await prisma.vendorPayment.deleteMany();
  await prisma.order.deleteMany();
  await prisma.productItem.deleteMany();
  await prisma.item.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.product.deleteMany();
  await prisma.vendor.deleteMany();
  await prisma.campaign.deleteMany();
  await prisma.employee.deleteMany();

  const managerHash = await bcrypt.hash("barly-admin", 10);
  const staffHash = await bcrypt.hash("barly-ops", 10);

  await prisma.employee.createMany({
    data: [
      {
        email: "olivia@barly.admin",
        passwordHash: managerHash,
        name: "Olivia Adeyemi",
        role: "manager",
      },
      {
        email: "tunde@barly.ops",
        passwordHash: staffHash,
        name: "Tunde Bakare",
        role: "staff",
      },
    ],
  });

  const distillers = await prisma.vendor.create({
    data: {
      name: "Distillers Hub Lagos",
      category: "spirits",
      email: "orders@distillershub.ng",
      phone: "+234 809 441 2201",
      address: "14 Adeola Odeku Street, Victoria Island",
      city: "Lagos",
      balanceDue: 1_850_000,
    },
  });
  const mixers = await prisma.vendor.create({
    data: {
      name: "Atlantic Mixers Co",
      category: "mixers",
      email: "supply@atlanticmixers.ng",
      phone: "+234 802 118 7740",
      address: "7 Warehouse Road, Apapa",
      city: "Lagos",
      balanceDue: 420_000,
    },
  });
  const logistics = await prisma.vendor.create({
    data: {
      name: "Chill Chain Logistics",
      category: "logistics",
      email: "ops@chillchain.ng",
      phone: "+234 701 555 0198",
      address: "Plot 22 Kudirat Abiola Way, Oregun",
      city: "Ikeja",
      balanceDue: 275_000,
    },
  });
  const glass = await prisma.vendor.create({
    data: {
      name: "Crystal Serviceware",
      category: "glassware",
      email: "hello@crystalserviceware.ng",
      phone: "+234 813 220 4415",
      address: "18 Admiralty Way, Lekki Phase 1",
      city: "Lagos",
      balanceDue: 190_000,
    },
  });

  const items = await Promise.all(
    [
      { name: "Hendrick’s Gin 70cl", sku: "GIN-HEN-70", cost: 28000, sellPrice: 42000, stock: 48, vendorId: distillers.id },
      { name: "Bombay Sapphire 70cl", sku: "GIN-BOM-70", cost: 22000, sellPrice: 34000, stock: 36, vendorId: distillers.id },
      { name: "Jameson Irish Whiskey 70cl", sku: "WHS-JAM-70", cost: 26000, sellPrice: 39000, stock: 40, vendorId: distillers.id },
      { name: "Don Papa Rum 70cl", sku: "RUM-DON-70", cost: 31000, sellPrice: 46000, stock: 22, vendorId: distillers.id },
      { name: "Moët & Chandon Brut", sku: "CHM-MOE-75", cost: 45000, sellPrice: 68000, stock: 28, vendorId: distillers.id },
      { name: "Prosecco Extra Dry", sku: "CHM-PRO-75", cost: 12000, sellPrice: 18500, stock: 60, vendorId: distillers.id },
      { name: "Heineken Keg 20L", sku: "BER-HEI-20", cost: 18000, sellPrice: 27000, stock: 18, vendorId: distillers.id },
      { name: "Schweppes Tonic 24pk", sku: "MIX-TON-24", cost: 4500, sellPrice: 7200, stock: 90, vendorId: mixers.id },
      { name: "Fever-Tree Ginger 24pk", sku: "MIX-GIN-24", cost: 9800, sellPrice: 14500, stock: 40, vendorId: mixers.id },
      { name: "Fresh Citrus Garnish Kit", sku: "GAR-CIT-01", cost: 3500, sellPrice: 6500, stock: 55, vendorId: mixers.id },
      { name: "House Syrup Set", sku: "MIX-SYR-01", cost: 6200, sellPrice: 9800, stock: 32, vendorId: mixers.id },
      { name: "Bagged Ice 20kg", sku: "ICE-BAG-20", cost: 1800, sellPrice: 3500, stock: 120, vendorId: logistics.id },
      { name: "Cooler Chest Rental", sku: "LOG-CHT-01", cost: 8000, sellPrice: 15000, stock: 14, vendorId: logistics.id },
      { name: "Coupe Glass Set (12)", sku: "GLS-CPE-12", cost: 9500, sellPrice: 16000, stock: 24, vendorId: glass.id },
      { name: "Highball Set (24)", sku: "GLS-HGB-24", cost: 11000, sellPrice: 18500, stock: 20, vendorId: glass.id },
    ].map((item) => prisma.item.create({ data: item })),
  );

  const bySku = Object.fromEntries(items.map((i) => [i.sku, i]));

  const products = await Promise.all([
    prisma.product.create({
      data: {
        name: "Gold Birthday Bar",
        occasion: "birthday",
        price: 385000,
        status: "active",
        description: "Full gin & prosecco bar with garnish kit for 40 guests.",
        items: {
          create: [
            { itemId: bySku["GIN-HEN-70"].id, quantity: 4 },
            { itemId: bySku["CHM-PRO-75"].id, quantity: 6 },
            { itemId: bySku["MIX-TON-24"].id, quantity: 3 },
            { itemId: bySku["GAR-CIT-01"].id, quantity: 2 },
            { itemId: bySku["ICE-BAG-20"].id, quantity: 8 },
          ],
        },
      },
    }),
    prisma.product.create({
      data: {
        name: "Intimate Wedding Toast",
        occasion: "wedding",
        price: 620000,
        status: "active",
        description: "Champagne wall and whiskey service for a 60-guest reception.",
        items: {
          create: [
            { itemId: bySku["CHM-MOE-75"].id, quantity: 8 },
            { itemId: bySku["WHS-JAM-70"].id, quantity: 3 },
            { itemId: bySku["GLS-CPE-12"].id, quantity: 6 },
            { itemId: bySku["ICE-BAG-20"].id, quantity: 10 },
          ],
        },
      },
    }),
    prisma.product.create({
      data: {
        name: "Premium Wedding Bar",
        occasion: "wedding",
        price: 1_150_000,
        status: "active",
        description: "Top-shelf spirits, glassware, and full ice logistics for 120 guests.",
        items: {
          create: [
            { itemId: bySku["GIN-HEN-70"].id, quantity: 8 },
            { itemId: bySku["RUM-DON-70"].id, quantity: 4 },
            { itemId: bySku["CHM-MOE-75"].id, quantity: 12 },
            { itemId: bySku["GLS-HGB-24"].id, quantity: 6 },
            { itemId: bySku["LOG-CHT-01"].id, quantity: 4 },
          ],
        },
      },
    }),
    prisma.product.create({
      data: {
        name: "Corporate After Hours",
        occasion: "corporate",
        price: 540000,
        status: "active",
        description: "Beer kegs, gin highballs, and branded garnish for office events.",
        items: {
          create: [
            { itemId: bySku["BER-HEI-20"].id, quantity: 4 },
            { itemId: bySku["GIN-BOM-70"].id, quantity: 4 },
            { itemId: bySku["MIX-TON-24"].id, quantity: 4 },
            { itemId: bySku["GLS-HGB-24"].id, quantity: 3 },
          ],
        },
      },
    }),
    prisma.product.create({
      data: {
        name: "House Party Standard",
        occasion: "house-party",
        price: 210000,
        status: "active",
        description: "Rum, beer, mixers, and ice for a backyard of 25.",
        items: {
          create: [
            { itemId: bySku["RUM-DON-70"].id, quantity: 2 },
            { itemId: bySku["BER-HEI-20"].id, quantity: 2 },
            { itemId: bySku["MIX-GIN-24"].id, quantity: 2 },
            { itemId: bySku["ICE-BAG-20"].id, quantity: 5 },
          ],
        },
      },
    }),
    prisma.product.create({
      data: {
        name: "Bridal Shower Fizz",
        occasion: "bridal-shower",
        price: 295000,
        status: "active",
        description: "Prosecco, syrups, and coupe service for a 30-guest shower.",
        items: {
          create: [
            { itemId: bySku["CHM-PRO-75"].id, quantity: 10 },
            { itemId: bySku["MIX-SYR-01"].id, quantity: 2 },
            { itemId: bySku["GLS-CPE-12"].id, quantity: 3 },
          ],
        },
      },
    }),
    prisma.product.create({
      data: {
        name: "Baby Shower Mocktails",
        occasion: "baby-shower",
        price: 165000,
        status: "active",
        description: "Zero-proof fizz bar with garnish and glassware.",
        items: {
          create: [
            { itemId: bySku["MIX-SYR-01"].id, quantity: 3 },
            { itemId: bySku["MIX-GIN-24"].id, quantity: 3 },
            { itemId: bySku["GAR-CIT-01"].id, quantity: 2 },
            { itemId: bySku["GLS-CPE-12"].id, quantity: 2 },
          ],
        },
      },
    }),
    prisma.product.create({
      data: {
        name: "Weekend BBQ Pack",
        occasion: "house-party",
        price: 175000,
        status: "archived",
        description: "Seasonal beer-and-rum bundle. Kept for historical orders.",
        items: {
          create: [
            { itemId: bySku["BER-HEI-20"].id, quantity: 3 },
            { itemId: bySku["RUM-DON-70"].id, quantity: 1 },
          ],
        },
      },
    }),
  ]);

  const pkg = Object.fromEntries(products.map((p) => [p.name, p]));

  const customersData = [
    { name: "Amaka Okonkwo", email: "amaka.okonkwo@email.com", age: 29, birthday: d(1997, 8, 28), joinedAt: d(2026, 3, 12), favoriteOccasion: "birthday", favorite: "Gold Birthday Bar" },
    { name: "Chinedu Eze", email: "chinedu.eze@email.com", age: 34, birthday: d(1992, 9, 2), joinedAt: d(2026, 1, 8), favoriteOccasion: "wedding", favorite: "Intimate Wedding Toast" },
    { name: "Fatima Bello", email: "fatima.bello@email.com", age: 26, birthday: d(2000, 9, 5), joinedAt: d(2026, 8, 18), favoriteOccasion: "bridal-shower", favorite: "Bridal Shower Fizz" },
    { name: "Ibrahim Musa", email: "ibrahim.musa@email.com", age: 41, birthday: d(1985, 11, 14), joinedAt: d(2025, 11, 2), favoriteOccasion: "corporate", favorite: "Corporate After Hours" },
    { name: "Kemi Adewale", email: "kemi.adewale@email.com", age: 23, birthday: d(2003, 4, 19), joinedAt: d(2026, 8, 20), favoriteOccasion: "house-party", favorite: "House Party Standard" },
    { name: "David Okafor", email: "david.okafor@email.com", age: 37, birthday: d(1989, 2, 7), joinedAt: d(2026, 2, 22), favoriteOccasion: "wedding", favorite: "Premium Wedding Bar" },
    { name: "Ngozi Umeh", email: "ngozi.umeh@email.com", age: 31, birthday: d(1995, 6, 3), joinedAt: d(2026, 5, 15), favoriteOccasion: "birthday", favorite: "Gold Birthday Bar" },
    { name: "Samuel Wright", email: "samuel.wright@email.com", age: 48, birthday: d(1978, 12, 21), joinedAt: d(2025, 9, 30), favoriteOccasion: "corporate", favorite: "Corporate After Hours" },
    { name: "Zainab Lawal", email: "zainab.lawal@email.com", age: 22, birthday: d(2004, 8, 30), joinedAt: d(2026, 7, 4), favoriteOccasion: "baby-shower", favorite: "Baby Shower Mocktails" },
    { name: "Peter Adebayo", email: "peter.adebayo@email.com", age: 28, birthday: d(1998, 1, 16), joinedAt: d(2026, 4, 9), favoriteOccasion: "house-party", favorite: "House Party Standard" },
    { name: "Chioma Nwosu", email: "chioma.nwosu@email.com", age: 35, birthday: d(1991, 10, 11), joinedAt: d(2026, 6, 1), favoriteOccasion: "wedding", favorite: "Intimate Wedding Toast" },
    { name: "Hassan Abdullahi", email: "hassan.abdullahi@email.com", age: 52, birthday: d(1974, 3, 8), joinedAt: d(2025, 8, 14), favoriteOccasion: "corporate", favorite: "Corporate After Hours" },
  ];

  const customers: { id: string; name: string }[] = [];
  for (const c of customersData) {
    customers.push(
      await prisma.customer.create({
        data: {
          name: c.name,
          email: c.email,
          age: c.age,
          birthday: c.birthday,
          joinedAt: c.joinedAt,
          favoriteOccasion: c.favoriteOccasion,
          favoritePackageId: pkg[c.favorite].id,
        },
      }),
    );
  }

  const findCustomer = (name: string) => customers.find((c) => c.name === name)!;

  const ordersSpec = [
    { customer: "Amaka Okonkwo", product: "Gold Birthday Bar", status: "fulfilled", createdAt: d(2026, 7, 12, 14), paid: true, extra: [{ sku: "GLS-CPE-12", qty: 1 }] },
    { customer: "Chinedu Eze", product: "Intimate Wedding Toast", status: "fulfilled", createdAt: d(2026, 6, 20, 11), paid: true, extra: [] },
    { customer: "David Okafor", product: "Premium Wedding Bar", status: "confirmed", createdAt: d(2026, 8, 10, 9), paid: true, extra: [{ sku: "LOG-CHT-01", qty: 2 }] },
    { customer: "Ibrahim Musa", product: "Corporate After Hours", status: "fulfilled", createdAt: d(2026, 5, 8, 16), paid: true, extra: [] },
    { customer: "Kemi Adewale", product: "House Party Standard", status: "pending", createdAt: d(2026, 8, 22, 18), paid: false, extra: [{ sku: "ICE-BAG-20", qty: 3 }] },
    { customer: "Fatima Bello", product: "Bridal Shower Fizz", status: "confirmed", createdAt: d(2026, 8, 19, 13), paid: true, extra: [] },
    { customer: "Ngozi Umeh", product: "Gold Birthday Bar", status: "fulfilled", createdAt: d(2026, 4, 2, 10), paid: true, extra: [] },
    { customer: "Samuel Wright", product: "Corporate After Hours", status: "cancelled", createdAt: d(2026, 8, 5, 8), paid: false, extra: [] },
    { customer: "Chioma Nwosu", product: "Intimate Wedding Toast", status: "pending", createdAt: d(2026, 8, 23, 9), paid: false, extra: [{ sku: "CHM-PRO-75", qty: 4 }] },
    { customer: "Peter Adebayo", product: "House Party Standard", status: "fulfilled", createdAt: d(2026, 3, 18, 19), paid: true, extra: [] },
    { customer: "Zainab Lawal", product: "Baby Shower Mocktails", status: "confirmed", createdAt: d(2026, 8, 21, 15), paid: true, extra: [] },
    { customer: "Hassan Abdullahi", product: "Corporate After Hours", status: "fulfilled", createdAt: d(2026, 2, 14, 12), paid: true, extra: [] },
  ] as const;

  for (const spec of ordersSpec) {
    const product = pkg[spec.product];
    const extras = spec.extra.map((e) => {
      const item = bySku[e.sku];
      return {
        kind: "item",
        itemId: item.id,
        name: item.name,
        quantity: e.qty,
        unitPrice: item.sellPrice,
      };
    });
    const extraTotal = extras.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
    const total = spec.status === "cancelled" ? 0 : product.price + extraTotal;

    const order = await prisma.order.create({
      data: {
        customerId: findCustomer(spec.customer).id,
        productId: product.id,
        status: spec.status,
        total,
        paidAt: spec.paid ? spec.createdAt : null,
        createdAt: spec.createdAt,
        notes: spec.status === "cancelled" ? "Client postponed the offsite." : "",
        lines: {
          create: [
            {
              kind: "product",
              name: product.name,
              quantity: 1,
              unitPrice: product.price,
            },
            ...extras,
          ],
        },
      },
    });

    if (spec.paid && total > 0) {
      await prisma.cashEntry.create({
        data: {
          type: "inflow",
          source: "order",
          amount: total,
          note: `Payment for ${product.name} — ${spec.customer}`,
          createdAt: spec.createdAt,
          orderId: order.id,
        },
      });
    }
  }

  const payout = await prisma.vendorPayment.create({
    data: {
      vendorId: mixers.id,
      amount: 180000,
      method: "transfer",
      status: "paid",
      paidAt: d(2026, 8, 1, 11),
    },
  });
  await prisma.cashEntry.create({
    data: {
      type: "outflow",
      source: "vendor_payout",
      amount: 180000,
      note: "Transfer to Atlantic Mixers Co",
      createdAt: d(2026, 8, 1, 11),
      vendorPaymentId: payout.id,
    },
  });

  await prisma.cashEntry.create({
    data: {
      type: "outflow",
      source: "other",
      amount: 85000,
      note: "Van fuel and ice run — Lekki to VI",
      createdAt: d(2026, 8, 15, 7),
    },
  });

  await prisma.campaign.create({
    data: {
      type: "newsletter",
      subject: "August occasions: book the Gold Birthday Bar",
      body: "Weekend slots in Lagos are filling. Gold Birthday Bar is ₦385,000 for 40 guests.",
      audience: "all",
      sentAt: d(2026, 8, 8, 10),
      recipientCount: 12,
    },
  });
}

function d(year: number, month: number, day: number, hour = 12) {
  return new Date(year, month - 1, day, hour, 0, 0);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
