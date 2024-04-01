![](https://img.shields.io/endpoint?url=https%3A%2F%2Ffoundryshields.com%2Fversion%3Fstyle%3Dfor-the-badge%26url%3Dhttps%3A%2F%2Fraw.githubusercontent.com%2FFurtherV%2Fscriptable-items%2Fmaster%2Fmodule.json)
![](https://img.shields.io/endpoint?url=https%3A%2F%2Ffoundryshields.com%2Fsystem%3FnameType%3Dfull%26showVersion%3D1%26style%3Dfor-the-badge%26url%3Dhttps%3A%2F%2Fraw.githubusercontent.com%2FFurtherV%2Fscriptable-items%2Fmaster%2Fmodule.json)

# Scriptable Items

A module for the Foundry `dnd5e` system, which allows you to attach one or more JS scripts to an item.
Each of these scripts can have multiple triggers that determine when or how the script is executed.

After installing this module, you can find a 'Scriptable Items' button in any item sheet header.
Clicking this button opens an overview where you can edit that item's scripts.

A script receives the following arguments (very similar to a normal Foundry macro!) when run:

- `this` is a copy of the Script itself
- `item` the item containing the script
- `speaker` speaker data of the item's actor or the currently selected token or user's character
- `actor` actor from the speaker data, usually the item's owner
- `token` token from the speaker data
- `character` the current user's character or null
- `trigger` the trigger of the script, such as a button press or on item use.
  Is equal to `debug` when ran from the script's config sheet.
- `message` the chat message which triggered the script (only `trigger === "button"`)

Available triggers are currently:

- When using the item (`dnd5e.preUseItem`)
  - If you want to also have normal item usage, you can return `true` from the script
  - If you want to use `item.use()` inside the script, you can use `item.use({}, {skipScripts: true})`
- A button in the item's chat card

## Changelog

### 0.1.2

- Added `message` argument to scripts when triggered via chat card button.

### 0.1.1

- Adjusted README to convey more information as well as the new dependency
- Added system requirement to module manifest

### 0.1.0

- Initial release for public testing
