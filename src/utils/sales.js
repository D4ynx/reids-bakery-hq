export function saleDateKey(sale) {
  return sale.createdAt.slice(0, 10);
}

export function filterSalesByRange(sales, startDate, endDate) {
  if (!startDate && !endDate) return sales;
  return sales.filter((sale) => {
    const key = saleDateKey(sale);
    if (startDate && key < startDate) return false;
    if (endDate && key > endDate) return false;
    return true;
  });
}

export const DATE_PRESETS = [
  { id: "today", label: "Today" },
  { id: "week", label: "Last 7 Days" },
  { id: "month", label: "Last 30 Days" },
  { id: "all", label: "All Time" },
];

export function getPresetRange(preset, today = new Date()) {
  const end = today.toISOString().slice(0, 10);
  if (preset === "all") return { start: "", end: "" };
  if (preset === "today") return { start: end, end };

  const start = new Date(today);
  if (preset === "week") start.setDate(start.getDate() - 6);
  else if (preset === "month") start.setDate(start.getDate() - 29);
  else return { start: "", end: "" };

  return { start: start.toISOString().slice(0, 10), end };
}

export function computeSalesSummary(sales) {
  const totalRevenue = sales.reduce((sum, s) => sum + s.total, 0);
  const totalTax = sales.reduce((sum, s) => sum + s.tax, 0);
  const totalTransactions = sales.length;
  const avgTicket = totalTransactions ? totalRevenue / totalTransactions : 0;
  return { totalRevenue, totalTax, totalTransactions, avgTicket };
}

export function getItemSalesBreakdown(sales) {
  const map = new Map();
  sales.forEach((sale) => {
    sale.items.forEach((item) => {
      const existing = map.get(item.id) || { id: item.id, name: item.name, qty: 0, revenue: 0 };
      existing.qty += item.qty;
      existing.revenue += item.qty * item.price;
      map.set(item.id, existing);
    });
  });
  return Array.from(map.values());
}

export function getBestSellers(sales, limit = 5) {
  return getItemSalesBreakdown(sales)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, limit);
}

export function getWorstSellers(sales, limit = 5) {
  return getItemSalesBreakdown(sales)
    .sort((a, b) => a.qty - b.qty)
    .slice(0, limit);
}

export function getRevenueByDay(sales) {
  const map = new Map();
  sales.forEach((sale) => {
    const key = saleDateKey(sale);
    map.set(key, (map.get(key) || 0) + sale.total);
  });
  return Array.from(map.entries())
    .map(([date, revenue]) => ({ date, revenue }))
    .sort((a, b) => (a.date < b.date ? -1 : 1));
}

export function getRevenueByPaymentMethod(sales) {
  const map = new Map();
  sales.forEach((sale) => {
    map.set(sale.paymentMethod, (map.get(sale.paymentMethod) || 0) + sale.total);
  });
  return Array.from(map.entries()).map(([method, revenue]) => ({ method, revenue }));
}

function csvEscape(value) {
  const str = String(value ?? "");
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

export function salesToCSV(sales) {
  const header = ["Sale ID", "Date", "Type", "Customer", "Payment Method", "Items", "Subtotal", "Tax", "Total"];
  const rows = sales.map((sale) => [
    sale.id,
    new Date(sale.createdAt).toLocaleString(),
    sale.type,
    sale.customerName,
    sale.paymentMethod,
    sale.items.map((i) => `${i.qty}x ${i.name}`).join("; "),
    sale.subtotal.toFixed(2),
    sale.tax.toFixed(2),
    sale.total.toFixed(2),
  ]);
  return [header, ...rows].map((row) => row.map(csvEscape).join(",")).join("\n");
}

export function downloadCSV(filename, csvContent) {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
