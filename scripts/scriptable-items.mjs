/**
 * Main Module File
 */

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
      ? game.modules.get(MODULE_ID).title
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

  let script = scripts[0];
  if (scripts.length > 1) {
    ui.notifications.error(
      `The ${TRIGGER.PRE_USE} trigger currently only supports one script per item.`,
    );
    return true;
  }

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
  const buttonContainer = el.querySelector(".card-buttons");
  for (const script of scripts) {
    const newButton = document.createElement("BUTTON");
    newButton.setAttribute("data-action", `${MODULE_ID}-run`);
    newButton.setAttribute("data-script-id", script.id);
    newButton.innerHTML = `<i class="fas fa-play"></i> Execute ${script.name}`;
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
