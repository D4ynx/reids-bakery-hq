import { useState } from "react";
import { initialOrders } from "../data/initialOrders";
import type {
  CreateOrderData,
  Order,
  OrderDeliveryInput,
  OrderId,
  OrderItem,
  OrderPaymentInput,
  OrderStatus,
  Sale,
} from "../types/domain";

interface UseOrdersOptions {
  /**
   * Inventory-owned deduction applied when an order is delivered. Injected by
   * the app shell so stock updates stay owned by useInventory.
   */
  deductOrderLines: (lines: OrderItem[]) => void;
}

/**
 * Owns the orders feature: the order list and the order detail panel
 * (viewingOrder), including payment recording, status changes, scheduling
 * and delivery.
 */
export function useOrders({ deductOrderLines }: UseOrdersOptions) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);

  const createOrder = (data: CreateOrderData) => {
    const today = new Date().toISOString().slice(0, 10);
    setOrders((prev) => [
      {
        id: `#${1048 + prev.length}`,
        clientId: data.clientId,
        items: data.items,
        requestedDate: data.requestedDate,
        status: "Pending",
        notes: data.notes,
        deliveryDate: null,
        assignedTo: null,
        createdAt: today,
        deliveredAt: null,
        paymentMethod: null,
        amountPaid: 0,
      },
      ...prev,
    ]);
  };

  const createOrderFromSale = (sale: Sale) => {
    const today = new Date().toISOString().slice(0, 10);
    setOrders((prev) => [
      {
        id: `#${1048 + prev.length}`,
        clientId: null,
        customerName: sale.customerName,
        items: sale.items.map((item) => ({
          menuItemId: item.id,
          name: item.name,
          qty: item.qty,
          unitPrice: item.price,
        })),
        requestedDate: today,
        status: "Pending",
        notes: sale.notes
          ? `Placed via POS Pre-Order — ${sale.notes}`
          : "Placed via POS Pre-Order",
        deliveryDate: sale.deliveryDate,
        assignedTo: null,
        createdAt: today,
        deliveredAt: null,
        paymentMethod: sale.paymentMethod,
        amountPaid: sale.total,
      },
      ...prev,
    ]);
  };

  const recordOrderPayment = (id: OrderId, { method, amount }: OrderPaymentInput) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === id
          ? { ...o, paymentMethod: method, amountPaid: (o.amountPaid || 0) + amount }
          : o
      )
    );
    setViewingOrder((prev) =>
      prev && prev.id === id
        ? { ...prev, paymentMethod: method, amountPaid: (prev.amountPaid || 0) + amount }
        : prev
    );
  };

  const advanceOrderStatus = (id: OrderId, status: OrderStatus | null) => {
    if (!status) return;
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
    setViewingOrder((prev) => (prev && prev.id === id ? { ...prev, status } : prev));
  };

  const scheduleOrderDelivery = (
    id: OrderId,
    { deliveryDate, assignedTo }: OrderDeliveryInput
  ) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, deliveryDate, assignedTo } : o))
    );
    setViewingOrder((prev) =>
      prev && prev.id === id ? { ...prev, deliveryDate, assignedTo } : prev
    );
  };

  const markOrderDelivered = (id: OrderId) => {
    const order = orders.find((o) => o.id === id);
    if (!order) return;
    const deliveredAt = new Date().toISOString().slice(0, 10);

    deductOrderLines(order.items);

    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status: "Delivered", deliveredAt } : o))
    );
    setViewingOrder((prev) =>
      prev && prev.id === id ? { ...prev, status: "Delivered", deliveredAt } : prev
    );
  };

  const clearViewingOrder = () => setViewingOrder(null);

  return {
    orders,
    viewingOrder,
    setViewingOrder,
    createOrder,
    createOrderFromSale,
    recordOrderPayment,
    advanceOrderStatus,
    scheduleOrderDelivery,
    markOrderDelivered,
    clearViewingOrder,
  };
}