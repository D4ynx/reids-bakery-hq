import React from "react";
import OrdersList from "../orders/OrdersList";
import OrderDetail from "../orders/OrderDetail";

export default function OrdersView({
  orders,
  clients,
  menuInventory,
  viewingOrder,
  onViewOrder,
  onCreate,
  onAdvanceStatus,
  onScheduleDelivery,
  onMarkDelivered,
  onRecordPayment,
  onGoToProduction,
}) {
  if (!viewingOrder) {
    return (
      <OrdersList
        orders={orders}
        clients={clients}
        menuInventory={menuInventory}
        onCreate={onCreate}
        onView={onViewOrder}
      />
    );
  }

  return (
    <OrderDetail
      order={viewingOrder}
      client={clients.find((c) => c.id === viewingOrder.clientId)}
      menuInventory={menuInventory}
      onBack={() => onViewOrder(null)}
      onAdvanceStatus={onAdvanceStatus}
      onScheduleDelivery={onScheduleDelivery}
      onMarkDelivered={onMarkDelivered}
      onRecordPayment={onRecordPayment}
      onGoToProduction={onGoToProduction}
    />
  );
}
