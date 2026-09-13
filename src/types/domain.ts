/**
 * Shared domain models for the bakery command center.
 *
 * Single source of truth for IDs, item shapes, quantities, dates, payment
 * methods and modal form data. Finite domain values use string unions.
 */

// ---------- IDs ----------
export type AppView = "reids" | "chams";

export type ClientId = string;
export type OrderId = string;
export type MenuItemId = string;
export type IngredientId = string;
export type RecipeId = string;
export type ProductionRunId = string;
export type RestockReminderId = string;
export type InventoryCountId = string;
export type SaleId = string;
export type ExpenseId = string;
export type DayClosingId = string;

// ---------- Dates & quantities ----------
/** Calendar date in "YYYY-MM-DD" form. */
export type ISODate = string;
/** Full ISO timestamp (e.g. new Date().toISOString()). */
export type ISODateTime = string;
export type Quantity = number;
/** Prices and money amounts are plain numbers (PHP pesos). */
export type Price = number;

// ---------- Finite domain values (string unions) ----------
export type OrderStatus = "Pending" | "In Production" | "Ready" | "Delivered";
export type PaymentMethod = "Cash" | "GCash" | "Bank Transfer" | "Card";
/** Payment method as held in checkout form state while unselected. */
export type PaymentMethodInput = PaymentMethod | "";

/** Which stock collection an inventory count / restock refers to. */
export type InventoryItemCategory = "menu" | "ingredient";
export type RestockCategory = InventoryItemCategory;
/** Display type stored on stock item records. */
export type StockItemType = "Menu Item" | "Ingredient";
export type SaleType = "Walk-in" | "Pre-Order";
export type ProductionRunStatus = "scheduled" | "completed";
export type CountStatus = "pending" | "resolved";
export type CountResolution = "match" | "applied" | "dismissed";
/** Reconciliation action on a flagged count. */
export type CountResolutionAction = "apply" | "dismiss";
export type PosCategory = "All" | "Pastries" | "Bread" | "Cakes" | "Drinks";

// ---------- Inventory ----------
export interface MenuItemStock {
  id: MenuItemId;
  name: string;
  qty: Quantity;
  target: Quantity;
  shelfLife: string;
  type: "Menu Item";
  price: Price;
}

export interface IngredientStock {
  id: IngredientId;
  name: string;
  qty: Quantity;
  target: Quantity;
  unit: string;
  type: "Ingredient";
  supplier: string;
  unitCost: Price;
}

export type StockItem = MenuItemStock | IngredientStock;

/** Payload of the ingredient form modal (RawMaterialsTable). */
export type IngredientFormData = Omit<IngredientStock, "id" | "type">;

export interface RestockReminder {
  id: RestockReminderId;
  ingredientId: IngredientId;
  note: string;
  dueDate: ISODate;
  done: boolean;
}

/** Payload of the restock reminder form (RestockReminders). */
export type RestockReminderData = Omit<RestockReminder, "id" | "done">;

/** State of the restock modal (RestockModal). */
export interface RestockModalState {
  isOpen: boolean;
  category: RestockCategory;
  selectedItemId: string;
  amountToAdd: string;
}

// ---------- Clients ----------
export interface Client {
  id: ClientId;
  name: string;
  contact: string;
  email: string;
  address: string;
  standingOrder: string;
}

/** Payload of the client form modal (ClientFormModal). */
export type ClientFormData = Omit<Client, "id">;

// ---------- Orders ----------
export interface OrderItem {
  menuItemId: MenuItemId;
  /** Present on lines created from POS sales; seed data omits it. */
  name?: string;
  qty: Quantity;
  unitPrice: Price;
}

export interface Order {
  id: OrderId;
  clientId: ClientId | null;
  /** Present on pre-orders created from the POS. */
  customerName?: string;
  items: OrderItem[];
  requestedDate: ISODate;
  status: OrderStatus;
  notes: string;
  deliveryDate: ISODate | null;
  assignedTo: string | null;
  createdAt: ISODate;
  deliveredAt: ISODate | null;
  paymentMethod: PaymentMethod | null;
  amountPaid: number;
}

/** Payload of the create-order modal (CreateOrderModal). */
export interface CreateOrderData {
  clientId: ClientId;
  requestedDate: ISODate;
  notes: string;
  items: Array<Pick<OrderItem, "menuItemId" | "qty" | "unitPrice">>;
}

/** Payload of the record-payment modal (OrderDetail). */
export interface OrderPaymentInput {
  method: PaymentMethod;
  amount: number;
}

/** Payload of the schedule-delivery modal (OrderDetail). */
export interface OrderDeliveryInput {
  deliveryDate: ISODate;
  assignedTo: string;
}

// ---------- POS / sales ----------
export interface PosProduct {
  id: MenuItemId;
  name: string;
  price: Price;
  category: PosCategory;
  color: string;
}

export interface CartItem extends PosProduct {
  qty: Quantity;
}

export interface Sale {
  id: SaleId;
  type: SaleType;
  customerName: string;
  customerContact: string;
  paymentMethod: PaymentMethod;
  items: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
  deliveryDate: ISODate;
  notes: string;
  createdAt: ISODateTime;
}

/** State of the order confirmation modal (OrderConfirmationModal). */
export interface ConfirmModalState {
  isOpen: boolean;
  paymentMethod: PaymentMethodInput;
  customerName: string;
  customerContact: string;
  deliveryDate: ISODate | "";
  notes: string;
}

// ---------- Recipes / pricing ----------
export interface RecipeIngredientLine {
  ingredientId: IngredientId;
  qty: Quantity;
  unit: string;
}

export interface Recipe {
  id: RecipeId;
  menuItemId: MenuItemId;
  name: string;
  yieldQty: number;
  yieldUnit: string;
  ingredients: RecipeIngredientLine[];
}

/** Payload of the recipe editor; id is null when creating a new recipe. */
export type RecipeInput = Omit<Recipe, "id"> & { id: RecipeId | null };

export interface PricingRules {
  targetMarginPercent: number | "";
}

/** Payload of the pricing-rule input (RecipesList sends the raw input value). */
export interface PricingRuleInput {
  targetMarginPercent: string;
}

// ---------- Production ----------
export interface ProductionRun {
  id: ProductionRunId;
  recipeId: RecipeId;
  plannedQty: Quantity;
  plannedDate: ISODate;
  notes: string;
  status: ProductionRunStatus;
  completedDate: ISODate | null;
  /** Set when the run is completed. */
  actualYield?: number;
  batches?: number;
}

/** Payload of the schedule-run modal (ScheduleRunModal). */
export interface ScheduleRunData {
  recipeId: RecipeId;
  plannedQty: number;
  plannedDate: ISODate;
  notes: string;
}

// ---------- Closing & reconciliation ----------
export interface InventoryCount {
  id: InventoryCountId;
  itemId: MenuItemId | IngredientId;
  itemType: InventoryItemCategory;
  date: ISODate;
  systemQty: Quantity;
  countedQty: Quantity;
  discrepancy: number;
  status: CountStatus;
  resolution?: CountResolution;
}

/** One counted line of the closing count form (ClosingCountForm). */
export interface ClosingCountEntry {
  itemId: string;
  itemType: InventoryItemCategory;
  systemQty: Quantity;
  countedQty: Quantity;
}

/** Payload of the closing count form (ClosingCountForm). */
export interface ClosingCountSubmission {
  date: ISODate;
  entries: ClosingCountEntry[];
}

export interface Expense {
  id: ExpenseId;
  date: ISODate;
  description: string;
  amount: number;
}

/** Payload of the expense form (EndOfDayClosing). */
export type ExpenseData = Omit<Expense, "id">;

export interface DayClosing {
  id: DayClosingId;
  date: ISODate;
  closedAt: ISODateTime;
  grossSales: number;
  totalExpenses: number;
  netProfit: number;
}

/** Payload of the close-day action (EndOfDayClosing). */
export type DayClosingData = Omit<DayClosing, "id" | "closedAt">;