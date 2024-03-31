import { MODULE_ID, TRIGGERS } from "./constants.mjs";
import { ScriptManager } from "./script-manager.mjs";
import { ScriptsOverview } from "./scripts-overview.mjs";

Hooks.on("getItemSheetHeaderButtons", (app, buttons) => {
  const item = app.document;
  buttons.unshift({
    class: MODULE_ID,
    icon: "fas fa-sd-card",
    label: game.modules.get(MODULE_ID).title,
    onclick: () => new ScriptsOverview(item).render(true),
  });
});

Hooks.on("dnd5e.preUseItem", (item, config, options) => {
  if (options.skipScripts === true) {
    return true;
  }

  const scripts = ScriptManager.getScriptsWithTrigger(item, TRIGGERS.PRE_USE);
  if (!scripts.length) return true;

  let script = scripts[0];
  if (scripts.length > 1) {
    ui.notifications.error(
      `The ${TRIGGERS.PRE_USE} trigger currently only supports one script per item.`
    );
    return true;
  }

  script.executeScript({ trigger: TRIGGERS.PRE_USE }).then((result) => {
    if (result === true) {
      options.skipScripts = true;
      item.use(config, options);
    }
  });

  return false;
});

Hooks.on("dnd5e.preDisplayCard", (item, data) => {
  if (!ScriptManager.hasScripts(item)) return;

  // Convert cards HTML string to workable DOM element
  const el = document.createElement("DIV");
  el.innerHTML = data.content;

  // Add button for each script with button trigger to the card
  const buttonContainer = el.querySelector(".card-buttons");
  for (const script of ScriptManager.getScriptsWithTrigger(
    item,
    TRIGGERS.BUTTON
  )) {
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
      const script = ScriptManager.getScriptWithId(item, scriptId);
      await script.executeScript({ trigger: TRIGGERS.BUTTON });
    });
  });
});