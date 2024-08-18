/**
 * Main Module File
 */

import { ScriptChoiceDialog } from "./applications/script-choice-dialog.mjs";
import { MODULE_ID, SETTING, TEMPLATES_FOLDER, TRIGGER } from "./constants.mjs";
import { ScriptsOverview } from "./applications/scripts-overview.mjs";
import { getSetting, registerModuleSettings } from "./settings.mjs";
import { ScriptModel } from "./data/script-model.mjs";
import { registerModuleApi } from "./api.mjs";

Hooks.once("init", () => {
  registerModuleSettings();
  registerModuleApi();
});

Hooks.on("getItemSheetHeaderButtons", (app, buttons) => {
  if (!game.user.hasRole(getSetting(SETTING.HEADER_BUTTON_PERMISSION))) return;

  const item = app.document;
  buttons.unshift({
    class: MODULE_ID,
    icon: "fa-solid fa-code",
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

Hooks.on("dnd5e.renderChatMessage", async (message, html) => {
  const item = message.getAssociatedItem();
  if (!item) return;

  const scripts = ScriptModel.getAll(item).filter((x) =>
    x.triggers.has(TRIGGER.BUTTON),
  );
  if (!scripts.length) return;

  // Add button for each script with button trigger to the card
  let buttonContainer = html.querySelector(".card-buttons");
  if (buttonContainer == null) {
    // There are no buttons yet on the chat card, so no container, adding a container...
    buttonContainer = document.createElement("DIV");
    buttonContainer.classList.add("card-buttons");
    const parent = html.querySelector(".chat-card");
    parent.insertBefore(buttonContainer, parent.children[1]);
  }

  // Create a button for each script
  for (const script of scripts) {
    const newButton = document.createElement("BUTTON");

    const buttonHtml = await renderTemplate(
      `${TEMPLATES_FOLDER}/chat-card-button.hbs`,
      {
        action: `${MODULE_ID}-execute`,
        id: script.id,
        iconClasses: script.buttonIconClasses,
        prefix: "",
        name: script.buttonText ? script.buttonText : script.name,
      },
    );

    buttonContainer.append(newButton);

    // Outer HTML can only be set if element has a parent...
    newButton.outerHTML = buttonHtml;
  }

  // Add a listener to each button
  // The client that clicks the button executes the script, they might lack permissions though!
  html.querySelectorAll(`[data-action="${MODULE_ID}-execute"]`).forEach((x) => {
    x.addEventListener("click", async (event) => {
      event.preventDefault();
      const scriptId = event.currentTarget.dataset.scriptId;
      const item = message.getAssociatedItem();
      const script = ScriptModel.getById(item, scriptId);
      await script.executeScript({
        trigger: TRIGGER.BUTTON,
        message: message,
      });
    });
  });
});

Hooks.on("createItem", async (item, options, userId) => {
  // Execute only locally
  if (game.user.id !== userId) return;
  if (item.actor == null) return;

  const scripts = ScriptModel.getAll(item).filter((x) =>
    x.triggers.has(TRIGGER.ADD_TO_ACTOR),
  );
  if (!scripts.length) return;

  for (const script of scripts) {
    await script.executeScript({ trigger: TRIGGER.ADD_TO_ACTOR });
  }
});

Hooks.on("deleteItem", async (item, options, userId) => {
  // Execute only locally
  if (game.user.id !== userId) return;
  if (item.actor == null) return;

  const scripts = ScriptModel.getAll(item).filter((x) =>
    x.triggers.has(TRIGGER.REMOVE_FROM_ACTOR),
  );
  if (!scripts.length) return;

  for (const script of scripts) {
    await script.executeScript({ trigger: TRIGGER.REMOVE_FROM_ACTOR });
  }
});
