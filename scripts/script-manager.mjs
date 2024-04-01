import { FLAG, MODULE_ID } from "./constants.mjs";
import { ScriptModel } from "./script-model.mjs";

export class ScriptManager {
  /**
   * @param {Item} item
   * @returns {boolean}
   */
  static hasScripts(item) {
    if (item == null) return false;
    const scriptsObj = item.getFlag(MODULE_ID, FLAG.SCRIPTS);
    return scriptsObj != null && !!Object.keys(scriptsObj).length;
  }

  /**
   * @param {Item} item
   * @returns {ScriptModel[]}
   */
  static getScripts(item) {
    if (!this.hasScripts(item)) return [];
    const scriptsObj = item.getFlag(MODULE_ID, FLAG.SCRIPTS);
    return Object.entries(scriptsObj).map(([k, v]) => {
      return new ScriptModel(
        {
          _id: k,
          ...v,
        },
        { parent: item }
      );
    });
  }

  /**
   * @param {Item} item
   * @param {string} trigger
   * @returns {ScriptModel[]}
   */
  static getScriptsWithTrigger(item, trigger) {
    const scripts = this.getScripts(item);
    return scripts.filter((x) => x.triggers.has(trigger));
  }

  /**
   * @param {Item} item
   * @param {string} id
   * @returns {ScriptModel[]}
   */
  static getScriptWithId(item, id) {
    if (!this.hasScripts(item)) return null;
    const scriptObj = item.getFlag(MODULE_ID, `${FLAG.SCRIPTS}.${id}`);
    if (scriptObj == null) return null;
    return new ScriptModel(
      {
        _id: id,
        ...scriptObj,
      },
      { parent: item }
    );
  }
}
