/**
 * Main Module File
 */

import { ScriptChoiceDialog } from "./applications/script-choice-dialog.mjs";
import { MODULE_ID, SETTING, TRIGGER } from "./constants.mjs";
import { ScriptsOverview } from "./applications/scripts-overview.mjs";
import { getSetting, registerModuleSettings } from "./settings.mjs";
import { ScriptModel } from "./data/script-model.mjs";

Hooks.once("init", () => {
  registerModuleSettings();
});

Hooks.on("getItemSheetHeaderButtons", (app, buttons) => {
  if (!game.user.hasRole(getSetting(SETTING.HEADER_BUTTON_PERMISSION))) return;

  const item = app.document;
  buttons.unshift({
    class: MODULE_ID,
    icon: "fas fa-play",
    label: getSetting(SETTING.SHOW_HEADER_BUTTON_LABEL)
      ? "Scriptable Items"
      : undefined,
    onclick: () => new ScriptsOverview(item).render(true),
  });
});

Hooks.on("dnd5e.preUseItem", (item, config, options) => {
  if (options.skipScripts === true) {
    return true;
  }

  const scripts = ScriptModel.getAll(item).filter((x) =>
    x.triggers.has(TRIGGER.PRE_USE),
  );
  if (!scripts.length) return true;

  if (scripts.length > 1 && options._selectedScript == null) {
    ScriptChoiceDialog.create(scripts).then((scriptId) => {
      if (scriptId == null) return;
      options._selectedScript = scripts.find((x) => x.id === scriptId);
      item.use(config, options);
    });
    return false;
  }
  const script = options._selectedScript ?? scripts[0];

  script.executeScript({ trigger: TRIGGER.PRE_USE }).then((result) => {
    if (result === true) {
      options.skipScripts = true;
      item.use(config, options);
    }
  });

  return false;
});

Hooks.on("dnd5e.preDisplayCard", (item, data) => {
  const scripts = ScriptModel.getAll(item).filter((x) =>
    x.triggers.has(TRIGGER.BUTTON),
  );
  if (!scripts.length) return;

  // Convert cards HTML string to workable DOM element
  const el = document.createElement("DIV");
  el.innerHTML = data.content;

  // Add button for each script with button trigger to the card
  let buttonContainer = el.querySelector(".card-buttons");
  if (buttonContainer == null) {
    // There are no buttons yet on the chat card, so no container, adding a container...
    buttonContainer = document.createElement("DIV");
    buttonContainer.classList.add("card-buttons");
    const parent = el.querySelector(".chat-card");
    parent.insertBefore(buttonContainer, parent.children[1]);
  }

  for (const script of scripts) {
    const newButton = document.createElement("BUTTON");
    newButton.setAttribute("data-action", `${MODULE_ID}-run`);
    newButton.setAttribute("data-script-id", script.id);

    let prefix = getSetting(SETTING.CHAT_CARD_SCRIPT_BUTTON_PREFIX);
    if (prefix !== "") {
      prefix += " ";
    }

    let icon = getSetting(SETTING.CHAT_CARD_SCRIPT_BUTTON_ICON);
    if (icon !== "") {
      icon = `<i class="${icon}"></i> `;
    }

    newButton.innerHTML = `${icon}${prefix}${script.name}`;
    buttonContainer.append(newButton);
  }

  data.content = el.innerHTML;
});

Hooks.on("dnd5e.renderChatMessage", (message, html) => {
  html.querySelectorAll(`[data-action="${MODULE_ID}-run"]`).forEach((x) => {
    x.addEventListener("click", async (event) => {
      event.preventDefault();
      const scriptId = event.currentTarget.dataset.scriptId;
      const itemUuid = message.getFlag("dnd5e", "use.itemUuid");
      const item = await fromUuid(itemUuid);
      const script = ScriptModel.getById(item, scriptId);
      await script.executeScript({
        trigger: TRIGGER.BUTTON,
        message: message,
      });
    });
  });
});

Hooks.on("createItem", async (item, options, userId) => {
  if (game.user.id !== userId) return;
  if (item.actor == null) return;

  const scripts = ScriptModel.getAll(item).filter((x) =>
    x.triggers.has(TRIGGER.ADD_TO_ACTOR),
  );
  if (!scripts.length) return;

  let script = scripts[0];
  if (script.length > 1) {
    const chosenScriptId = await ScriptChoiceDialog.create(scripts);
    if (chosenScriptId == null) return;
    script = scripts.find((x) => x.id === chosenScriptId);
  }

  await script.executeScript({ trigger: TRIGGER.ADD_TO_ACTOR });
});

Hooks.on("deleteItem", async (item, options, userId) => {
  if (game.user.id !== userId) return;
  if (item.actor == null) return;

  const scripts = ScriptModel.getAll(item).filter((x) =>
    x.triggers.has(TRIGGER.REMOVE_FROM_ACTOR),
  );
  if (!scripts.length) return;

  let script = scripts[0];
  if (script.length > 1) {
    const chosenScriptId = await ScriptChoiceDialog.create(scripts);
    if (chosenScriptId == null) return;
    script = scripts.find((x) => x.id === chosenScriptId);
  }

  await script.executeScript({ trigger: TRIGGER.REMOVE_FROM_ACTOR });
});
