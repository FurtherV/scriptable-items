import { LANG_ID, MODULE_ID, SETTING } from "./constants.mjs";

/**
 * Get the value of the specified setting from this module
 * @param {string} key The setting key to retrieve
 */
export function getSetting(key) {
  return game.settings.get(MODULE_ID, key);
}

/**
 * Registers this module's settings
 */
export function registerModuleSettings() {
  _registerSetting(SETTING.HEADER_BUTTON_PERMISSION, {
    scope: "world",
    config: true,
    requiresReload: true,
    type: Number,
    choices: Object.entries(CONST.USER_ROLE_NAMES).reduce((obj, [k, v]) => {
      obj[k] = game.i18n.localize(`USER.Role${v.titleCase()}`);
      return obj;
    }, {}),
    default: Object.keys(CONST.USER_ROLE_NAMES).at(-1),
  });

  _registerSetting(SETTING.SHOW_HEADER_BUTTON_LABEL, {
    scope: "world",
    config: true,
    requiresReload: false,
    type: Boolean,
    default: true,
  });

  _registerSetting(SETTING.CHAT_CARD_SCRIPT_BUTTON_ICON, {
    scope: "world",
    config: false,
    requiresReload: false,
    type: String,
    default: `fa-solid fa-code`,
  });
}

/**
 *
 * @param key
 * @param data
 */
function _registerSetting(key, data) {
  game.settings.register(
    MODULE_ID,
    key,
    foundry.utils.mergeObject(
      {
        name: `${LANG_ID}.Setting.${key}.Name`,
        hint: `${LANG_ID}.Setting.${key}.Hint`,
      },
      data,
    ),
  );
}
