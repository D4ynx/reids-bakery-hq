export function computeDiscrepancy(countedQty, systemQty) {
  return countedQty - systemQty;
}

export function discrepancyLabel(discrepancy) {
  if (discrepancy === 0) return "Match";
  return discrepancy > 0 ? `+${discrepancy} Overage` : `${discrepancy} Shortage`;
}
