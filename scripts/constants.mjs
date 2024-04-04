const MODULE_ID = "scriptable-items";
const LANG_ID = MODULE_ID.toUpperCase();
const TEMPLATES_FOLDER = `modules/${MODULE_ID}/templates`;
const FLAG = {
  SCRIPTS: "scripts",
};
const TRIGGER = {
  BUTTON: "button",
  PRE_USE: "preUseItem",
  ADD_TO_ACTOR: "addToActor",
  REMOVE_FROM_ACTOR: "removeFromActor",
};
const SETTING = {
  HEADER_BUTTON_PERMISSION: "headerButtonPermission",
  SHOW_HEADER_BUTTON_LABEL: "showHeaderButtonLabel",
};

export { MODULE_ID, LANG_ID, TEMPLATES_FOLDER, FLAG, TRIGGER, SETTING };
