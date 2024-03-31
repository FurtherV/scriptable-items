import { SetField, StringField } from "../foundry/common/data/fields.mjs";
import { LANG_ID } from "./constants.mjs";

export class ScriptModel extends foundry.abstract.DataModel {
  static DEFAULT_ICON = "icons/svg/dice-target.svg";
  static DEFAULT_NAME = "New Script";

  /** @inheritdoc */
  static defineSchema() {
    const fields = foundry.data.fields;
    return {
      _id: new fields.DocumentIdField({
        initial: () => foundry.utils.randomID(),
      }),
      name: new fields.StringField({
        required: true,
        blank: false,
        initial: () => this.DEFAULT_NAME,
        label: "Name",
      }),
      img: new fields.FilePathField({
        categories: ["IMAGE"],
        initial: () => this.DEFAULT_ICON,
        label: "Image",
      }),
      command: new fields.StringField({
        required: true,
        blank: true,
        label: "Command",
      }),
      triggers: new fields.SetField(
        new fields.StringField({
          required: true,
          blank: false,
          label: "Trigger",
        }),
        {
          required: true,
          label: "Trigger Set",
        }
      ),
    };
  }

  /**
   * @type {string}
   */
  get id() {
    return this._id;
  }

  /**
   * @type {string}
   */
  get triggersText() {
    return !!this.triggers.size
      ? Array.from(this.triggers)
          .map((x) => game.i18n.localize(`${LANG_ID}.Trigger.${x}`))
          .join(", ")
      : "None";
  }

  /**
   * @type {Item}
   */
  get item() {
    return this.parent;
  }

  /**
   * Execute the script like a script macro.
   * Scripts are wrapped in an async IIFE to allow the use of asynchronous commands and await statements.
   * @param {object} [scope={}] Macro execution scope which is passed to script macros
   * @param {string} [scope.trigger] The trigger that caused execution of this script
   * @returns {Promise}
   */
  async executeScript({ trigger, ...scope } = {}) {
    const item = this.item;
    const speaker = ChatMessage.implementation.getSpeaker({
      actor: item.actor,
    });
    const character = game.user.character;
    const token = canvas.ready ? canvas.tokens.get(speaker.token) : null;
    const actor = token?.actor || game.actors.get(speaker.actor);
    trigger = trigger || "debug";

    // Unpack argument names and values
    const argNames = Object.keys(scope);
    if (argNames.some((k) => Number.isNumeric(k))) {
      throw new Error(
        "Illegal numeric Script parameter passed to execution scope."
      );
    }
    const argValues = Object.values(scope);

    const AsyncFunction = async function () {}.constructor;
    const fn = new AsyncFunction(
      "item",
      "speaker",
      "actor",
      "token",
      "character",
      "trigger",
      ...argNames,
      `{${this.command}\n}`
    );

    // Attempt script execution
    try {
      return await fn.call(
        this,
        item,
        speaker,
        actor,
        token,
        character,
        trigger,
        ...argValues
      );
    } catch (err) {
      ui.notifications.error(
        "There was an error in your script syntax. See the console (F12) for details."
      );
    }
  }
}
