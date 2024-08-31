import { LANG_ID } from "../constants.mjs";
import { ScriptModel } from "../data/script-model.mjs";

export class ScriptChoiceDialog extends Dialog {
  constructor(scripts, dialogData, options) {
    super(dialogData, options);
    this.options.classes = ["dialog", "dnd5e", "script-choice-dialog"];

    this.scripts = scripts;
  }

  /**
   * A constructor function which displays the Script Choice Dialog app for a given Array of Scripts.
   * Returns a Promise which resolves to the chosen Script's id once the choice is made.
   * @param {ScriptModel[]} scripts Array of Scripts being chosen from.
   * @returns {Promise} Promise that is resolved when the use dialog is acted upon.
   */
  static async create(scripts) {
    if (!scripts.length) return null;

    return new Promise((resolve) => {
      const dlg = new this(scripts, {
        title: "Select a Script",
        content: `<p>${game.i18n.localize(`${LANG_ID}.Dialog.ScriptChoice.Prompt`)}</p>`,
        buttons: scripts.reduce((obj, script) => {
          obj[script.id] = {
            icon: `<img src="${script.img}">`,
            label: script.name,
            callback: () => {
              resolve(script.id);
            },
          };
          return obj;
        }, {}),
        default: scripts[0].id,
        close: () => resolve(null),
      });
      dlg.render(true);
    });
  }
}
