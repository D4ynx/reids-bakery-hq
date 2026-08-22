export function computeOrderTotal(order) {
  return order.items.reduce((sum, line) => sum + line.qty * line.unitPrice, 0);
}

export function computeOrderItemUnits(order) {
  return order.items.reduce((sum, line) => sum + line.qty, 0);
}

export function getOrderShortfalls(order, menuInventory) {
  return order.items
    .map((line) => {
      const menuItem = menuInventory.find((m) => m.id === line.menuItemId);
      if (!menuItem) return null;
      return {
        menuItemId: line.menuItemId,
        name: menuItem.name,
        requestedQty: line.qty,
        available: menuItem.qty,
        shortfall: Math.max(0, line.qty - menuItem.qty),
      };
    })
    .filter((line) => line && line.shortfall > 0);
}

export function hasShortfall(order, menuInventory) {
  return getOrderShortfalls(order, menuInventory).length > 0;
}

export const ORDER_STATUSES = ["Pending", "In Production", "Ready", "Delivered"];

export function nextStatus(status) {
  const idx = ORDER_STATUSES.indexOf(status);
  return idx >= 0 && idx < ORDER_STATUSES.length - 1 ? ORDER_STATUSES[idx + 1] : null;
}

export const PAYMENT_METHODS = ["Cash", "GCash", "Bank Transfer", "Card"];

export function computeAmountDue(order) {
  return Math.max(0, computeOrderTotal(order) - (order.amountPaid || 0));
}

export function getPaymentStatus(order) {
  const amountPaid = order.amountPaid || 0;
  if (amountPaid <= 0) return "Unpaid";
  return amountPaid >= computeOrderTotal(order) ? "Paid" : "Partial";
}
