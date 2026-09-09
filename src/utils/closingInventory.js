import { computeDiscrepancy } from "./counts";

// ---- Date helpers (ISO "YYYY-MM-DD" keys, computed in local time) ----

export function toISODate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseISODate(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function todayISO() {
  return toISODate(new Date());
}

export function monthKeyOf(iso) {
  return iso.slice(0, 7);
}

// Weeks run Monday–Sunday (ISO).
export function getWeekRange(anchorISO) {
  const d = parseISODate(anchorISO);
  const day = d.getDay(); // 0 = Sun ... 6 = Sat
  const offsetToMonday = day === 0 ? -6 : 1 - day;
  const start = new Date(d);
  start.setDate(d.getDate() + offsetToMonday);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return { start: toISODate(start), end: toISODate(end) };
}

export function getMonthRange(monthKey) {
  const [y, m] = monthKey.split("-").map(Number);
  return {
    start: toISODate(new Date(y, m - 1, 1)),
    end: toISODate(new Date(y, m, 0)),
  };
}

export function shiftWeekRange(range, delta) {
  const start = parseISODate(range.start);
  start.setDate(start.getDate() + delta * 7);
  return getWeekRange(toISODate(start));
}

export function shiftMonthKey(key, delta) {
  const [y, m] = key.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

// ---- Labels ----

export function formatWeekLabel(range) {
  const start = parseISODate(range.start);
  const end = parseISODate(range.end);
  const opts = { month: "short", day: "numeric" };
  return `Week of ${start.toLocaleDateString("en-US", opts)} – ${end.toLocaleDateString("en-US", {
    ...opts,
    year: "numeric",
  })}`;
}

export function formatMonthLabel(key) {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

// ---- Closing inventory computation ----

// Latest physical count (from the Closing Count form) dated on or before the period end.
export function getLatestCountAtOrBefore(counts, itemId, itemType, endDate) {
  const matches = counts.filter(
    (c) => c.itemId === itemId && c.itemType === itemType && c.date <= endDate
  );
  if (matches.length === 0) return null;
  return matches.reduce((latest, c) => (!latest || c.date > latest.date ? c : latest), null);
}

function buildRow(item, itemType, periodEnd, countsInPeriod, inventoryCounts) {
  const latest = getLatestCountAtOrBefore(inventoryCounts, item.id, itemType, periodEnd);
  const closingQty = latest ? latest.countedQty : item.qty;
  const unitValue = itemType === "menu" ? item.price || 0 : item.unitCost || 0;
  const periodCounts = countsInPeriod.filter(
    (c) => c.itemId === item.id && c.itemType === itemType
  );
  const discrepancyQty = periodCounts.reduce(
    (sum, c) => sum + (c.discrepancy ?? computeDiscrepancy(c.countedQty, c.systemQty)),
    0
  );

  return {
    id: item.id,
    name: item.name,
    category: itemType === "menu" ? "Menu Item" : "Raw Material",
    unit: item.unit || "pcs",
    systemQty: item.qty,
    closingQty,
    closingSource: latest ? "counted" : "system",
    lastCountDate: latest ? latest.date : null,
    unitValue,
    closingValue: closingQty * unitValue,
    periodCountCount: periodCounts.length,
    discrepancyQty,
  };
}

export function computeClosingInventory(period, menuInventory, ingredients, inventoryCounts) {
  const countsInPeriod = inventoryCounts.filter(
    (c) => c.date >= period.start && c.date <= period.end
  );

  const menuRows = menuInventory.map((item) =>
    buildRow(item, "menu", period.end, countsInPeriod, inventoryCounts)
  );
  const ingredientRows = ingredients.map((item) =>
    buildRow(item, "ingredient", period.end, countsInPeriod, inventoryCounts)
  );

  const rows = [...menuRows, ...ingredientRows];
  const sumValue = (list) => list.reduce((sum, r) => sum + r.closingValue, 0);
  const netDiscrepancyQty = rows.reduce((sum, r) => sum + r.discrepancyQty, 0);
  const netDiscrepancyValue = rows.reduce((sum, r) => sum + r.discrepancyQty * r.unitValue, 0);

  return {
    period,
    menuRows,
    ingredientRows,
    rows,
    summary: {
      totalValue: sumValue(rows),
      menuValue: sumValue(menuRows),
      ingredientValue: sumValue(ingredientRows),
      countedItems: rows.filter((r) => r.closingSource === "counted").length,
      systemItems: rows.filter((r) => r.closingSource === "system").length,
      netDiscrepancyQty,
      netDiscrepancyValue,
    },
  };
}

// ---- CSV export ----

function csvEscape(value) {
  const str = String(value ?? "");
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

export function closingInventoryToCSV(result) {
  const header = [
    "Item ID",
    "Item",
    "Category",
    "Unit",
    "System Qty",
    "Closing Qty",
    "Source",
    "Last Counted",
    "Unit Value",
    "Closing Value",
    "Discrepancy (Period)",
  ];
  const rowToCells = (r) => [
    r.id,
    r.name,
    r.category,
    r.unit,
    r.systemQty,
    r.closingQty,
    r.closingSource === "counted" ? "Counted" : "System",
    r.lastCountDate || "",
    r.unitValue.toFixed(2),
    r.closingValue.toFixed(2),
    r.discrepancyQty,
  ];

  const lines = [header, ...result.rows.map(rowToCells)];
  lines.push([
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "TOTAL CLOSING VALUE",
    result.summary.totalValue.toFixed(2),
    result.summary.netDiscrepancyQty,
  ]);
  return lines.map((row) => row.map(csvEscape).join(",")).join("\n");
}
