import React, { useState, useEffect, useCallback } from "react";
import RawMaterialsTable from "./components/inventory/RawMaterialsTable";
import FinishedGoodsTable from "./components/inventory/FinishedGoodsTable";
import RestockReminders from "./components/inventory/RestockReminders";
import RecipesList from "./components/recipes/RecipesList";
import RecipeEditor from "./components/recipes/RecipeEditor";
import ProductionRunsList from "./components/production/ProductionRunsList";
import { computeBatches } from "./utils/production";
import ClosingCountForm from "./components/inventory/ClosingCountForm";
import ReconciliationReview from "./components/inventory/ReconciliationReview";
import { computeDiscrepancy } from "./utils/counts";
import OrderStatusBadge from "./components/orders/OrderStatusBadge";
import OrdersList from "./components/orders/OrdersList";
import OrderDetail from "./components/orders/OrderDetail";
import ClientsList from "./components/clients/ClientsList";
import ClientDetail from "./components/clients/ClientDetail";
import { computeOrderTotal, PAYMENT_METHODS } from "./utils/orders";
import ReportsDashboard from "./components/reports/ReportsDashboard";
import EndOfDayClosing from "./components/reports/EndOfDayClosing";

export default function BakeryCommandCenter() {
  // Navigation State
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [viewingOrder, setViewingOrder] = useState(null);
  const [viewingClient, setViewingClient] = useState(null);
  const [viewingRecipe, setViewingRecipe] = useState(null);
  const [isCreatingRecipe, setIsCreatingRecipe] = useState(false);
  const [isInventoryExpanded, setIsInventoryExpanded] = useState(false);
  const [isReportsExpanded, setIsReportsExpanded] = useState(false);

  // --- POS STATE & DATA ---
  const [posCategory, setPosCategory] = useState("All");
  const [cart, setCart] = useState([]);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, type: "", paymentMethod: "", customerName: "" });
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
        notes: "Placed via POS Pre-Order",
        deliveryDate: null,
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
    const sale = {
      id: `SALE-${String(sales.length + 1).padStart(4, "0")}`,
      type: confirmModal.type,
      customerName: confirmModal.customerName.trim(),
      paymentMethod: confirmModal.paymentMethod,
      items: cart,
      subtotal: cartSubtotal,
      tax: cartTax,
      total: cartTotal,
      createdAt: new Date().toISOString(),
    };
    setSales((prev) => [sale, ...prev]);
    if (sale.type === "Pre-Order") {
      createOrderFromSale(sale);
    }
    setCart([]);
    setConfirmModal({ isOpen: false, type: "", paymentMethod: "", customerName: "" });
    setReceipt(sale);
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

  return (
    <div
      className={`flex flex-col md:flex-row h-screen bg-[#FDF9F3] font-sans text-[#121212] overflow-hidden relative ${
        isResizing ? "cursor-col-resize select-none" : ""
      }`}
    >
      {/* RESTOCK MODAL */}
      {restockModal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white p-6 md:p-8 rounded-2xl shadow-2xl w-full max-w-sm animate-fadeIn">
            <h2 className="text-2xl font-bold text-[#121212] mb-1">
              Restock{" "}
              {restockModal.category === "menu" ? "Menu Item" : "Ingredient"}
            </h2>
            <p className="text-gray-500 text-sm mb-6">
              Select an item and add the received stock amount.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Item to Restock
                </label>
                <select
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F17D0C] focus:border-[#F17D0C] outline-none text-gray-800"
                  value={restockModal.selectedItemId}
                  onChange={(e) =>
                    setRestockModal({
                      ...restockModal,
                      selectedItemId: e.target.value,
                    })
                  }
                >
                  {(restockModal.category === "menu"
                    ? menuInventory
                    : ingredients
                  ).map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} (Current: {item.qty})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Quantity to Add
                </label>
                <input
                  type="number"
                  min="1"
                  placeholder="Enter amount..."
                  value={restockModal.amountToAdd}
                  onChange={(e) =>
                    setRestockModal({
                      ...restockModal,
                      amountToAdd: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F17D0C] focus:border-[#F17D0C] outline-none text-gray-800"
                />
              </div>

              {/* Quick Increment Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    setRestockModal({
                      ...restockModal,
                      amountToAdd: (
                        parseInt(restockModal.amountToAdd || 0) + 5
                      ).toString(),
                    })
                  }
                  className="flex-1 py-2 bg-orange-50 text-[#F17D0C] font-bold rounded-lg border border-orange-200 hover:bg-orange-100 transition-colors"
                >
                  + 5
                </button>
                <button
                  onClick={() =>
                    setRestockModal({
                      ...restockModal,
                      amountToAdd: (
                        parseInt(restockModal.amountToAdd || 0) + 10
                      ).toString(),
                    })
                  }
                  className="flex-1 py-2 bg-orange-50 text-[#F17D0C] font-bold rounded-lg border border-orange-200 hover:bg-orange-100 transition-colors"
                >
                  + 10
                </button>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={() =>
                  setRestockModal({
                    isOpen: false,
                    category: "menu",
                    selectedItemId: "",
                    amountToAdd: "",
                  })
                }
                className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-700 font-bold hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={submitRestock}
                disabled={
                  !restockModal.amountToAdd ||
                  parseInt(restockModal.amountToAdd) <= 0
                }
                className={`flex-1 py-3 rounded-xl text-white font-bold transition-colors ${
                  !restockModal.amountToAdd ||
                  parseInt(restockModal.amountToAdd) <= 0
                    ? "bg-gray-300 cursor-not-allowed"
                    : "bg-[#562D07] hover:bg-[#3a1d04]"
                }`}
              >
                Confirm Restock
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ORDER CONFIRMATION MODAL */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white p-6 md:p-8 rounded-2xl shadow-2xl w-full max-w-md animate-fadeIn">
            <div className="flex items-center gap-3 mb-2">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${
                  confirmModal.type === "Pre-Order"
                    ? "bg-[#562D07]"
                    : "bg-[#F17D0C]"
                }`}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-[#121212]">
                Confirm {confirmModal.type}
              </h2>
            </div>
            <p className="text-gray-500 text-sm mb-6 ml-13">
              Please double-check the order details below.
            </p>

            <div className="max-h-[30vh] overflow-y-auto mb-6 bg-gray-50 rounded-lg p-3 border border-gray-100">
              <ul className="divide-y divide-gray-200">
                {cart.map((item) => (
                  <li
                    key={item.id}
                    className="py-3 flex justify-between text-sm"
                  >
                    <span className="font-medium text-gray-800">
                      <span className="text-gray-500 mr-2">{item.qty}x</span>{" "}
                      {item.name}
                    </span>
                    <span className="font-bold text-gray-900">
                      ₱{(item.price * item.qty).toFixed(2)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex justify-between items-center mb-6 text-xl font-bold text-[#121212] px-2">
              <span>Total to Charge:</span>
              <span className="text-[#F17D0C]">₱{cartTotal.toFixed(2)}</span>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Customer Name
              </label>
              <input
                type="text"
                placeholder="Enter customer name..."
                value={confirmModal.customerName}
                onChange={(e) =>
                  setConfirmModal((prev) => ({ ...prev, customerName: e.target.value }))
                }
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F17D0C] focus:border-[#F17D0C] outline-none text-gray-800"
              />
            </div>

            <div className="mb-8">
              <p className="text-sm font-semibold text-gray-700 mb-2">Payment Method</p>
              <div className="grid grid-cols-2 gap-2">
                {PAYMENT_METHODS.map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setConfirmModal((prev) => ({ ...prev, paymentMethod: method }))}
                    className={`py-2.5 rounded-lg border text-sm font-semibold transition-colors ${
                      confirmModal.paymentMethod === method
                        ? "border-[#F17D0C] bg-orange-50 text-[#F17D0C]"
                        : "border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setConfirmModal({ isOpen: false, type: "", paymentMethod: "", customerName: "" })}
                className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-700 font-bold hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                disabled={!confirmModal.paymentMethod || !confirmModal.customerName.trim()}
                onClick={completeSale}
                className={`flex-1 py-3 rounded-xl text-white font-bold transition-colors ${
                  !confirmModal.paymentMethod || !confirmModal.customerName.trim()
                    ? "bg-gray-300 cursor-not-allowed"
                    : confirmModal.type === "Pre-Order"
                    ? "bg-[#562D07] hover:bg-[#3a1d04]"
                    : "bg-[#F17D0C] hover:bg-[#d86b06]"
                }`}
              >
                Confirm Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RECEIPT MODAL */}
      {receipt && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4 print:bg-white print:static">
          <div className="bg-white p-6 md:p-8 rounded-2xl shadow-2xl w-full max-w-sm animate-fadeIn print:shadow-none print:rounded-none">
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-[#121212]">Sale Complete</h2>
              <p className="text-gray-500 text-sm mt-1">{receipt.id}</p>
              {receipt.type === "Pre-Order" && (
                <p className="text-xs font-semibold text-[#F17D0C] mt-2 bg-orange-50 rounded-full px-3 py-1 inline-block">
                  Added to Orders — tracked through production &amp; delivery
                </p>
              )}
            </div>

            <div className="text-sm text-gray-600 space-y-1 mb-4 border-b border-dashed border-gray-300 pb-4">
              <div className="flex justify-between">
                <span>Type</span>
                <span className="font-semibold text-gray-800">{receipt.type}</span>
              </div>
              <div className="flex justify-between">
                <span>Customer</span>
                <span className="font-semibold text-gray-800">{receipt.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span>Payment Method</span>
                <span className="font-semibold text-gray-800">{receipt.paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span>Date</span>
                <span className="font-semibold text-gray-800">
                  {new Date(receipt.createdAt).toLocaleString()}
                </span>
              </div>
            </div>

            <ul className="divide-y divide-gray-100 mb-4 max-h-[25vh] overflow-y-auto">
              {receipt.items.map((item) => (
                <li key={item.id} className="py-2 flex justify-between text-sm">
                  <span className="text-gray-700">
                    <span className="text-gray-400 mr-2">{item.qty}x</span>
                    {item.name}
                  </span>
                  <span className="font-semibold text-gray-900">
                    ₱{(item.price * item.qty).toFixed(2)}
                  </span>
                </li>
              ))}
            </ul>

            <div className="space-y-1 mb-6 border-t border-dashed border-gray-300 pt-3">
              <div className="flex justify-between text-gray-500 text-sm">
                <span>Subtotal</span>
                <span>₱{receipt.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-500 text-sm">
                <span>Tax (5%)</span>
                <span>₱{receipt.tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-[#121212] pt-1">
                <span>Total</span>
                <span className="text-[#F17D0C]">₱{receipt.total.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex gap-3 print:hidden">
              <button
                onClick={() => window.print()}
                className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-700 font-bold hover:bg-gray-100 transition-colors"
              >
                Print Receipt
              </button>
              <button
                onClick={() => setReceipt(null)}
                className="flex-1 py-3 rounded-xl text-white font-bold bg-[#F17D0C] hover:bg-[#d86b06] transition-colors"
              >
                New Sale
              </button>
            </div>
          </div>
        </div>
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
        <div className="flex items-center">
          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center mr-2 p-1">
            <span className="text-[#562D07] font-bold text-xs">RBC</span>
          </div>
          <h1 className="text-lg font-bold">Bakery HQ</h1>
        </div>
      </div>

      {/* MOBILE OVERLAY */}
      {isMobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40 transition-opacity"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`
        fixed md:relative inset-y-0 left-0 z-50 
        transform ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 
        w-64 md:w-20 md:hover:w-64 
        transition-all duration-300 ease-in-out 
        bg-[#562D07] text-[#FDF9F3] flex flex-col shadow-2xl group
      `}
      >
        {/* Brand Area */}
        <div className="p-5 border-b border-[#F3B978]/20 flex justify-between items-center whitespace-nowrap md:h-[76px]">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-white rounded-full flex flex-shrink-0 items-center justify-center mr-4 p-1 shadow-inner">
              <span className="text-[#562D07] font-bold text-xs text-center leading-tight">
                RBC
                <br />
                <span className="text-[6px]">BAKERY</span>
              </span>
            </div>
            <span className="text-xl font-bold opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 ease-in-out">
              Bakery HQ
            </span>
          </div>
          <button
            onClick={() => setIsMobileOpen(false)}
            className="md:hidden p-1 text-[#FDF9F3]/60 hover:text-white"
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 p-3 space-y-3 mt-4 overflow-y-auto hide-scrollbar">
          <button
            onClick={() => handleNavClick("dashboard")}
            className={`w-full flex items-center p-3 rounded-lg font-bold transition-colors whitespace-nowrap overflow-hidden ${
              activeTab === "dashboard"
                ? "bg-[#F3B978]/20 text-white shadow-md border-l-4 border-[#F17D0C]"
                : "text-[#FDF9F3]/60 hover:bg-[#F3B978]/10 hover:text-white border-l-4 border-transparent"
            }`}
          >
            <div className="flex items-center justify-center w-8 flex-shrink-0">
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
                  d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                />
              </svg>
            </div>
            <span className="ml-3 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300">
              Dashboard
            </span>
          </button>

          <button
            onClick={() => handleNavClick("pos")}
            className={`w-full flex items-center p-3 rounded-lg font-bold transition-colors whitespace-nowrap overflow-hidden ${
              activeTab === "pos"
                ? "bg-[#F3B978]/20 text-white shadow-md border-l-4 border-[#F17D0C]"
                : "text-[#FDF9F3]/60 hover:bg-[#F3B978]/10 hover:text-white border-l-4 border-transparent"
            }`}
          >
            <div className="flex items-center justify-center w-8 flex-shrink-0">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z" />
              </svg>
            </div>
            <span className="ml-3 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300">
              Point of Sale
            </span>
          </button>

          <button
            onClick={() => handleNavClick("orders")}
            className={`w-full flex items-center p-3 rounded-lg font-bold transition-colors whitespace-nowrap overflow-hidden ${
              activeTab === "orders"
                ? "bg-[#F3B978]/20 text-white shadow-md border-l-4 border-[#F17D0C]"
                : "text-[#FDF9F3]/60 hover:bg-[#F3B978]/10 hover:text-white border-l-4 border-transparent"
            }`}
          >
            <div className="flex items-center justify-center w-8 flex-shrink-0">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 6h-2c0-2.8-2.2-5-5-5S7 3.2 7 6H5c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-7-3c1.7 0 3 1.3 3 3H9c0-1.7 1.3-3 3-3zm7 17H5V8h14v12zm-7-8c-1.7 0-3-1.3-3-3H7c0 2.8 2.2 5 5 5s5-2.2 5-5h-2c0 1.7-1.3 3-3 3z" />
              </svg>
            </div>
            <span className="ml-3 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300">
              Orders
            </span>
          </button>

          <button
            onClick={() => handleNavClick("clients")}
            className={`w-full flex items-center p-3 rounded-lg font-bold transition-colors whitespace-nowrap overflow-hidden ${
              activeTab === "clients"
                ? "bg-[#F3B978]/20 text-white shadow-md border-l-4 border-[#F17D0C]"
                : "text-[#FDF9F3]/60 hover:bg-[#F3B978]/10 hover:text-white border-l-4 border-transparent"
            }`}
          >
            <div className="flex items-center justify-center w-8 flex-shrink-0">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-5.13a4 4 0 10-8 0 4 4 0 008 0zm6 3a4 4 0 10-8 0 4 4 0 008 0z"
                />
              </svg>
            </div>
            <span className="ml-3 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300">
              Clients
            </span>
          </button>

          <div className="flex flex-col">
            <button
              onClick={() => setIsInventoryExpanded(!isInventoryExpanded)}
              className={`w-full flex justify-between items-center p-3 rounded-lg font-bold transition-colors whitespace-nowrap overflow-hidden ${
                activeTab.startsWith("inventory")
                  ? "bg-[#F3B978]/20 text-white shadow-md border-l-4 border-[#F17D0C]"
                  : "text-[#FDF9F3]/60 hover:bg-[#F3B978]/10 hover:text-white border-l-4 border-transparent"
              }`}
            >
              <div className="flex items-center">
                <div className="flex items-center justify-center w-8 flex-shrink-0">
                  <svg
                    className="w-6 h-6"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M21 16.5c0 .38-.21.71-.53.88l-7.9 4.44c-.16.12-.36.18-.57.18-.21 0-.41-.06-.57-.18l-7.9-4.44A.991.991 0 013 16.5v-9c0-.38.21-.71.53-.88l7.9-4.44c.16-.12.36-.18.57-.18.21 0 .41.06.57.18l7.9 4.44c.32.17.53.5.53.88v9zM12 4.15L6.04 7.5 12 10.85l5.96-3.35L12 4.15zM5 15.91l6 3.38v-6.71L5 9.21v6.7zM19 15.91v-6.7l-6 3.37v6.71l6-3.38z" />
                  </svg>
                </div>
                <span className="ml-3 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300">
                  Inventory
                </span>
              </div>
              <svg
                className={`w-4 h-4 ml-2 transition-transform duration-200 ${
                  isInventoryExpanded ? "rotate-180" : ""
                } opacity-100 md:opacity-0 md:group-hover:opacity-100`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {isInventoryExpanded && (
              <div
                className={`mt-1 space-y-1 bg-[#4a2605] rounded-lg overflow-hidden transition-all shadow-inner md:hidden md:group-hover:block`}
              >
                <button
                  onClick={() => handleNavClick("inventory-menu")}
                  className={`w-full text-left pl-14 py-2.5 text-sm font-medium transition-colors ${
                    activeTab === "inventory-menu"
                      ? "text-[#F17D0C] bg-[#3a1d04] border-l-2 border-[#F17D0C]"
                      : "text-[#FDF9F3]/70 hover:text-white hover:bg-[#3a1d04] border-l-2 border-transparent"
                  }`}
                >
                  Menu Items
                </button>
                <button
                  onClick={() => handleNavClick("inventory-ingredients")}
                  className={`w-full text-left pl-14 py-2.5 text-sm font-medium transition-colors ${
                    activeTab === "inventory-ingredients"
                      ? "text-[#F17D0C] bg-[#3a1d04] border-l-2 border-[#F17D0C]"
                      : "text-[#FDF9F3]/70 hover:text-white hover:bg-[#3a1d04] border-l-2 border-transparent"
                  }`}
                >
                  Raw Materials
                </button>
                <button
                  onClick={() => handleNavClick("inventory-restock")}
                  className={`w-full text-left pl-14 py-2.5 text-sm font-medium transition-colors ${
                    activeTab === "inventory-restock"
                      ? "text-[#F17D0C] bg-[#3a1d04] border-l-2 border-[#F17D0C]"
                      : "text-[#FDF9F3]/70 hover:text-white hover:bg-[#3a1d04] border-l-2 border-transparent"
                  }`}
                >
                  Restock Reminders
                </button>
                <button
                  onClick={() => handleNavClick("inventory-closing-count")}
                  className={`w-full text-left pl-14 py-2.5 text-sm font-medium transition-colors ${
                    activeTab === "inventory-closing-count"
                      ? "text-[#F17D0C] bg-[#3a1d04] border-l-2 border-[#F17D0C]"
                      : "text-[#FDF9F3]/70 hover:text-white hover:bg-[#3a1d04] border-l-2 border-transparent"
                  }`}
                >
                  Closing Count
                </button>
                <button
                  onClick={() => handleNavClick("inventory-reconciliation")}
                  className={`w-full text-left pl-14 py-2.5 text-sm font-medium transition-colors ${
                    activeTab === "inventory-reconciliation"
                      ? "text-[#F17D0C] bg-[#3a1d04] border-l-2 border-[#F17D0C]"
                      : "text-[#FDF9F3]/70 hover:text-white hover:bg-[#3a1d04] border-l-2 border-transparent"
                  }`}
                >
                  Reconciliation
                </button>
              </div>
            )}
          </div>

          <button
            onClick={() => handleNavClick("recipes")}
            className={`w-full flex items-center p-3 rounded-lg font-bold transition-colors whitespace-nowrap overflow-hidden ${
              activeTab === "recipes"
                ? "bg-[#F3B978]/20 text-white shadow-md border-l-4 border-[#F17D0C]"
                : "text-[#FDF9F3]/60 hover:bg-[#F3B978]/10 hover:text-white border-l-4 border-transparent"
            }`}
          >
            <div className="flex items-center justify-center w-8 flex-shrink-0">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <span className="ml-3 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300">
              Recipes
            </span>
          </button>

          <button
            onClick={() => handleNavClick("production-runs")}
            className={`w-full flex items-center p-3 rounded-lg font-bold transition-colors whitespace-nowrap overflow-hidden ${
              activeTab === "production-runs"
                ? "bg-[#F3B978]/20 text-white shadow-md border-l-4 border-[#F17D0C]"
                : "text-[#FDF9F3]/60 hover:bg-[#F3B978]/10 hover:text-white border-l-4 border-transparent"
            }`}
          >
            <div className="flex items-center justify-center w-8 flex-shrink-0">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 3v2m6-2v2M4 8h16M5 6h14a1 1 0 011 1v12a1 1 0 01-1 1H5a1 1 0 01-1-1V7a1 1 0 011-1zm3 8l2.5 2.5L15 12"
                />
              </svg>
            </div>
            <span className="ml-3 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300">
              Production Runs
            </span>
          </button>

          <button
            onClick={() => handleNavClick("calendar")}
            className={`w-full flex items-center p-3 rounded-lg font-bold transition-colors whitespace-nowrap overflow-hidden ${
              activeTab === "calendar"
                ? "bg-[#F3B978]/20 text-white shadow-md border-l-4 border-[#F17D0C]"
                : "text-[#FDF9F3]/60 hover:bg-[#F3B978]/10 hover:text-white border-l-4 border-transparent"
            }`}
          >
            <div className="flex items-center justify-center w-8 flex-shrink-0">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7v-5z" />
              </svg>
            </div>
            <span className="ml-3 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300">
              Calendar
            </span>
          </button>

          <div className="flex flex-col">
            <button
              onClick={() => setIsReportsExpanded(!isReportsExpanded)}
              className={`w-full flex justify-between items-center p-3 rounded-lg font-bold transition-colors whitespace-nowrap overflow-hidden ${
                activeTab.startsWith("reports")
                  ? "bg-[#F3B978]/20 text-white shadow-md border-l-4 border-[#F17D0C]"
                  : "text-[#FDF9F3]/60 hover:bg-[#F3B978]/10 hover:text-white border-l-4 border-transparent"
              }`}
            >
              <div className="flex items-center">
                <div className="flex items-center justify-center w-8 flex-shrink-0">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                </div>
                <span className="ml-3 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300">
                  Reports
                </span>
              </div>
              <svg
                className={`w-4 h-4 ml-2 transition-transform duration-200 ${
                  isReportsExpanded ? "rotate-180" : ""
                } opacity-100 md:opacity-0 md:group-hover:opacity-100`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isReportsExpanded && (
              <div className="mt-1 space-y-1 bg-[#4a2605] rounded-lg overflow-hidden transition-all shadow-inner md:hidden md:group-hover:block">
                <button
                  onClick={() => handleNavClick("reports-dashboard")}
                  className={`w-full text-left pl-14 py-2.5 text-sm font-medium transition-colors ${
                    activeTab === "reports-dashboard"
                      ? "text-[#F17D0C] bg-[#3a1d04] border-l-2 border-[#F17D0C]"
                      : "text-[#FDF9F3]/70 hover:text-white hover:bg-[#3a1d04] border-l-2 border-transparent"
                  }`}
                >
                  Sales Dashboard
                </button>
                <button
                  onClick={() => handleNavClick("reports-closing")}
                  className={`w-full text-left pl-14 py-2.5 text-sm font-medium transition-colors ${
                    activeTab === "reports-closing"
                      ? "text-[#F17D0C] bg-[#3a1d04] border-l-2 border-[#F17D0C]"
                      : "text-[#FDF9F3]/70 hover:text-white hover:bg-[#3a1d04] border-l-2 border-transparent"
                  }`}
                >
                  End-of-Day Closing
                </button>
              </div>
            )}
          </div>
        </nav>

        {/* Bottom Logout Area */}
        <div className="p-3 mb-4 mt-auto border-t border-[#F3B978]/20 pt-4">
          <button className="w-full flex items-center p-3 rounded-lg font-bold text-[#FDF9F3]/60 hover:text-white hover:bg-[#F3B978]/10 transition-colors whitespace-nowrap overflow-hidden">
            <div className="flex items-center justify-center w-8 flex-shrink-0">
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
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
            </div>
            <span className="ml-3 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300">
              Log Out
            </span>
          </button>
        </div>
      </aside>

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
          <div className="max-w-6xl mx-auto animate-fadeIn pb-10 w-full">
            <header className="mb-6 md:mb-8 flex flex-col md:flex-row md:justify-between md:items-end gap-4">
              <div>
                <h2 className="text-3xl font-bold text-[#121212]">Dashboard</h2>
                <p className="text-gray-500 mt-1">
                  Overview of your bakery operations today.
                </p>
              </div>
              <div className="bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm flex items-center text-sm font-medium text-gray-600">
                <svg
                  className="w-4 h-4 mr-2 text-[#F17D0C]"
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
                May 20, 2026
              </div>
            </header>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
              <div className="bg-white p-6 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center text-orange-500">
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
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <span className="text-green-500 text-xs font-bold bg-green-50 px-2 py-1 rounded-full">
                    +12.5%
                  </span>
                </div>
                <h3 className="text-gray-500 text-sm font-medium mb-1">
                  Today's Revenue
                </h3>
                <p className="text-2xl font-bold text-[#121212]">₱ 14,350.00</p>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
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
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                </div>
                <h3 className="text-gray-500 text-sm font-medium mb-1">
                  Pending Orders
                </h3>
                <p className="text-2xl font-bold text-[#121212]">
                  {pendingOrdersCount}
                </p>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-500">
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
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                  </div>
                  {lowStockAlerts.length > 0 && (
                    <span className="text-red-500 text-xs font-bold bg-red-50 px-2 py-1 rounded-full">
                      Action Req
                    </span>
                  )}
                </div>
                <h3 className="text-gray-500 text-sm font-medium mb-1">
                  Low Stock Alerts
                </h3>
                <p className="text-2xl font-bold text-[#121212]">
                  {lowStockAlerts.length}
                </p>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center text-green-500">
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
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                </div>
                <h3 className="text-gray-500 text-sm font-medium mb-1">
                  Ready for Dispatch
                </h3>
                <p className="text-2xl font-bold text-[#121212]">
                  {readyOrdersCount}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
                <div className="p-5 border-b border-gray-100 flex justify-between items-center">
                  <h3 className="text-lg font-bold text-[#121212]">
                    Recent Orders
                  </h3>
                  <button
                    onClick={() => handleNavClick("orders")}
                    className="text-sm text-[#F17D0C] font-medium hover:underline"
                  >
                    View All
                  </button>
                </div>
                <div className="p-0 flex-1 overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[500px]">
                    <thead>
                      <tr className="bg-gray-50/50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        <th className="px-5 py-3">Order #</th>
                        <th className="px-5 py-3">Client</th>
                        <th className="px-5 py-3">Status</th>
                        <th className="px-5 py-3 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm">
                      {orders.slice(0, 4).map((order) => (
                        <tr
                          key={order.id}
                          className="hover:bg-orange-50/50 transition-colors cursor-pointer"
                          onClick={() => handleViewOrder(order)}
                        >
                          <td className="px-5 py-4 font-medium text-gray-900">
                            {order.id}
                          </td>
                          <td className="px-5 py-4 text-gray-800">
                            {clients.find((c) => c.id === order.clientId)?.name || order.customerName || "—"}
                          </td>
                          <td className="px-5 py-4">
                            <OrderStatusBadge status={order.status} />
                          </td>
                          <td className="px-5 py-4 font-medium text-gray-900 text-right">
                            ₱{computeOrderTotal(order).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
                <div className="p-5 border-b border-gray-100 flex justify-between items-center">
                  <h3 className="text-lg font-bold text-[#121212] flex items-center">
                    Inventory Alerts
                    <span className="ml-2 bg-red-100 text-red-600 py-0.5 px-2 rounded-full text-xs">
                      {lowStockAlerts.length}
                    </span>
                  </h3>
                </div>
                <div className="p-0 flex-1 overflow-y-auto max-h-[400px]">
                  {lowStockAlerts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-10 text-gray-400">
                      <svg
                        className="w-12 h-12 mb-3 text-green-200"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <p className="font-medium">
                        All stock levels are optimal.
                      </p>
                    </div>
                  ) : (
                    <ul className="divide-y divide-gray-100">
                      {lowStockAlerts.map((item) => (
                        <li
                          key={item.id}
                          className="p-5 flex justify-between items-center hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex flex-col">
                            <span className="font-bold text-gray-900 text-sm">
                              {item.name}
                            </span>
                            <span className="text-xs text-gray-500 mt-0.5">
                              {item.id} • {item.type}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <span className="font-bold text-red-600 block leading-tight">
                                {item.qty} {item.unit || ""}
                              </span>
                              <span className="text-xs text-gray-400">
                                Target: {item.target}
                              </span>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================
            VIEW: POS (Loyverse Style)
        ========================================= */}
        {activeTab === "pos" && (
          <div className="flex flex-col-reverse md:flex-row h-full w-full animate-fadeIn">
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <div className="bg-white shadow-sm border-b border-gray-200 z-10 flex-shrink-0">
                <div className="p-4 flex items-center gap-4 overflow-x-auto hide-scrollbar">
                  {["All", "Pastries", "Bread", "Cakes", "Drinks"].map(
                    (cat) => (
                      <button
                        key={cat}
                        onClick={() => setPosCategory(cat)}
                        className={`px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${
                          posCategory === cat
                            ? "bg-[#562D07] text-white shadow-md"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        {cat}
                      </button>
                    )
                  )}
                  <div className="ml-auto flex-shrink-0 hidden md:block relative">
                    <input
                      type="text"
                      placeholder="Search items..."
                      className="pl-10 pr-4 py-2 bg-gray-100 border-none rounded-full text-sm focus:ring-2 focus:ring-[#F17D0C] outline-none"
                    />
                    <svg
                      className="w-5 h-5 text-gray-400 absolute left-3 top-2.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="flex-1 p-4 md:p-6 overflow-y-auto">
                <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
                  {filteredPosProducts.map((product) => (
                    <button
                      key={product.id}
                      onClick={() => addToCart(product)}
                      className={`relative w-full aspect-square rounded-xl shadow-sm hover:shadow-md transition-all transform active:scale-95 flex flex-col justify-between p-3 ${product.color} text-white overflow-hidden group`}
                    >
                      <span className="self-end text-sm font-bold opacity-90 drop-shadow-sm">
                        ₱{product.price}
                      </span>
                      <span className="self-start text-left text-sm md:text-base font-bold leading-tight drop-shadow-sm group-hover:underline">
                        {product.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* RIGHT: Current Ticket / Cart */}
            <div
              className="w-full bg-white border-b md:border-b-0 md:border-l border-gray-200 shadow-md md:shadow-xl flex flex-col max-h-[45vh] md:max-h-none md:h-full flex-shrink-0 z-20 relative"
              style={{
                width:
                  windowWidth < 768
                    ? "100%"
                    : windowWidth < 1024
                    ? 260
                    : cartWidth,
              }}
            >
              <div
                className="hidden md:block absolute left-0 top-0 w-1.5 h-full cursor-col-resize hover:bg-[#F17D0C] active:bg-[#F17D0C] transition-colors z-50"
                onMouseDown={startResizing}
                title="Drag to resize cart"
              />

              <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 flex-shrink-0">
                <div className="flex items-center gap-2 text-[#562D07]">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                  <h3 className="font-bold text-lg">Current Ticket</h3>
                </div>
                {cart.length > 0 && (
                  <button
                    onClick={() => setCart([])}
                    className="text-gray-400 hover:text-red-500 transition-colors p-1"
                    title="Clear Ticket"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                )}
              </div>

              <div className="flex-1 overflow-y-auto bg-white min-h-[100px]">
                {cart.length === 0 ? (
                  <div className="py-6 md:h-full flex flex-col items-center justify-center text-gray-400 text-center">
                    <svg
                      className="w-12 h-12 md:w-16 md:h-16 mb-2 md:mb-4 opacity-20"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z" />
                    </svg>
                    <p className="font-medium text-base md:text-lg text-gray-500">
                      No items added
                    </p>
                    <p className="text-xs md:text-sm mt-1">
                      Tap products to add them to the ticket.
                    </p>
                  </div>
                ) : (
                  <ul className="divide-y divide-gray-100">
                    {cart.map((item) => (
                      <li key={item.id} className="p-4 hover:bg-gray-50 group">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-bold text-gray-800 text-[15px]">
                            {item.name}
                          </span>
                          <span className="font-bold text-gray-900">
                            ₱{(item.price * item.qty).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-gray-500 text-sm">
                          <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                            <button
                              onClick={() => adjustCartQty(item.id, -1)}
                              className="w-8 h-8 flex items-center justify-center bg-gray-50 hover:bg-gray-200 text-gray-600 transition-colors"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                strokeWidth="2.5"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M20 12H4"
                                />
                              </svg>
                            </button>
                            <span className="w-8 text-center font-bold text-[#121212]">
                              {item.qty}
                            </span>
                            <button
                              onClick={() => adjustCartQty(item.id, 1)}
                              className="w-8 h-8 flex items-center justify-center bg-gray-50 hover:bg-gray-200 text-gray-600 transition-colors"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                strokeWidth="2.5"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M12 4v16m8-8H4"
                                />
                              </svg>
                            </button>
                          </div>
                          <span>
                            {item.qty} x ₱{item.price.toFixed(2)}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="border-t border-gray-200 bg-gray-50 p-4 flex-shrink-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                <div className="space-y-1 md:space-y-2 mb-3 md:mb-4">
                  <div className="flex justify-between text-gray-500 text-sm font-medium">
                    <span>Subtotal</span>
                    <span>₱{cartSubtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-500 text-sm font-medium border-b border-gray-200 pb-2">
                    <span>Tax (5%)</span>
                    <span>₱{cartTax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-[#121212] text-lg md:text-xl font-bold pt-1">
                    <span>Total</span>
                    <span>₱{cartTotal.toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex gap-2 w-full">
                  <button
                    disabled={cart.length === 0}
                    onClick={() =>
                      setConfirmModal({ isOpen: true, type: "Pre-Order", paymentMethod: "", customerName: "" })
                    }
                    className={`flex-1 py-3 md:py-4 rounded-xl text-sm md:text-base font-bold shadow-lg transition-all transform active:scale-[0.98] ${
                      cart.length > 0
                        ? "bg-[#562D07] hover:bg-[#3a1d04] text-white"
                        : "bg-gray-200 text-gray-400 cursor-not-allowed shadow-none"
                    }`}
                  >
                    Pre-Order
                  </button>
                  <button
                    disabled={cart.length === 0}
                    onClick={() =>
                      setConfirmModal({ isOpen: true, type: "Walk-in", paymentMethod: "", customerName: "" })
                    }
                    className={`flex-1 py-3 md:py-4 rounded-xl text-sm md:text-base font-bold shadow-lg transition-all transform active:scale-[0.98] ${
                      cart.length > 0
                        ? "bg-[#F17D0C] hover:bg-[#d86b06] text-white"
                        : "bg-gray-200 text-gray-400 cursor-not-allowed shadow-none"
                    }`}
                  >
                    Walk-in
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================
            VIEW: ORDERS (List)
        ========================================= */}
        {activeTab === "orders" && !viewingOrder && (
          <OrdersList
            orders={orders}
            clients={clients}
            menuInventory={menuInventory}
            onCreate={createOrder}
            onView={(order) => setViewingOrder(order)}
          />
        )}

        {/* =========================================
            VIEW: ORDER DETAILS
        ========================================= */}
        {activeTab === "orders" && viewingOrder && (
          <OrderDetail
            order={viewingOrder}
            client={clients.find((c) => c.id === viewingOrder.clientId)}
            menuInventory={menuInventory}
            onBack={() => setViewingOrder(null)}
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
        {activeTab === "clients" && !viewingClient && (
          <ClientsList
            clients={clients}
            orders={orders}
            onAdd={addClient}
            onUpdate={updateClient}
            onView={(client) => setViewingClient(client)}
          />
        )}
        {activeTab === "clients" && viewingClient && (
          <ClientDetail
            client={viewingClient}
            orders={orders}
            onBack={() => setViewingClient(null)}
            onViewOrder={(order) => {
              setActiveTab("orders");
              setViewingClient(null);
              setViewingOrder(order);
            }}
          />
        )}

        {/* =========================================
            VIEW: INVENTORY - MENU ITEMS
        ========================================= */}
        {activeTab === "inventory-menu" && (
          <FinishedGoodsTable
            menuInventory={menuInventory}
            onRestock={(id) => handleOpenRestock("menu", id)}
          />
        )}

        {/* =========================================
            VIEW: INVENTORY - RAW MATERIALS
        ========================================= */}
        {activeTab === "inventory-ingredients" && (
          <RawMaterialsTable
            ingredients={ingredients}
            onRestock={(id) => handleOpenRestock("ingredient", id)}
            onAdd={addIngredient}
            onUpdate={updateIngredient}
          />
        )}

        {/* =========================================
            VIEW: INVENTORY - RESTOCK REMINDERS
        ========================================= */}
        {activeTab === "inventory-restock" && (
          <RestockReminders
            ingredients={ingredients}
            reminders={restockReminders}
            onAdd={addRestockReminder}
            onToggleDone={toggleReminderDone}
          />
        )}

        {/* =========================================
            VIEW: INVENTORY - CLOSING COUNT
        ========================================= */}
        {activeTab === "inventory-closing-count" && (
          <ClosingCountForm menuInventory={menuInventory} ingredients={ingredients} onSubmit={submitClosingCount} />
        )}

        {/* =========================================
            VIEW: INVENTORY - RECONCILIATION
        ========================================= */}
        {activeTab === "inventory-reconciliation" && (
          <ReconciliationReview
            counts={inventoryCounts}
            menuInventory={menuInventory}
            ingredients={ingredients}
            onResolve={resolveInventoryCount}
            onApplyAll={applyAllPendingCounts}
          />
        )}

        {/* =========================================
            VIEW: RECIPES / BOM
        ========================================= */}
        {activeTab === "recipes" && !viewingRecipe && !isCreatingRecipe && (
          <RecipesList
            recipes={recipes}
            ingredients={ingredients}
            menuInventory={menuInventory}
            pricingRules={pricingRules}
            onEditRule={updatePricingRule}
            onEdit={(recipe) => setViewingRecipe(recipe)}
            onCreate={() => setIsCreatingRecipe(true)}
          />
        )}
        {activeTab === "recipes" && (viewingRecipe || isCreatingRecipe) && (
          <RecipeEditor
            recipe={viewingRecipe}
            ingredients={ingredients}
            menuInventory={menuInventory}
            pricingRules={pricingRules}
            onCancel={cancelRecipeEdit}
            onSave={saveRecipe}
          />
        )}

        {/* =========================================
            VIEW: PRODUCTION RUNS
        ========================================= */}
        {activeTab === "production-runs" && (
          <ProductionRunsList
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
            VIEW: SALES REPORTS
        ========================================= */}
        {activeTab === "reports-dashboard" && <ReportsDashboard sales={sales} />}

        {/* =========================================
            VIEW: END-OF-DAY CLOSING
        ========================================= */}
        {activeTab === "reports-closing" && (
          <EndOfDayClosing
            sales={sales}
            expenses={expenses}
            dayClosings={dayClosings}
            onAddExpense={addExpense}
            onDeleteExpense={deleteExpense}
            onCloseDay={closeDay}
          />
        )}
      </main>
    </div>
  );
}
