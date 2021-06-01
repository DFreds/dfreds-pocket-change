// This is the percent chance that a Common item will be damaged when a token is converted to loot. A damaged item has its value reduced and appends (Damaged) to the name. Set this to 0 if you want to disable damaged items.
const chanceOfDamagedItems = 0.25;

// This multiplies the price of a damaged item by the given number, lowering its value.
const damagedItemsMultiplier = 0.25;

// If set to true, this will remove items that are damaged from tokens that are converted to loot.
const removeDamagedItems = false;

const macroSupport = new game.dfreds.MacroSupport();
macroSupport.convertSelectedTokensToLoot(
  chanceOfDamagedItems,
  damagedItemsMultiplier,
  removeDamagedItems
);
