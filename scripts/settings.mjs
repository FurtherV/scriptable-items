import { LANG_ID, MODULE_ID, SETTING } from "./constants.mjs";

export function registerSetting(key, data) {
  game.settings.register(
    MODULE_ID,
    key,
    foundry.utils.mergeObject(
      {
        name: `${LANG_ID}.Setting.${key}.Name`,
        hint: `${LANG_ID}.Setting.${key}.Hint`,
      },
      data
    )
  );
}

export function getSetting(key) {
  return game.settings.get(MODULE_ID, key);
}

export function registerModuleSettings() {
  registerSetting(SETTING.HEADER_BUTTON_PERMISSION, {
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
}
