import { FLAG, MODULE_ID } from "./constants.mjs";
import { ScriptModel } from "./data/script-model.mjs";

export function registerModuleApi() {
  const moduleObj = game.modules.get(MODULE_ID);
  const api = {
    abstract: {
      DataModels: {
        script: ScriptModel,
      },
    },
    addLinkedItems,
    removeLinkedItems,
  };
  moduleObj.api = api;
  globalThis[MODULE_ID.replace("-", "").toCamelCase()] = api;
}

/**
 * Adds linked items to the main item and sets a flag on the main item with the linked item IDs.
 *
 * @async
 * @function addLinkedItems
 * @param {Object} mainItem - The main item to which linked items will be added.
 * @param {...(Item|string|Object)} linkedItems - The linked items to add. Can be instances of Item, strings (name, ID, or UUID), or item data objects.
 * @returns {Promise<void>}
 */
async function addLinkedItems(mainItem, ...linkedItems) {
  if (!mainItem?.actor) {
    ui.notifications.warn("Main item is invalid");
    return;
  }
  if (!linkedItems.length) {
    ui.notifications.warn("Linked items are empty");
    return;
  }

  const linkedItemIds = [];
  for (const linkedItem of linkedItems) {
    let data;
    if (linkedItem instanceof Item) {
      // Instance of an item was provided...
      data = linkedItem.toObject();
    } else if (typeof linkedItem === "string") {
      // Name, ID, or UUID of an item was provided...
      data =
        game.items.get(linkedItem) ||
        game.items.getName(linkedItem) ||
        (await fromUuid(linkedItem));
    } else if (typeof linkedItem === "object" && linkedItem !== null) {
      // Item Data was provided...
      data = linkedItem;
    } else {
      ui.notifications.warn("Invalid linked item provided");
      continue;
    }

    if (data) {
      const createdItems = await mainItem.actor.createEmbeddedDocuments(
        "Item",
        [data],
      );
      linkedItemIds.push(...createdItems.map((item) => item.id));
    } else {
      ui.notifications.warn(`Linked item not found: ${linkedItem}`);
    }
  }

  await mainItem.setFlag(MODULE_ID, FLAG.LINKED_ITEMS, linkedItemIds);
}

/**
 * Removes linked items from the main item and unsets the flag on the main item.
 *
 * @async
 * @function removeLinkedItems
 * @param {Object} mainItem - The main item from which linked items will be removed.
 * @param {...(Item|string)} linkedItems - The linked items to remove. Can be instances of Item or strings (name or ID). If no linked items are provided, it will attempt to remove items based on the flag set on the main item.
 * @returns {Promise<void>}
 */
async function removeLinkedItems(mainItem, ...linkedItems) {
  if (!mainItem?.actor) {
    ui.notifications.warn("Main item is invalid");
    return;
  }

  linkedItems = linkedItems.length
    ? linkedItems
    : await mainItem.getFlag(MODULE_ID, FLAG.LINKED_ITEMS);
  if (!linkedItems?.length) {
    ui.notifications.warn(
      "Linked items are empty and no linked items are associated with the main item",
    );
    return;
  }

  const actor = mainItem.actor;
  const actorItems = actor.items;

  for (const linkedItem of linkedItems) {
    let itemToDelete;
    if (typeof linkedItem === "string") {
      itemToDelete =
        actorItems.get(linkedItem) || actorItems.getName(linkedItem);
    } else if (linkedItem instanceof Item) {
      itemToDelete = linkedItem;
    } else {
      ui.notifications.warn("Invalid linked item provided");
      continue;
    }

    if (itemToDelete) {
      await itemToDelete.delete();
    } else {
      ui.notifications.warn(`Linked item not found: ${linkedItem}`);
    }
  }

  await mainItem.unsetFlag(MODULE_ID, FLAG.LINKED_ITEMS);
}
