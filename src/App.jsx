import React from "react";
import ChamsStockLedger from "./components/chams/ChamsStockLedger";
import Sidebar from "./components/layout/Sidebar";
import OrderConfirmationModal from "./components/pos/OrderConfirmationModal";
import ReceiptModal from "./components/pos/ReceiptModal";
import RestockModal from "./components/inventory/RestockModal";
import DashboardView from "./components/views/DashboardView";
import PosView from "./components/views/PosView";
import OrdersView from "./components/views/OrdersView";
import ClientsView from "./components/views/ClientsView";
import InventoryView from "./components/views/InventoryView";
import RecipesView from "./components/views/RecipesView";
import ProductionView from "./components/views/ProductionView";
import ReportsView from "./components/views/ReportsView";
import { initialPosProducts } from "./data/initialProducts";
import { useNavigation } from "./hooks/useNavigation";
import { useClients } from "./hooks/useClients";
import { useInventory } from "./hooks/useInventory";
import { useRecipes } from "./hooks/useRecipes";
import { useProduction } from "./hooks/useProduction";
import { useOrders } from "./hooks/useOrders";
import { useClosing } from "./hooks/useClosing";
import { usePos } from "./hooks/usePos";

export default function BakeryCommandCenter() {
  // --- NAVIGATION (src/hooks/useNavigation.ts) ---
  const navigation = useNavigation();
  const {
    activeView,
    setActiveView,
    activeTab,
    setActiveTab,
    isMobileOpen,
    setIsMobileOpen,
    isTabletSidebarOpen,
    setIsTabletSidebarOpen,
    isInventoryExpanded,
    setIsInventoryExpanded,
    isReportsExpanded,
    setIsReportsExpanded,
    windowWidth,
  } = navigation;

  // --- INVENTORY (src/hooks/useInventory.ts) ---
  const inventory = useInventory();
  const {
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
  } = inventory;

  // --- CLIENTS (src/hooks/useClients.ts) ---
  const {
    clients,
    viewingClient,
    setViewingClient,
    addClient,
    updateClient,
    clearViewingClient,
  } = useClients();
  // --- RECIPES / BOM (src/hooks/useRecipes.ts) ---
  const {
    recipes,
    pricingRules,
    viewingRecipe,
    setViewingRecipe,
    isCreatingRecipe,
    setIsCreatingRecipe,
    saveRecipe,
    cancelRecipeEdit,
    updatePricingRule,
  } = useRecipes();

  // --- PRODUCTION RUNS (src/hooks/useProduction.ts) ---
  const {
    productionRuns,
    scheduleProductionRun,
    completeProductionRun,
    deleteProductionRun,
  } = useProduction({
    recipes,
    deductRecipeLines: inventory.deductRecipeLines,
    addMenuStock: inventory.addMenuStock,
  });

  // --- ORDERS (src/hooks/useOrders.ts) ---
  const ordersState = useOrders({ deductOrderLines: inventory.deductOrderLines });
  const {
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
  } = ordersState;

  // --- INVENTORY COUNTS, EXPENSES & END-OF-DAY CLOSING (src/hooks/useClosing.ts) ---
  const {
    inventoryCounts,
    expenses,
    dayClosings,
    submitClosingCount,
    resolveInventoryCount,
    applyAllPendingCounts,
    addExpense,
    deleteExpense,
    closeDay,
  } = useClosing({
    applyCountedQty: inventory.applyCountedQty,
    applyPendingCounts: inventory.applyPendingCounts,
  });

  // --- POS (src/hooks/usePos.ts) ---
  const pos = usePos({ posProducts: initialPosProducts, createOrderFromSale });
  const {
    posCategory,
    setPosCategory,
    filteredPosProducts,
    addToCart,
    cart,
    adjustCartQty,
    setCart,
    cartSubtotal,
    cartTax,
    cartTotal,
    confirmModal,
    setConfirmModal,
    updateConfirmField,
    closeConfirmModal,
    completeSale,
    sales,
    receipt,
    setReceipt,
    cartWidth,
    isResizing,
    startResizing,
    todayISO,
    isConfirmOrderDisabled,
  } = pos;

  // --- DERIVED CROSS-FEATURE VALUES (dashboard) ---
  const pendingOrdersCount = orders.filter(
    (o) => o.status === "Pending"
  ).length;
  const readyOrdersCount = orders.filter((o) => o.status === "Ready").length;
  const lowStockAlerts = [...menuInventory, ...ingredients].filter(
    (item) => item.qty < item.target
  );

  // --- NAVIGATION HANDLERS (compose navigation + feature-owned resets) ---
  const handleNavClick = (tab) => {
    setActiveTab(tab);
    clearViewingOrder();
    clearViewingClient();
    setViewingRecipe(null);
    setIsCreatingRecipe(false);
    setIsMobileOpen(false);
    setIsTabletSidebarOpen(false);
  };

  const handleViewOrder = (order) => {
    setActiveTab("orders");
    setViewingOrder(order);
  };

  const goToProductionRuns = () => {
    setActiveTab("production-runs");
    clearViewingOrder();
  };

  return (
    <div
      className={`flex flex-col md:flex-row h-screen bg-[#FDF9F3] font-sans text-[#121212] overflow-hidden relative ${
        isResizing ? "cursor-col-resize select-none" : ""
      }`}
    >
      {activeView === "chams" ? (
        <ChamsStockLedger onSwitchView={() => setActiveView("reids")} />
      ) : (
        <>
      {/* RESTOCK MODAL (extracted to src/components/inventory/RestockModal.jsx) */}
      {restockModal.isOpen && (
        <RestockModal
          modal={restockModal}
          items={restockItems}
          onItemChange={handleRestockItemChange}
          onAmountChange={handleRestockAmountChange}
          onQuickAdd={handleRestockQuickAdd}
          onClose={closeRestockModal}
          onConfirm={submitRestock}
          disabled={isRestockConfirmDisabled}
        />
      )}

      {/* ORDER CONFIRMATION MODAL (extracted to src/components/pos/OrderConfirmationModal.jsx) */}
      {confirmModal.isOpen && (
        <OrderConfirmationModal
          modal={confirmModal}
          cart={cart}
          cartTotal={cartTotal}
          todayISO={todayISO}
          onFieldChange={updateConfirmField}
          onClose={closeConfirmModal}
          onConfirm={completeSale}
          disabled={isConfirmOrderDisabled}
        />
      )}

      {/* RECEIPT MODAL (extracted to src/components/pos/ReceiptModal.jsx) */}
      {receipt && (
        <ReceiptModal receipt={receipt} onClose={() => setReceipt(null)} />
      )}

      {/* MOBILE TOP BAR */}
      <div className="md:hidden bg-[#562D07] text-[#FDF9F3] p-4 flex justify-between items-center shadow-md z-30">
        <button
          onClick={() => setIsMobileOpen(true)}
          className="p-2 focus:outline-none bg-[#F3B978]/20 rounded-md"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
        <button
          onClick={() => setActiveView("chams")}
          className="flex items-center"
          title="Switch to Chams Branch Stock Ledger"
        >
          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center mr-2 p-1">
            <span className="text-[#562D07] font-bold text-xs">RBC</span>
          </div>
          <h1 className="text-lg font-bold">Bakery HQ</h1>
        </button>
      </div>

      {/* SIDEBAR (extracted to src/components/layout/Sidebar.jsx) */}
      <Sidebar
        activeTab={activeTab}
        windowWidth={windowWidth}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
        isTabletSidebarOpen={isTabletSidebarOpen}
        setIsTabletSidebarOpen={setIsTabletSidebarOpen}
        isInventoryExpanded={isInventoryExpanded}
        setIsInventoryExpanded={setIsInventoryExpanded}
        isReportsExpanded={isReportsExpanded}
        setIsReportsExpanded={setIsReportsExpanded}
        onNavClick={handleNavClick}
        onSwitchView={() => setActiveView("chams")}
      />

      {/* MAIN CONTENT AREA */}
      <main
        className={`flex-1 relative z-10 w-full flex flex-col ${
          activeTab === "pos"
            ? "p-0 overflow-hidden bg-gray-100"
            : "p-4 md:p-8 overflow-y-auto"
        }`}
      >
        {/* =========================================
            VIEW: DASHBOARD
        ========================================= */}
        {activeTab === "dashboard" && (
          <DashboardView
            orders={orders}
            clients={clients}
            lowStockAlerts={lowStockAlerts}
            pendingOrdersCount={pendingOrdersCount}
            readyOrdersCount={readyOrdersCount}
            onNavClick={handleNavClick}
            onViewOrder={handleViewOrder}
          />
        )}

        {/* =========================================
            VIEW: POS (Loyverse Style)
        ========================================= */}
        {activeTab === "pos" && (
          <PosView
            posCategory={posCategory}
            setPosCategory={setPosCategory}
            filteredPosProducts={filteredPosProducts}
            addToCart={addToCart}
            cart={cart}
            adjustCartQty={adjustCartQty}
            setCart={setCart}
            cartSubtotal={cartSubtotal}
            cartTax={cartTax}
            cartTotal={cartTotal}
            setConfirmModal={setConfirmModal}
            todayISO={todayISO}
            windowWidth={windowWidth}
            cartWidth={cartWidth}
            startResizing={startResizing}
          />
        )}

        {/* =========================================
            VIEW: ORDERS
        ========================================= */}
        {activeTab === "orders" && (
          <OrdersView
            orders={orders}
            clients={clients}
            menuInventory={menuInventory}
            viewingOrder={viewingOrder}
            onViewOrder={setViewingOrder}
            onCreate={createOrder}
            onAdvanceStatus={advanceOrderStatus}
            onScheduleDelivery={scheduleOrderDelivery}
            onMarkDelivered={markOrderDelivered}
            onRecordPayment={recordOrderPayment}
            onGoToProduction={goToProductionRuns}
          />
        )}

        {/* =========================================
            VIEW: CLIENTS
        ========================================= */}
        {activeTab === "clients" && (
          <ClientsView
            clients={clients}
            orders={orders}
            viewingClient={viewingClient}
            onView={setViewingClient}
            onAdd={addClient}
            onUpdate={updateClient}
            onViewOrder={(order) => {
              setActiveTab("orders");
              setViewingClient(null);
              setViewingOrder(order);
            }}
          />
        )}

        {/* =========================================
            VIEW: INVENTORY
        ========================================= */}
        {(
          activeTab === "inventory-menu" ||
          activeTab === "inventory-ingredients" ||
          activeTab === "inventory-restock" ||
          activeTab === "inventory-closing-count" ||
          activeTab === "inventory-reconciliation"
        ) && (
          <InventoryView
            activeTab={activeTab}
            menuInventory={menuInventory}
            ingredients={ingredients}
            restockReminders={restockReminders}
            inventoryCounts={inventoryCounts}
            onRestockToProduction={goToProductionRuns}
            onOpenRestock={handleOpenRestock}
            onAddIngredient={addIngredient}
            onUpdateIngredient={updateIngredient}
            onAddReminder={addRestockReminder}
            onToggleReminderDone={toggleReminderDone}
            onSubmitClosingCount={submitClosingCount}
            onResolveCount={resolveInventoryCount}
            onApplyAllCounts={applyAllPendingCounts}
          />
        )}

        {/* =========================================
            VIEW: RECIPES / BOM
        ========================================= */}
        {activeTab === "recipes" && (
          <RecipesView
            recipes={recipes}
            ingredients={ingredients}
            menuInventory={menuInventory}
            pricingRules={pricingRules}
            viewingRecipe={viewingRecipe}
            isCreatingRecipe={isCreatingRecipe}
            onViewRecipe={setViewingRecipe}
            onCreateRecipe={() => setIsCreatingRecipe(true)}
            onEditRule={updatePricingRule}
            onCancelEdit={cancelRecipeEdit}
            onSave={saveRecipe}
          />
        )}

        {/* =========================================
            VIEW: PRODUCTION RUNS
        ========================================= */}
        {activeTab === "production-runs" && (
          <ProductionView
            productionRuns={productionRuns}
            recipes={recipes}
            menuInventory={menuInventory}
            ingredients={ingredients}
            onSchedule={scheduleProductionRun}
            onComplete={completeProductionRun}
            onDelete={deleteProductionRun}
          />
        )}

        {/* =========================================
            VIEW: CALENDAR
        ========================================= */}
        {activeTab === "calendar" && (
          <div className="max-w-6xl mx-auto h-[80vh] flex flex-col animate-fadeIn w-full">
            <header className="mb-6 md:mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-[#562D07]">
                Delivery Scheduler
              </h2>
              <p className="text-[#562D07]/70 mt-1 font-medium text-sm md:text-base">
                Google Calendar Integration
              </p>
            </header>

            <div className="flex-1 bg-white rounded-lg shadow-sm border border-[#F3B978] flex items-center justify-center p-4 md:p-8">
              <div className="text-center">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-[#F3B978]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 md:w-10 md:h-10 text-[#F17D0C]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg md:text-xl font-bold text-[#562D07] mb-2">
                  Calendar View Placeholder
                </h3>
                <p className="text-[#562D07]/70 max-w-sm md:max-w-md mx-auto text-sm md:text-base">
                  This space is reserved for the Google Calendar integration.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* =========================================
            VIEWS: REPORTS
        ========================================= */}
        {(
          activeTab === "reports-dashboard" ||
          activeTab === "reports-closing" ||
          activeTab === "reports-inventory"
        ) && (
          <ReportsView
            activeTab={activeTab}
            sales={sales}
            onReprintSale={setReceipt}
            expenses={expenses}
            dayClosings={dayClosings}
            onAddExpense={addExpense}
            onDeleteExpense={deleteExpense}
            onCloseDay={closeDay}
            menuInventory={menuInventory}
            ingredients={ingredients}
            inventoryCounts={inventoryCounts}
          />
        )}
      </main>
        </>
      )}
    </div>
  );
}
