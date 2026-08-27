export function invoiceNumber(order: { id: string; createdAt: Date }) {
  const d = order.createdAt;
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  return `BAR-${ymd}-${order.id.slice(-6).toUpperCase()}`;
}

export type CustomerLine = {
  id: string;
  kind: string;
  description: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

export type VendorFillLine = {
  vendorId: string;
  vendorName: string;
  vendorEmail: string;
  vendorAddress: string;
  sku: string;
  name: string;
  quantity: number;
};

type VendorContact = {
  id: string;
  name: string;
  email: string;
  address: string;
  city: string;
};

type InvoiceOrder = {
  id: string;
  total: number;
  lines: {
    id: string;
    kind: string;
    name: string;
    quantity: number;
    unitPrice: number;
    item: {
      sku: string;
      name: string;
      vendorId: string;
      vendor: VendorContact;
    } | null;
  }[];
  product: {
    name: string;
    items: {
      quantity: number;
      item: {
        sku: string;
        name: string;
        vendorId: string;
        vendor: VendorContact;
      };
    }[];
  };
};

function vendorShipTo(vendor: VendorContact) {
  return [vendor.address, vendor.city].filter(Boolean).join(", ");
}

export function customerInvoiceLines(order: InvoiceOrder): CustomerLine[] {
  return order.lines.map((line) => ({
    id: line.id,
    kind: line.kind,
    description: line.name,
    quantity: line.quantity,
    unitPrice: line.unitPrice,
    lineTotal: line.unitPrice * line.quantity,
  }));
}

export function customerInvoiceTotals(lines: CustomerLine[]) {
  const packageTotal = lines
    .filter((l) => l.kind === "product")
    .reduce((sum, l) => sum + l.lineTotal, 0);
  const extrasTotal = lines
    .filter((l) => l.kind !== "product")
    .reduce((sum, l) => sum + l.lineTotal, 0);
  const calculatedTotal = packageTotal + extrasTotal;
  return { packageTotal, extrasTotal, calculatedTotal };
}

export function vendorFillLines(order: InvoiceOrder): VendorFillLine[] {
  const merged = new Map<string, VendorFillLine>();

  const add = (row: VendorFillLine) => {
    const key = `${row.vendorId}:${row.sku}`;
    const existing = merged.get(key);
    if (existing) {
      existing.quantity += row.quantity;
    } else {
      merged.set(key, { ...row });
    }
  };

  for (const line of order.lines) {
    if (line.kind === "product") {
      for (const included of order.product.items) {
        add({
          vendorId: included.item.vendorId,
          vendorName: included.item.vendor.name,
          vendorEmail: included.item.vendor.email,
          vendorAddress: vendorShipTo(included.item.vendor),
          sku: included.item.sku,
          name: included.item.name,
          quantity: included.quantity * line.quantity,
        });
      }
    } else if (line.item) {
      add({
        vendorId: line.item.vendorId,
        vendorName: line.item.vendor.name,
        vendorEmail: line.item.vendor.email,
        vendorAddress: vendorShipTo(line.item.vendor),
        sku: line.item.sku,
        name: line.item.name,
        quantity: line.quantity,
      });
    }
  }

  return [...merged.values()].sort((a, b) =>
    a.vendorName === b.vendorName ? a.name.localeCompare(b.name) : a.vendorName.localeCompare(b.vendorName),
  );
}

export function groupByVendor(lines: VendorFillLine[]) {
  const groups = new Map<
    string,
    {
      vendorId: string;
      vendorName: string;
      vendorEmail: string;
      vendorAddress: string;
      lines: VendorFillLine[];
      pieceCount: number;
    }
  >();
  for (const line of lines) {
    const group = groups.get(line.vendorId) ?? {
      vendorId: line.vendorId,
      vendorName: line.vendorName,
      vendorEmail: line.vendorEmail,
      vendorAddress: line.vendorAddress,
      lines: [],
      pieceCount: 0,
    };
    group.lines.push(line);
    group.pieceCount += line.quantity;
    groups.set(line.vendorId, group);
  }
  return [...groups.values()].sort((a, b) => a.vendorName.localeCompare(b.vendorName));
}
