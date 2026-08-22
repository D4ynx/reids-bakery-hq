import React, { useState } from "react";

const today = () => new Date().toISOString().slice(0, 10);

function CountSection({ title, icon, items, counts, onUpdate }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
      <h3 className="text-base font-bold text-[#121212] mb-4">
        {icon} {title}
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[420px]">
          <thead>
            <tr className="bg-gray-50/50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <th className="px-4 py-3">Item</th>
              <th className="px-4 py-3">Unit</th>
              <th className="px-4 py-3 text-right">Counted Qty</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {items.map((item) => (
              <tr key={item.id}>
                <td className="px-4 py-3 font-medium text-gray-900">{item.name}</td>
                <td className="px-4 py-3 text-gray-500">{item.unit || "pcs"}</td>
                <td className="px-4 py-3 text-right">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={counts[item.id] ?? ""}
                    onChange={(e) => onUpdate(item.id, e.target.value)}
                    placeholder="Enter count"
                    className="w-32 px-2 py-1.5 border border-gray-300 rounded-md text-right focus:ring-2 focus:ring-[#F17D0C] focus:border-[#F17D0C] outline-none text-gray-800"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function ClosingCountForm({ menuInventory, ingredients, onSubmit }) {
  const [date, setDate] = useState(today());
  const [menuCounts, setMenuCounts] = useState({});
  const [ingredientCounts, setIngredientCounts] = useState({});
  const [submittedMsg, setSubmittedMsg] = useState("");

  const updateMenuCount = (id, value) => setMenuCounts((prev) => ({ ...prev, [id]: value }));
  const updateIngredientCount = (id, value) => setIngredientCounts((prev) => ({ ...prev, [id]: value }));

  const handleSubmit = (e) => {
    e.preventDefault();

    const menuEntries = menuInventory
      .filter((item) => menuCounts[item.id] !== undefined && menuCounts[item.id] !== "")
      .map((item) => ({
        itemId: item.id,
        itemType: "menu",
        systemQty: item.qty,
        countedQty: parseFloat(menuCounts[item.id]) || 0,
      }));

    const ingredientEntries = ingredients
      .filter((item) => ingredientCounts[item.id] !== undefined && ingredientCounts[item.id] !== "")
      .map((item) => ({
        itemId: item.id,
        itemType: "ingredient",
        systemQty: item.qty,
        countedQty: parseFloat(ingredientCounts[item.id]) || 0,
      }));

    const entries = [...menuEntries, ...ingredientEntries];
    if (entries.length === 0) return;

    onSubmit({ date, entries });
    setMenuCounts({});
    setIngredientCounts({});
    setSubmittedMsg(`Closing count for ${date} submitted for review.`);
    setTimeout(() => setSubmittedMsg(""), 4000);
  };

  return (
    <div className="max-w-4xl mx-auto animate-fadeIn pb-10 w-full">
      <header className="mb-6 md:mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-[#562D07]">Closing Inventory Count</h2>
        <p className="text-[#562D07]/70 mt-1 font-medium text-sm md:text-base">
          End-of-day physical count — menu items and raw materials. Enter what you physically counted;
          system stock is only compared afterward during reconciliation.
        </p>
      </header>

      {submittedMsg && (
        <div className="bg-green-50 border border-green-200 text-green-700 text-sm font-medium rounded-lg px-4 py-3 mb-4">
          {submittedMsg}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <label className="text-sm font-semibold text-gray-700">Count Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F17D0C] focus:border-[#F17D0C] outline-none text-gray-800"
              required
            />
          </div>
        </div>

        <CountSection
          title="Menu Items"
          icon="📦"
          items={menuInventory}
          counts={menuCounts}
          onUpdate={updateMenuCount}
        />
        <CountSection
          title="Raw Materials"
          icon="🛒"
          items={ingredients}
          counts={ingredientCounts}
          onUpdate={updateIngredientCount}
        />

        <button
          type="submit"
          className="w-full sm:w-auto px-6 py-3 rounded-xl text-white font-bold bg-[#562D07] hover:bg-[#3a1d04] transition-colors"
        >
          Submit Closing Count
        </button>
      </form>
    </div>
  );
}
