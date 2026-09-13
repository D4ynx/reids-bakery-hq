import React from "react";
import FinishedGoodsTable from "../inventory/FinishedGoodsTable";
import RawMaterialsTable from "../inventory/RawMaterialsTable";
import RestockReminders from "../inventory/RestockReminders";
import ClosingCountForm from "../inventory/ClosingCountForm";
import ReconciliationReview from "../inventory/ReconciliationReview";

export default function InventoryView({
  activeTab,
  menuInventory,
  ingredients,
  restockReminders,
  inventoryCounts,
  onRestockToProduction,
  onOpenRestock,
  onAddIngredient,
  onUpdateIngredient,
  onAddReminder,
  onToggleReminderDone,
  onSubmitClosingCount,
  onResolveCount,
  onApplyAllCounts,
}) {
  return (
    <>
      {activeTab === "inventory-menu" && (
        <FinishedGoodsTable
          menuInventory={menuInventory}
          // Restock routes to Production Runs — replenish finished goods by scheduling a run
          onRestock={onRestockToProduction}
        />
      )}

      {/* =========================================
          VIEW: INVENTORY - RAW MATERIALS
      ========================================= */}
      {activeTab === "inventory-ingredients" && (
        <RawMaterialsTable
          ingredients={ingredients}
          onRestock={(id) => onOpenRestock("ingredient", id)}
          onAdd={onAddIngredient}
          onUpdate={onUpdateIngredient}
        />
      )}

      {/* =========================================
          VIEW: INVENTORY - RESTOCK REMINDERS
      ========================================= */}
      {activeTab === "inventory-restock" && (
        <RestockReminders
          ingredients={ingredients}
          reminders={restockReminders}
          onAdd={onAddReminder}
          onToggleDone={onToggleReminderDone}
        />
      )}

      {/* =========================================
          VIEW: INVENTORY - CLOSING COUNT
      ========================================= */}
      {activeTab === "inventory-closing-count" && (
        <ClosingCountForm menuInventory={menuInventory} ingredients={ingredients} onSubmit={onSubmitClosingCount} />
      )}

      {/* =========================================
          VIEW: INVENTORY - RECONCILIATION
      ========================================= */}
      {activeTab === "inventory-reconciliation" && (
        <ReconciliationReview
          counts={inventoryCounts}
          menuInventory={menuInventory}
          ingredients={ingredients}
          onResolve={onResolveCount}
          onApplyAll={onApplyAllCounts}
        />
      )}
    </>
  );
}
