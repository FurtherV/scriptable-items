import { FLAGS, MODULE_ID, TEMPLATES_FOLDER } from "./constants.mjs";
import { ScriptConfig } from "./script-config.mjs";
import { ScriptModel } from "./script-model.mjs";

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
      this.object.getFlag(MODULE_ID, FLAGS.SCRIPTS) ?? {}
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
        this._onAction(
          event.currentTarget,
          event.currentTarget.dataset["action"]
        );
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
  async _updateObject(event, formData) {
    return;
  }

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
        return ScriptsOverview._embedScript(this.object, newScript);
      }
      case "edit": {
        return new ScriptConfig(script).render(true);
      }
      case "delete": {
        return this.object.unsetFlag(
          MODULE_ID,
          `${FLAGS.SCRIPTS}.${script.id}`
        );
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
        this.object.getFlag(MODULE_ID, `${FLAGS.SCRIPTS}.${scriptId}`),
        {
          _id: scriptId,
        }
      ),
      { parent: this.object }
    );
  }

  /**
   * @param {Item} item
   * @param {ScriptModel} script
   * @returns {Promise}
   */
  static async _embedScript(item, script) {
    const data = script.toObject();
    await item.update(
      { [`flags.${MODULE_ID}.${FLAGS.SCRIPTS}.-=${data._id}`]: null },
      { render: false, noHook: true }
    );
    return item.setFlag(MODULE_ID, `${FLAGS.SCRIPTS}.${data._id}`, data);
  }
}
