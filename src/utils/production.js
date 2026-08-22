export function computeBatches(plannedQty, recipe) {
  const yieldQty = Number(recipe.yieldQty) || 1;
  return Math.ceil((Number(plannedQty) || 0) / yieldQty);
}

export function computeRequiredIngredients(run, recipe, ingredients) {
  const batches = computeBatches(run.plannedQty, recipe);
  return recipe.ingredients.map((line) => {
    const ingredient = ingredients.find((i) => i.id === line.ingredientId);
    const requiredQty = line.qty * batches;
    const inStock = ingredient ? ingredient.qty : 0;
    return {
      ingredientId: line.ingredientId,
      name: ingredient ? ingredient.name : line.ingredientId,
      unit: ingredient ? ingredient.unit : line.unit,
      requiredQty,
      inStock,
      shortfall: Math.max(0, requiredQty - inStock),
    };
  });
}

export function isRunFeasible(run, recipe, ingredients) {
  return computeRequiredIngredients(run, recipe, ingredients).every((line) => line.shortfall === 0);
}

export function getRunStatus(run, recipe, ingredients) {
  if (run.status === "completed") return "completed";
  return isRunFeasible(run, recipe, ingredients) ? "scheduled" : "insufficient";
}

export const RUN_STATUS_LABELS = {
  scheduled: "Scheduled",
  insufficient: "Insufficient Stock",
  completed: "Completed",
};
