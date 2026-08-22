export function getStockStatus(item) {
  if (item.qty <= 0) return "out";
  if (item.qty < item.target) return "low";
  return "ok";
}

export const STOCK_STATUS_ORDER = ["out", "low", "ok"];

export const STOCK_STATUS_LABELS = {
  out: "Out of Stock",
  low: "Low Stock",
  ok: "In Stock",
};

export function groupByStatus(items) {
  const groups = { out: [], low: [], ok: [] };
  items.forEach((item) => {
    groups[getStockStatus(item)].push(item);
  });
  return STOCK_STATUS_ORDER.map((status) => ({ status, items: groups[status] })).filter(
    (group) => group.items.length > 0
  );
}
