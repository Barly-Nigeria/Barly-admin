export type CatalogPick = {
  id: string;
  quantity: number;
};

export function parseCatalogPicks(formData: FormData, idField: string, qtyPrefix: string): CatalogPick[] {
  const ids = [...new Set(formData.getAll(idField).map(String).filter(Boolean))];
  return ids.map((id) => {
    const raw = Number(formData.get(`${qtyPrefix}-${id}`));
    const quantity = Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 1;
    return { id, quantity };
  });
}

export function formatPickLine(quantity: number, name: string) {
  return `${quantity}× ${name}`;
}
