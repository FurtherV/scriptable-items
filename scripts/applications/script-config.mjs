import { LANG_ID, TEMPLATES_FOLDER, TRIGGER } from "../constants.mjs";
import { ScriptModel } from "../data/script-model.mjs";

export class ScriptConfig extends FormApplication {
  /**
   *
   * @param {ScriptModel} script
   * @param {FormApplicationOptions} options
   */
  constructor(script, options = {}) {
    super(script, options);
  }

  /** @inheritdoc */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["sheet", "macro-sheet"],
      template: `${TEMPLATES_FOLDER}/script-config.hbs`,
      width: 560,
      height: 480,
      resizable: false,
      editable: true,
    });
  }

  /**
   * A semantic convenience reference to the Script instance which is the target object for this form.
   * @type {ScriptModel}
   */
  get script() {
    return this.object;
  }

  /** @inheritdoc */
  get title() {
    const reference = this.script.name ? ` ${this.script.name}` : "";
    return `${game.i18n.localize(`${LANG_ID}.Script.Label`)}: ${reference}`;
  }

  /** @inheritdoc */
  getData(options = {}) {
    const context = super.getData();

    // Data context is the script
    context.data = this.script;

    // Get available choices based on script data model
    context.permissionChoices = Object.fromEntries(
      Object.entries(CONST.DOCUMENT_OWNERSHIP_LEVELS).filter(([k, v]) =>
        this.script.schema.fields.button.fields.permission.choices.includes(v),
      ),
    );

    context.triggers = Object.values(TRIGGER).reduce((acc, x) => {
      acc[x] = {
        label: game.i18n.localize(`${LANG_ID}.Trigger.${x}`),
        selected: context.data.triggers.has(x) ? "selected" : "", // Checks what triggers are set in the data model
      };
      return acc;
    }, {});

    return context;
  }

  /**@inheritdoc */
  activateListeners(html) {
    super.activateListeners(html);

    /** @type {HTMLFormElement} */
    const form = html[0];
    form
      .querySelector("button.execute")
      .addEventListener("click", this.#onExecute.bind(this));

    form
      .querySelector("img[data-edit]")
      .addEventListener("click", this.#onEditImage.bind(this));
  }

  /** @@inheritdoc */
  async _updateObject(event, formData) {
    formData.triggers = formData.triggers || [];

    try {
      this.script.updateSource(formData);
    } catch (err) {
      ui.notifications.error(err);
      return this.render();
    }

    return ScriptModel.update(this.script.parent, this.script);
  }

  /**
   * Save and execute the script using the button on the configuration sheet.
   * @param {MouseEvent} event The click event.
   * @returns {Promise<void>}
   */
  async #onExecute(event) {
    event.preventDefault();
    await this._updateObject(event, this._getSubmitData());
    this.script.executeScript();
  }

  /**
   * Handle changing a Script's image.
   * @param {MouseEvent} event  The click event.
   * @returns {Promise}
   */
  #onEditImage(event) {
    /** @type {HTMLImageElement} */
    const imgElement = event.currentTarget;

    const currentImg = this.script.img;
    const defaultImg = this.object.DEFAULT_ICON;

    const fp = new FilePicker({
      type: "image",
      current: currentImg,
      redirectToRoot: [defaultImg],
      callback: (path) => {
        imgElement.src = path;
      },
      top: this.position.top + 40,
      left: this.position.left + 10,
    });
    return fp.browse();
  }
}
