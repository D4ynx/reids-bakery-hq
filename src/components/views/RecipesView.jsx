import React from "react";
import RecipesList from "../recipes/RecipesList";
import RecipeEditor from "../recipes/RecipeEditor";

export default function RecipesView({
  recipes,
  ingredients,
  menuInventory,
  pricingRules,
  viewingRecipe,
  isCreatingRecipe,
  onViewRecipe,
  onCreateRecipe,
  onEditRule,
  onCancelEdit,
  onSave,
}) {
  if (viewingRecipe || isCreatingRecipe) {
    return (
      <RecipeEditor
        recipe={viewingRecipe}
        ingredients={ingredients}
        menuInventory={menuInventory}
        pricingRules={pricingRules}
        onCancel={onCancelEdit}
        onSave={onSave}
      />
    );
  }

  return (
    <RecipesList
      recipes={recipes}
      ingredients={ingredients}
      menuInventory={menuInventory}
      pricingRules={pricingRules}
      onEditRule={onEditRule}
      onEdit={onViewRecipe}
      onCreate={onCreateRecipe}
    />
  );
}
