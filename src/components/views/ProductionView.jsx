import React from "react";
import ProductionRunsList from "../production/ProductionRunsList";

export default function ProductionView({
  productionRuns,
  recipes,
  menuInventory,
  ingredients,
  onSchedule,
  onComplete,
  onDelete,
}) {
  return (
    <ProductionRunsList
      productionRuns={productionRuns}
      recipes={recipes}
      menuInventory={menuInventory}
      ingredients={ingredients}
      onSchedule={onSchedule}
      onComplete={onComplete}
      onDelete={onDelete}
    />
  );
}
