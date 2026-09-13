import { useState } from "react";
import {
  initialIngredients,
  initialMenuInventory,
  initialRestockReminders,
} from "../data/initialInventory";
import type {
  IngredientFormData,
  IngredientStock,
  InventoryCount,
  InventoryItemCategory,
  MenuItemId,
  MenuItemStock,
  OrderItem,
  RecipeIngredientLine,
  RestockCategory,
  RestockModalState,
  RestockReminder,
  RestockReminderData,
} from "../types/domain";

const EMPTY_RESTOCK_MODAL: RestockModalState = {
  isOpen: false,
  category: "menu",
  selectedItemId: "",
  amountToAdd: "",
};

/**
 * Owns the inventory feature: menu item stock, raw ingredient stock, restock
 * reminders and the restock modal. All stock movements (order delivery,
 * production completion, reconciliation, restocking) flow through the
 * stock-movement actions below so the stock collections have a single owner.
 */
export function useInventory() {
  const [menuInventory, setMenuInventory] = useState<MenuItemStock[]>(initialMenuInventory);
  const [ingredients, setIngredients] = useState<IngredientStock[]>(initialIngredients);
  const [restockReminders, setRestockReminders] = useState<RestockReminder[]>(initialRestockReminders);
  const [restockModal, setRestockModal] = useState<RestockModalState>(EMPTY_RESTOCK_MODAL);

  // --- STOCK MOVEMENTS (consumed by orders, production and closing) ---

  // Deducts the menu items of a delivered order (FR-8).
  const deductOrderLines = (lines: OrderItem[]) => {
    setMenuInventory((prev) =>
      prev.map((item) => {
        const line = lines.find((l) => l.menuItemId === item.id);
        if (!line) return item;
        return { ...item, qty: Math.max(0, item.qty - line.qty) };
      })
    );
  };

  // Deducts the ingredients consumed by the batches of a completed run (FR-8).
  const deductRecipeLines = (lines: RecipeIngredientLine[], batches: number) => {
    setIngredients((prev) =>
      prev.map((item) => {
        const line = lines.find((l) => l.ingredientId === item.id);
        if (!line) return item;
        return { ...item, qty: Math.max(0, item.qty - line.qty * batches) };
      })
    );
  };

  // Adds completed production yield to a menu item's stock (FR-8).
  const addMenuStock = (menuItemId: MenuItemId, amount: number) => {
    setMenuInventory((prev) =>
      prev.map((item) =>
        item.id === menuItemId ? { ...item, qty: item.qty + amount } : item
      )
    );
  };

  // Applies a resolved count to system stock (FR-4.5).
  const applyCountedQty = (
    itemType: InventoryItemCategory,
    itemId: string,
    countedQty: number
  ) => {
    if (itemType === "ingredient") {
      setIngredients((prev) =>
        prev.map((item) => (item.id === itemId ? { ...item, qty: countedQty } : item))
      );
    } else {
      setMenuInventory((prev) =>
        prev.map((item) => (item.id === itemId ? { ...item, qty: countedQty } : item))
      );
    }
  };

  // Bulk-applies pending reconciliation counts (FR-4.5).
  const applyPendingCounts = (pending: InventoryCount[]) => {
    setMenuInventory((prev) =>
      prev.map((item) => {
        const match = pending.find((c) => c.itemType === "menu" && c.itemId === item.id);
        return match ? { ...item, qty: match.countedQty } : item;
      })
    );
    setIngredients((prev) =>
      prev.map((item) => {
        const match = pending.find((c) => c.itemType === "ingredient" && c.itemId === item.id);
        return match ? { ...item, qty: match.countedQty } : item;
      })
    );
  };

  // --- RESTOCKING (FR-1.2) ---
  const handleOpenRestock = (category: RestockCategory, itemId = "") => {
    const defaultId =
      itemId || (category === "menu" ? menuInventory[0].id : ingredients[0].id);
    setRestockModal({
      isOpen: true,
      category: category,
      selectedItemId: defaultId,
      amountToAdd: "",
    });
  };

  const submitRestock = () => {
    const amount = parseInt(restockModal.amountToAdd);
    if (isNaN(amount) || amount <= 0) return;

    if (restockModal.category === "menu") {
      setMenuInventory((prev) =>
        prev.map((item) =>
          item.id === restockModal.selectedItemId
            ? { ...item, qty: item.qty + amount }
            : item
        )
      );
    } else {
      setIngredients((prev) =>
        prev.map((item) =>
          item.id === restockModal.selectedItemId
            ? { ...item, qty: item.qty + amount }
            : item
        )
      );
    }

    setRestockModal(EMPTY_RESTOCK_MODAL);
  };

  const handleRestockItemChange = (itemId: string) => {
    setRestockModal({ ...restockModal, selectedItemId: itemId });
  };

  const handleRestockAmountChange = (amount: string) => {
    setRestockModal({ ...restockModal, amountToAdd: amount });
  };

  const handleRestockQuickAdd = (delta: number) => {
    setRestockModal({
      ...restockModal,
      amountToAdd: (parseInt(restockModal.amountToAdd || "0") + delta).toString(),
    });
  };

  const closeRestockModal = () => {
    setRestockModal(EMPTY_RESTOCK_MODAL);
  };

  // --- INGREDIENTS & RESTOCK REMINDERS (FR-1.2) ---
  const addIngredient = (data: IngredientFormData) => {
    const nextNum = ingredients.length + 1;
    setIngredients((prev) => [
      ...prev,
      { id: `ING-${String(nextNum).padStart(2, "0")}`, type: "Ingredient", ...data },
    ]);
  };

  const updateIngredient = (id: string, data: Partial<IngredientStock>) => {
    setIngredients((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...data } : item))
    );
  };

  const addRestockReminder = (data: RestockReminderData) => {
    setRestockReminders((prev) => [
      ...prev,
      { id: `RR-${String(prev.length + 1).padStart(3, "0")}`, done: false, ...data },
    ]);
  };

  const toggleReminderDone = (id: string) => {
    setRestockReminders((prev) =>
      prev.map((r) => (r.id === id ? { ...r, done: !r.done } : r))
    );
  };

  // --- RESTOCK MODAL DERIVED VALUES ---
  const restockItems =
    restockModal.category === "menu" ? menuInventory : ingredients;
  const isRestockConfirmDisabled =
    !restockModal.amountToAdd || parseInt(restockModal.amountToAdd) <= 0;

  return {
    menuInventory,
    ingredients,
    restockReminders,
    restockModal,
    addIngredient,
    updateIngredient,
    addRestockReminder,
    toggleReminderDone,
    handleOpenRestock,
    handleRestockItemChange,
    handleRestockAmountChange,
    handleRestockQuickAdd,
    closeRestockModal,
    submitRestock,
    restockItems,
    isRestockConfirmDisabled,
    deductOrderLines,
    deductRecipeLines,
    addMenuStock,
    applyCountedQty,
    applyPendingCounts,
  };
}