import { LANG_ID, TEMPLATES_FOLDER, TRIGGER } from "../constants.mjs";
import { ScriptModel } from "../data/script-model.mjs";
import { ScriptsOverview } from "./scripts-overview.mjs";

export class ScriptConfig extends MacroConfig {
  /**
   *
   * @param {ScriptModel} script
   * @param {any} options
   */
  constructor(script, options) {
    super(
      new Macro({
        _id: script.id,
        name: script.name,
        img: script.img,
        command: script.command,
      }),
      options,
    );

    this.script = script;
  }

  /** @inheritdoc */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      template: `${TEMPLATES_FOLDER}/script-config.hbs`,
    });
  }

  /** @inheritdoc */
  get title() {
    const reference = this.script.name ? ` ${this.script.name}` : "";
    return `${game.i18n.localize(`${LANG_ID}.Script.Label`)}: ${reference}`;
  }

  /** @inheritdoc */
  getData(options = {}) {
    const context = super.getData(options);

    context.data = foundry.utils.mergeObject(context.data, this.script);

    context.triggers = Object.values(TRIGGER).reduce((obj, x) => {
      obj[x] = {
        label: game.i18n.localize(`${LANG_ID}.Trigger.${x}`),
        selected: context.data.triggers.has(x) ? "selected" : "",
      };
      return obj;
    }, {});

    return context;
  }

  /** @inheritdoc */
  activateListeners(html) {
    super.activateListeners(html);
    /**
     * @type {HTMLFormElement}
     */
    const form = html[0];
    form.querySelectorAll(".trigger-control").forEach((x) => {
      x.addEventListener("click", this._onTriggerAction.bind(this));
    });
  }

  /**
   * @param {Event} event
   * @private
   */
  _onTriggerAction(event) {
    event.preventDefault();

    /**
     * @type {HTMLButtonElement | HTMLAnchorElement}
     */
    const button = event.currentTarget;
    const action = button.dataset.action;

    switch (action) {
      case "addTrigger": {
        const newTrigger = button
          .closest("form")
          .querySelector(".trigger-controls select").value;
        if (newTrigger == null) break;

        this.script.updateSource({
          triggers: [...this.script.triggers, newTrigger],
        });

        this.render();
        break;
      }
      case "removeTrigger": {
        const triggerToRemove =
          button.closest("[data-trigger-id]")?.dataset?.triggerId;

        this.script.updateSource({
          triggers: [...this.script.triggers].filter(
            (x) => x !== triggerToRemove,
          ),
        });

        this.render();
        break;
      }
    }
  }

  /** @inheritdoc */
  async _updateObject(event, formData) {
    if (!formData.triggers) {
      formData.triggers = [];
    }

    try {
      this.script.updateSource(formData);
    } catch (err) {
      ui.notifications.error(err);
      return this.render();
    }
    return ScriptModel.update(this.script.parent, this.script);
  }

  /** @inheritdoc */
  async _onExecute(event) {
    event.preventDefault();
    const command = event.currentTarget
      .closest("form")
      .querySelector('[name="command"]').value;
    this.script.updateSource({
      command: command,
    });
    this.script.executeScript();
  }
}
