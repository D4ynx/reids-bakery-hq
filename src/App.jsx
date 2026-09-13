import React, { useState, useEffect, useCallback } from "react";
import { computeBatches } from "./utils/production";
import { computeDiscrepancy } from "./utils/counts";
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

export default function BakeryCommandCenter() {
  // Navigation State
  const [activeView, setActiveView] = useState("reids"); // "reids" | "chams"
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isTabletSidebarOpen, setIsTabletSidebarOpen] = useState(false);
  const [viewingOrder, setViewingOrder] = useState(null);
  const [viewingClient, setViewingClient] = useState(null);
  const [viewingRecipe, setViewingRecipe] = useState(null);
  const [isCreatingRecipe, setIsCreatingRecipe] = useState(false);
  const [isInventoryExpanded, setIsInventoryExpanded] = useState(false);
  const [isReportsExpanded, setIsReportsExpanded] = useState(false);

  // --- POS STATE & DATA ---
  const [posCategory, setPosCategory] = useState("All");
  const [cart, setCart] = useState([]);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    paymentMethod: "",
    customerName: "",
    customerContact: "",
    deliveryDate: "",
    notes: "",
  });
  const [sales, setSales] = useState([]);
  const [receipt, setReceipt] = useState(null);

  // --- RESTOCK MODAL STATE ---
  const [restockModal, setRestockModal] = useState({
    isOpen: false,
    category: "menu", // 'menu' or 'ingredient'
    selectedItemId: "",
    amountToAdd: "",
  });

  // Resizable Ticket State
  const [cartWidth, setCartWidth] = useState(400);
  const [isResizing, setIsResizing] = useState(false);
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1024
  );

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const startResizing = useCallback((e) => {
    setIsResizing(true);
    e.preventDefault();
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = useCallback(
    (e) => {
      if (isResizing) {
        const newWidth = window.innerWidth - e.clientX;
        if (newWidth >= 300 && newWidth <= 800) {
          setCartWidth(newWidth);
        }
      }
    },
    [isResizing]
  );

  useEffect(() => {
    window.addEventListener("mousemove", resize);
    window.addEventListener("mouseup", stopResizing);
    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [resize, stopResizing]);

  const posProducts = [
    {
      id: "p1",
      name: "Butter Croissant",
      price: 120,
      category: "Pastries",
      color: "bg-amber-400",
    },
    {
      id: "p2",
      name: "Almond Croissant",
      price: 150,
      category: "Pastries",
      color: "bg-amber-500",
    },
    {
      id: "p3",
      name: "Pain au Chocolat",
      price: 140,
      category: "Pastries",
      color: "bg-orange-400",
    },
    {
      id: "p4",
      name: "Sourdough Loaf",
      price: 200,
      category: "Bread",
      color: "bg-stone-400",
    },
    {
      id: "p5",
      name: "Baguette",
      price: 110,
      category: "Bread",
      color: "bg-stone-300",
    },
    {
      id: "p6",
      name: "Blueberry Muffin",
      price: 95,
      category: "Pastries",
      color: "bg-purple-400",
    },
    {
      id: "p7",
      name: "Choco Chip Cookie",
      price: 75,
      category: "Pastries",
      color: "bg-yellow-600",
    },
    {
      id: "p8",
      name: "Chocolate Cake",
      price: 180,
      category: "Cakes",
      color: "bg-[#562D07]",
    },
    {
      id: "p9",
      name: "Strawberry Tart",
      price: 160,
      category: "Cakes",
      color: "bg-red-400",
    },
    {
      id: "p10",
      name: "Americano",
      price: 110,
      category: "Drinks",
      color: "bg-gray-800",
    },
    {
      id: "p11",
      name: "Cafe Latte",
      price: 140,
      category: "Drinks",
      color: "bg-orange-800",
    },
    {
      id: "p12",
      name: "Orange Juice",
      price: 90,
      category: "Drinks",
      color: "bg-orange-500",
    },
  ];

  const filteredPosProducts =
    posCategory === "All"
      ? posProducts
      : posProducts.filter((p) => p.category === posCategory);

  const addToCart = (product) => {
    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.id === product.id);
      if (existing) {
        return prevCart.map((item) =>
          item.id === product.id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [...prevCart, { ...product, qty: 1 }];
    });
  };

  const adjustCartQty = (id, delta) => {
    setCart((prevCart) => {
      return prevCart
        .map((item) => {
          if (item.id === id) {
            const newQty = item.qty + delta;
            return newQty > 0 ? { ...item, qty: newQty } : null;
          }
          return item;
        })
        .filter(Boolean);
    });
  };

  const cartSubtotal = cart.reduce(
    (sum, item) => sum + item.price * item.qty,
    0
  );
  const cartTax = cartSubtotal * 0.05;
  const cartTotal = cartSubtotal + cartTax;
  const todayISO = new Date().toISOString().slice(0, 10);

  const createOrderFromSale = (sale) => {
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

  const completeSale = () => {
    // Orders scheduled for delivery on a later date are tracked in the Orders view
    const isPreOrder = confirmModal.deliveryDate > todayISO;
    const sale = {
      id: `SALE-${String(sales.length + 1).padStart(4, "0")}`,
      type: isPreOrder ? "Pre-Order" : "Walk-in",
      customerName: confirmModal.customerName.trim(),
      customerContact: confirmModal.customerContact.trim(),
      paymentMethod: confirmModal.paymentMethod,
      items: cart,
      subtotal: cartSubtotal,
      tax: cartTax,
      total: cartTotal,
      deliveryDate: confirmModal.deliveryDate || todayISO,
      notes: confirmModal.notes.trim(),
      createdAt: new Date().toISOString(),
    };
    setSales((prev) => [sale, ...prev]);
    if (sale.type === "Pre-Order") {
      createOrderFromSale(sale);
    }
    setCart([]);
    setConfirmModal({
      isOpen: false,
      paymentMethod: "",
      customerName: "",
      customerContact: "",
      deliveryDate: "",
      notes: "",
    });
    setReceipt(sale);
  };

  const updateConfirmField = (field, value) => {
    setConfirmModal((prev) => ({ ...prev, [field]: value }));
  };

  const closeConfirmModal = () => {
    setConfirmModal({
      isOpen: false,
      paymentMethod: "",
      customerName: "",
      customerContact: "",
      deliveryDate: "",
      notes: "",
    });
  };

  // --- CLIENTS (FR-5.1) ---
  const [clients, setClients] = useState([
    {
      id: "CL-001",
      name: "Cafe Luna",
      contact: "0917 123 4567",
      email: "orders@cafeluna.ph",
      address: "123 Session Rd, Baguio City",
      standingOrder: "20 Butter Croissants every Monday",
    },
    {
      id: "CL-002",
      name: "Central Cafe",
      contact: "0918 234 5678",
      email: "hello@centralcafe.ph",
      address: "45 Legarda Rd, Baguio City",
      standingOrder: "",
    },
    {
      id: "CL-003",
      name: "Daily Grind",
      contact: "0919 345 6789",
      email: "supply@dailygrind.ph",
      address: "8 Harrison Rd, Baguio City",
      standingOrder: "Weekly assorted pastry box, Fridays",
    },
  ]);

  // --- ORDERS (FR-5.2, FR-5.4) ---
  const [orders, setOrders] = useState([
    {
      id: "#1042",
      clientId: "CL-001",
      items: [
        { menuItemId: "B-101", qty: 20, unitPrice: 120 },
        { menuItemId: "M-201", qty: 10, unitPrice: 95 },
      ],
      requestedDate: "2026-08-24",
      status: "Pending",
      notes: "ASAP order",
      deliveryDate: null,
      assignedTo: null,
      createdAt: "2026-08-20",
      deliveredAt: null,
      paymentMethod: null,
      amountPaid: 0,
    },
    {
      id: "#1043",
      clientId: "CL-002",
      items: [{ menuItemId: "B-102", qty: 10, unitPrice: 150 }],
      requestedDate: "2026-08-22",
      status: "Ready",
      notes: "",
      deliveryDate: null,
      assignedTo: null,
      createdAt: "2026-08-19",
      deliveredAt: null,
      paymentMethod: null,
      amountPaid: 0,
    },
    {
      id: "#1044",
      clientId: "CL-003",
      items: [
        { menuItemId: "L-044", qty: 15, unitPrice: 200 },
        { menuItemId: "B-101", qty: 5, unitPrice: 120 },
      ],
      requestedDate: "2026-08-25",
      status: "Pending",
      notes: "",
      deliveryDate: null,
      assignedTo: null,
      createdAt: "2026-08-21",
      deliveredAt: null,
      paymentMethod: null,
      amountPaid: 0,
    },
    {
      id: "#1045",
      clientId: "CL-002",
      items: [{ menuItemId: "M-201", qty: 8, unitPrice: 95 }],
      requestedDate: "2026-08-20",
      status: "In Production",
      notes: "",
      deliveryDate: null,
      assignedTo: null,
      createdAt: "2026-08-18",
      deliveredAt: null,
      paymentMethod: null,
      amountPaid: 0,
    },
    {
      id: "#1046",
      clientId: "CL-003",
      items: [{ menuItemId: "B-101", qty: 12, unitPrice: 120 }],
      requestedDate: "2026-08-20",
      status: "In Production",
      notes: "",
      deliveryDate: null,
      assignedTo: null,
      createdAt: "2026-08-18",
      deliveredAt: null,
      paymentMethod: null,
      amountPaid: 0,
    },
    {
      id: "#1047",
      clientId: "CL-003",
      items: [
        { menuItemId: "B-101", qty: 20, unitPrice: 120 },
        { menuItemId: "B-102", qty: 15, unitPrice: 150 },
        { menuItemId: "M-201", qty: 10, unitPrice: 95 },
      ],
      requestedDate: "2026-08-21",
      status: "Delivered",
      notes: "",
      deliveryDate: "2026-08-21",
      assignedTo: "Juan Dela Cruz",
      createdAt: "2026-08-17",
      deliveredAt: "2026-08-21",
      paymentMethod: "Bank Transfer",
      amountPaid: 5600,
    },
  ]);

  const [menuInventory, setMenuInventory] = useState([
    {
      id: "B-101",
      name: "Butter Croissants",
      qty: 280,
      target: 300,
      shelfLife: "24 Hours",
      type: "Menu Item",
      price: 120,
    },
    {
      id: "B-102",
      name: "Almond Croissants",
      qty: 150,
      target: 150,
      shelfLife: "24 Hours",
      type: "Menu Item",
      price: 150,
    },
    {
      id: "L-044",
      name: "Sourdough Loaves",
      qty: 15,
      target: 50,
      shelfLife: "48 Hours",
      type: "Menu Item",
      price: 200,
    },
    {
      id: "M-201",
      name: "Blueberry Muffins",
      qty: 360,
      target: 360,
      shelfLife: "36 Hours",
      type: "Menu Item",
      price: 95,
    },
  ]);

  const [ingredients, setIngredients] = useState([
    {
      id: "ING-01",
      name: "All-Purpose Flour",
      qty: 50,
      target: 100,
      unit: "kg",
      type: "Ingredient",
      supplier: "Manila Flour Mills",
      unitCost: 55,
    },
    {
      id: "ING-02",
      name: "Granulated Sugar",
      qty: 25,
      target: 40,
      unit: "kg",
      type: "Ingredient",
      supplier: "Victorias Sugar Co.",
      unitCost: 68,
    },
    {
      id: "ING-03",
      name: "Unsalted Butter",
      qty: 15,
      target: 30,
      unit: "kg",
      type: "Ingredient",
      supplier: "Dairy Fresh PH",
      unitCost: 320,
    },
    {
      id: "ING-04",
      name: "Whole Milk",
      qty: 20,
      target: 40,
      unit: "Liters",
      type: "Ingredient",
      supplier: "Dairy Fresh PH",
      unitCost: 95,
    },
    {
      id: "ING-05",
      name: "Active Dry Yeast",
      qty: 2,
      target: 5,
      unit: "kg",
      type: "Ingredient",
      supplier: "Baker's Supply Depot",
      unitCost: 410,
    },
  ]);

  // --- RESTOCK REMINDERS (FR-1.2) ---
  const [restockReminders, setRestockReminders] = useState([
    {
      id: "RR-001",
      ingredientId: "ING-01",
      note: "Order extra ahead of the weekend rush",
      dueDate: "2026-08-25",
      done: false,
    },
    {
      id: "RR-002",
      ingredientId: "ING-05",
      note: "Yeast running low, call supplier",
      dueDate: "2026-08-23",
      done: false,
    },
  ]);

  // --- RECIPES / BOM (FR-2.x) ---
  const [recipes, setRecipes] = useState([
    {
      id: "REC-01",
      menuItemId: "B-101",
      name: "Butter Croissants",
      yieldQty: 30,
      yieldUnit: "pcs",
      ingredients: [
        { ingredientId: "ING-01", qty: 4, unit: "kg" },
        { ingredientId: "ING-03", qty: 2, unit: "kg" },
        { ingredientId: "ING-04", qty: 1, unit: "Liters" },
        { ingredientId: "ING-05", qty: 0.1, unit: "kg" },
      ],
    },
    {
      id: "REC-02",
      menuItemId: "B-102",
      name: "Almond Croissants",
      yieldQty: 20,
      yieldUnit: "pcs",
      ingredients: [
        { ingredientId: "ING-01", qty: 3, unit: "kg" },
        { ingredientId: "ING-03", qty: 1.5, unit: "kg" },
        { ingredientId: "ING-02", qty: 1, unit: "kg" },
      ],
    },
  ]);

  const [pricingRules, setPricingRules] = useState({ targetMarginPercent: 40 });

  // --- PRODUCTION RUNS (FR-3.x) ---
  const [productionRuns, setProductionRuns] = useState([
    {
      id: "PR-001",
      recipeId: "REC-01",
      plannedQty: 60,
      plannedDate: "2026-08-24",
      notes: "",
      status: "scheduled",
      completedDate: null,
    },
    {
      id: "PR-002",
      recipeId: "REC-02",
      plannedQty: 40,
      plannedDate: "2026-08-25",
      notes: "For weekend catering order",
      status: "scheduled",
      completedDate: null,
    },
  ]);

  // --- INVENTORY RECONCILIATION (FR-4.4, FR-4.5) ---
  const [inventoryCounts, setInventoryCounts] = useState([
    {
      id: "IC-001",
      itemId: "L-044",
      itemType: "menu",
      date: "2026-08-20",
      systemQty: 20,
      countedQty: 15,
      discrepancy: -5,
      status: "pending",
    },
  ]);

  // --- EXPENSES & END-OF-DAY CLOSING (FR-8.1) ---
  const [expenses, setExpenses] = useState([]);
  const [dayClosings, setDayClosings] = useState([]);

  const pendingOrdersCount = orders.filter(
    (o) => o.status === "Pending"
  ).length;
  const readyOrdersCount = orders.filter((o) => o.status === "Ready").length;
  const lowStockAlerts = [...menuInventory, ...ingredients].filter(
    (item) => item.qty < item.target
  );

  const handleNavClick = (tab) => {
    setActiveTab(tab);
    setViewingOrder(null);
    setViewingClient(null);
    setViewingRecipe(null);
    setIsCreatingRecipe(false);
    setIsMobileOpen(false);
    setIsTabletSidebarOpen(false);
  };

  const handleViewOrder = (order) => {
    setActiveTab("orders");
    setViewingOrder(order);
  };

  const addClient = (data) => {
    setClients((prev) => [...prev, { id: `CL-${String(prev.length + 1).padStart(3, "0")}`, ...data }]);
  };

  const updateClient = (id, data) => {
    setClients((prev) => prev.map((c) => (c.id === id ? { ...c, ...data } : c)));
    setViewingClient((prev) => (prev && prev.id === id ? { ...prev, ...data } : prev));
  };

  const createOrder = (data) => {
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

  const recordOrderPayment = (id, { method, amount }) => {
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

  const advanceOrderStatus = (id, status) => {
    if (!status) return;
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
    setViewingOrder((prev) => (prev && prev.id === id ? { ...prev, status } : prev));
  };

  const scheduleOrderDelivery = (id, { deliveryDate, assignedTo }) => {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, deliveryDate, assignedTo } : o)));
    setViewingOrder((prev) => (prev && prev.id === id ? { ...prev, deliveryDate, assignedTo } : prev));
  };

  const markOrderDelivered = (id) => {
    const order = orders.find((o) => o.id === id);
    if (!order) return;
    const deliveredAt = new Date().toISOString().slice(0, 10);

    setMenuInventory((prev) =>
      prev.map((item) => {
        const line = order.items.find((l) => l.menuItemId === item.id);
        if (!line) return item;
        return { ...item, qty: Math.max(0, item.qty - line.qty) };
      })
    );

    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status: "Delivered", deliveredAt } : o))
    );
    setViewingOrder((prev) => (prev && prev.id === id ? { ...prev, status: "Delivered", deliveredAt } : prev));
  };

  const goToProductionRuns = () => {
    setActiveTab("production-runs");
    setViewingOrder(null);
  };

  const addIngredient = (data) => {
    const nextNum = ingredients.length + 1;
    setIngredients((prev) => [
      ...prev,
      { id: `ING-${String(nextNum).padStart(2, "0")}`, type: "Ingredient", ...data },
    ]);
  };

  const updateIngredient = (id, data) => {
    setIngredients((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...data } : item))
    );
  };

  const addRestockReminder = (data) => {
    setRestockReminders((prev) => [
      ...prev,
      { id: `RR-${String(prev.length + 1).padStart(3, "0")}`, done: false, ...data },
    ]);
  };

  const toggleReminderDone = (id) => {
    setRestockReminders((prev) =>
      prev.map((r) => (r.id === id ? { ...r, done: !r.done } : r))
    );
  };


  const saveRecipe = (recipe) => {
    setRecipes((prev) => {
      const exists = prev.some((r) => r.id === recipe.id);
      if (exists) return prev.map((r) => (r.id === recipe.id ? recipe : r));
      return [...prev, { ...recipe, id: `REC-${String(prev.length + 1).padStart(2, "0")}` }];
    });
    setViewingRecipe(null);
    setIsCreatingRecipe(false);
  };

  const cancelRecipeEdit = () => {
    setViewingRecipe(null);
    setIsCreatingRecipe(false);
  };

  const updatePricingRule = (data) => {
    setPricingRules((prev) => ({
      ...prev,
      targetMarginPercent:
        data.targetMarginPercent === "" ? "" : parseFloat(data.targetMarginPercent) || 0,
    }));
  };

  const scheduleProductionRun = (data) => {
    setProductionRuns((prev) => [
      ...prev,
      {
        id: `PR-${String(prev.length + 1).padStart(3, "0")}`,
        recipeId: data.recipeId,
        plannedQty: data.plannedQty,
        plannedDate: data.plannedDate,
        notes: data.notes,
        status: "scheduled",
        completedDate: null,
      },
    ]);
  };

  const completeProductionRun = (id) => {
    const run = productionRuns.find((r) => r.id === id);
    const recipe = recipes.find((r) => r.id === run?.recipeId);
    if (!run || !recipe) return;

    const batches = computeBatches(run.plannedQty, recipe);
    const actualYield = batches * (Number(recipe.yieldQty) || 0);

    setIngredients((prev) =>
      prev.map((item) => {
        const line = recipe.ingredients.find((l) => l.ingredientId === item.id);
        if (!line) return item;
        return { ...item, qty: Math.max(0, item.qty - line.qty * batches) };
      })
    );

    setMenuInventory((prev) =>
      prev.map((item) =>
        item.id === recipe.menuItemId ? { ...item, qty: item.qty + actualYield } : item
      )
    );

    setProductionRuns((prev) =>
      prev.map((r) =>
        r.id === id
          ? { ...r, status: "completed", completedDate: new Date().toISOString().slice(0, 10), actualYield, batches }
          : r
      )
    );
  };

  const deleteProductionRun = (id) => {
    setProductionRuns((prev) => prev.filter((r) => r.id !== id || r.status === "completed"));
  };

  const submitClosingCount = ({ date, entries }) => {
    setInventoryCounts((prev) => [
      ...entries.map((entry, idx) => {
        const discrepancy = computeDiscrepancy(entry.countedQty, entry.systemQty);
        return {
          id: `IC-${String(prev.length + idx + 1).padStart(3, "0")}`,
          itemId: entry.itemId,
          itemType: entry.itemType,
          date,
          systemQty: entry.systemQty,
          countedQty: entry.countedQty,
          discrepancy,
          status: discrepancy === 0 ? "resolved" : "pending",
          resolution: discrepancy === 0 ? "match" : undefined,
        };
      }),
      ...prev,
    ]);
  };

  const resolveInventoryCount = (id, action) => {
    const record = inventoryCounts.find((c) => c.id === id);
    if (!record) return;

    if (action === "apply") {
      if (record.itemType === "ingredient") {
        setIngredients((prev) =>
          prev.map((item) => (item.id === record.itemId ? { ...item, qty: record.countedQty } : item))
        );
      } else {
        setMenuInventory((prev) =>
          prev.map((item) => (item.id === record.itemId ? { ...item, qty: record.countedQty } : item))
        );
      }
    }

    setInventoryCounts((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, status: "resolved", resolution: action === "apply" ? "applied" : "dismissed" } : c
      )
    );
  };

  const applyAllPendingCounts = () => {
    const pending = inventoryCounts.filter((c) => c.status === "pending" && c.discrepancy !== 0);
    if (pending.length === 0) return;

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
    setInventoryCounts((prev) =>
      prev.map((c) =>
        c.status === "pending" && c.discrepancy !== 0 ? { ...c, status: "resolved", resolution: "applied" } : c
      )
    );
  };

  const addExpense = (data) => {
    setExpenses((prev) => [...prev, { id: `EXP-${String(prev.length + 1).padStart(4, "0")}`, ...data }]);
  };

  const deleteExpense = (id) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  };

  const closeDay = (data) => {
    setDayClosings((prev) => {
      if (prev.some((c) => c.date === data.date)) return prev;
      return [...prev, { id: `EOD-${String(prev.length + 1).padStart(4, "0")}`, closedAt: new Date().toISOString(), ...data }];
    });
  };

  const handleOpenRestock = (category, itemId = "") => {
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

    setRestockModal({
      isOpen: false,
      category: "menu",
      selectedItemId: "",
      amountToAdd: "",
    });
  };

  const handleRestockItemChange = (itemId) => {
    setRestockModal({ ...restockModal, selectedItemId: itemId });
  };

  const handleRestockAmountChange = (amount) => {
    setRestockModal({ ...restockModal, amountToAdd: amount });
  };

  const handleRestockQuickAdd = (delta) => {
    setRestockModal({
      ...restockModal,
      amountToAdd: (parseInt(restockModal.amountToAdd || 0) + delta).toString(),
    });
  };

  const closeRestockModal = () => {
    setRestockModal({
      isOpen: false,
      category: "menu",
      selectedItemId: "",
      amountToAdd: "",
    });
  };

  const restockItems =
    restockModal.category === "menu" ? menuInventory : ingredients;
  const isRestockConfirmDisabled =
    !restockModal.amountToAdd || parseInt(restockModal.amountToAdd) <= 0;
  const isConfirmOrderDisabled =
    !confirmModal.paymentMethod || !confirmModal.customerName.trim();

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
