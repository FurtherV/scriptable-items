import { FLAG, LANG_ID, MODULE_ID, TEMPLATES_FOLDER } from "../constants.mjs";
import { ScriptConfig } from "./script-config.mjs";
import { ScriptModel } from "../data/script-model.mjs";

export class ScriptsOverview extends FormApplication {
  /** @inheritdoc */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["sheet", "dnd5e", MODULE_ID, "scripts-overview"],
      template: `${TEMPLATES_FOLDER}/scripts-overview.hbs`,
      resizable: true,
      scrollY: [".scripts-element .items-list"],
    });
  }

  /** @inheritdoc */
  get title() {
    const name =
      this.object.name ??
      game.i18n.localize(this.object.constructor.metadata.label);
    return `${name}: Script Overview`;
  }

  /** @inheritdoc */
  getData(options = {}) {
    const data = super.getData();
    data.scripts = Object.entries(
      this.object.getFlag(MODULE_ID, FLAG.SCRIPTS) ?? {},
    ).map(([key, value]) => {
      const data = value;
      data._id = key;
      return new ScriptModel(data, { parent: this.object });
    });

    return data;
  }

  /** @inheritdoc */
  activateListeners(html) {
    super.activateListeners(html);

    /** @type {HTMLFormElement} */
    const form = html[0];
    const scriptsElement = form.querySelector(".scripts-element");
    for (const control of scriptsElement.querySelectorAll("[data-action]")) {
      control.addEventListener("click", (event) => {
        this._onAction(event.currentTarget, event.currentTarget.dataset.action);
      });
    }
  }

  /** @inheritdoc */
  render(...T) {
    this.object.apps[this.appId] = this;
    super.render(...T);
  }

  /** @inheritdoc */
  close(...T) {
    delete this.object.apps[this.appId];
    super.close(...T);
  }

  /** @inheritdoc */
  async _updateObject(event, formData) {}

  /**
   * @param {EventTarget} target
   * @param {string} action
   */
  async _onAction(target, action) {
    const dataset = target.closest("[data-script-id]")?.dataset;
    const script = this._getScript(dataset?.scriptId);
    if (action !== "create" && !script) return;

    switch (action) {
      case "create": {
        const newScript = new ScriptModel({}, { parent: this.object });
        return ScriptModel.update(this.object, newScript);
      }
      case "edit": {
        return new ScriptConfig(script).render(true);
      }
      case "delete": {
        const prompt = await Dialog.confirm({
          title: game.i18n.format(`${LANG_ID}.Dialog.ConfirmDelete.Title`, {
            name: script.name,
            type: game.i18n.localize(`${LANG_ID}.Script.Label`),
          }),
          content: game.i18n.format(
            `${LANG_ID}.Dialog.ConfirmDelete.AreYouSure`,
            {
              name: script.name,
              type: game.i18n.localize(`${LANG_ID}.Script.Label`),
            },
          ),
          options: { id: `${MODULE_ID}-confirm-delete-${script.id}` },
        });
        if (!prompt) return false;
        return ScriptModel.delete(this.object, script.id);
      }
    }
  }

  /**
   * @param {string} scriptId
   * @returns {ScriptModel}
   */
  _getScript(scriptId) {
    if (scriptId == null) return null;

    return new ScriptModel(
      foundry.utils.mergeObject(
        this.object.getFlag(MODULE_ID, `${FLAG.SCRIPTS}.${scriptId}`),
        {
          _id: scriptId,
        },
      ),
      { parent: this.object },
    );
  }
}
