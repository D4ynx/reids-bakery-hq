import React from "react";
import ClientsList from "../clients/ClientsList";
import ClientDetail from "../clients/ClientDetail";

export default function ClientsView({
  clients,
  orders,
  viewingClient,
  onView,
  onAdd,
  onUpdate,
  onViewOrder,
}) {
  if (!viewingClient) {
    return (
      <ClientsList
        clients={clients}
        orders={orders}
        onAdd={onAdd}
        onUpdate={onUpdate}
        onView={onView}
      />
    );
  }

  return (
    <ClientDetail
      client={viewingClient}
      orders={orders}
      onBack={() => onView(null)}
      onViewOrder={onViewOrder}
    />
  );
}
