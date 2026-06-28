// Import document classes.
import { CsActor } from './documents/actor.mjs';
import { CsItem } from './documents/item.mjs';
// Import sheet classes.
import { CsActorSheet } from './sheets/actor-sheet.mjs';
import { CsItemSheet } from './sheets/item-sheet.mjs';
// Import helper/utility classes and constants.
import { CS_SYSTEM } from './helpers/config.mjs';

// Import DataModel classes
import * as models from './data/_module.mjs';

// Import Sytem Constants
import { CS_CONSTANTS } from './helpers/constants.mjs';
// Import System Settings
import registerSystemSettings from './helpers/settings.mjs';
// Import Logger util
import LOGGER from './utils/logger.mjs'

const collections = foundry.documents.collections;
const sheets = foundry.appv1.sheets;


/* -------------------------------------------- */
/*  Init Hook                                   */
/* -------------------------------------------- */

// Add key classes to the global scope so they can be more easily used
// by downstream developers
globalThis.fvttchroniclesystem = {
  documents: {
    CsActor,
    CsItem,
  },
  applications: {
    CsActorSheet,
    CsItemSheet,
  },
  utils: {
    rollItemMacro,
  },
  models
};



Hooks.once('init', function () {

  //Identify Foundry Version and store the information in Constants
  const foundryGeneration = game.release?.generation || 13;
  CS_CONSTANTS.Settings.FOUNDRY_VERSION = foundryGeneration;
  CS_CONSTANTS.Settings.IS_V14_OR_HIGHER = foundryGeneration >= 14;


  //LOGGER.info(`\n****************************************************\n*  Initializing System: The Chronicle System *\n****************************************************`);
  LOGGER.info(`\n***********************************************************\n* Initializing System: The Chronicle System (Foundry v${CS_CONSTANTS.Settings.FOUNDRY_VERSION}) *\n***********************************************************`);

  // Add custom constants for configuration.
  CONFIG.CS_SYSTEM = CS_SYSTEM;
  /**
   * Register System Settings
   */
  registerSystemSettings();

  const debugStatus = LOGGER.getDebugStatus();
  LOGGER.info(`${CS_CONSTANTS.Settings.DEBUG_LOGS} is set to ${debugStatus}`);
  LOGGER.debug("CONFIG at initialization", CONFIG);

  /**
   * Set an initiative formula for the system
   * @type {String}
   */
    CONFIG.Combat.initiative = {
      formula: "(@abilities.agility.value + @abilities.agility.specialities.quickness.value)d6kh@abilities.agility.value",
      decimals: 0
    };

  // Define custom Document and DataModel classes
  CONFIG.Actor.documentClass = CsActor;
  // The base actor clase is included with the Character/NPC as part of super.defineSchema()
  CONFIG.Actor.dataModels = {
    character: models.CsCharacter,
    npc: models.CsNPC,
  };
  
  CONFIG.Item.documentClass = CsItem;
  // The base tem classe is included as part of super.defineSchema()
  CONFIG.Item.dataModels = {
    gear: models.CsGear,
    mount: models.CsMount,
    weapon: models.CsWeapon,
  };

  // Active Effects are never copied to the Actor,
  // but will still apply to the Actor from within the Item
  // if the transfer property on the Active Effect is true.
  CONFIG.ActiveEffect.legacyTransferral = false;

 preloadHandlebarsTemplates();

  // Register sheet application classes
  collections.Actors.unregisterSheet('core', sheets.ActorSheet);
  collections.Actors.registerSheet('fvttchroniclesystem', CsActorSheet, {
    makeDefault: true,
    label: 'CS_SYSTEM.SheetLabels.Actor',
  });
  collections.Items.unregisterSheet('core', sheets.ItemSheet);
  collections.Items.registerSheet('fvttchroniclesystem', CsItemSheet, {
    makeDefault: true,
    label: 'CS_SYSTEM.SheetLabels.Item',
    types: ["gear", "mount", "weapon"],
  });
});

/* -------------------------------------------- */
/*  Handlebars Helpers                          */
/* -------------------------------------------- */

// If you need to add Handlebars helpers, here is a useful example:
Handlebars.registerHelper('toLowerCase', function (str) {
  return str.toLowerCase();
});

Handlebars.registerHelper('list', function() {
        return Array.from(arguments).slice(0, -1);
});

async function preloadHandlebarsTemplates() {
  const templatePaths = [
    "systems/fvttchroniclesystem/templates/actor/parts/actor-benefits.hbs",
    "systems/fvttchroniclesystem/templates/actor/parts/actor-qualities.hbs",
  ];

  return foundry.applications.handlebars.loadTemplates(templatePaths);
}

/* -------------------------------------------- */
/*  Ready Hook                                  */
/* -------------------------------------------- */

Hooks.once('ready', function () {
  // Wait to register hotbar drop hook on ready so that modules could register earlier if they want to
  Hooks.on('hotbarDrop', (bar, data, slot) => createDocMacro(data, slot));
});

/* -------------------------------------------- */
/*  Hotbar Macros                               */
/* -------------------------------------------- */

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {Object} data     The dropped data
 * @param {number} slot     The hotbar slot to use
 * @returns {Promise}
 */
async function createDocMacro(data, slot) {
  // First, determine if this is a valid owned item.
  if (data.type !== 'Item') return;
  if (!data.uuid.includes('Actor.') && !data.uuid.includes('Token.')) {
    return ui.notifications.warn(
      'You can only create macro buttons for owned Items'
    );
  }
  // If it is, retrieve it based on the uuid.
  const item = await Item.fromDropData(data);

  // Create the macro command using the uuid.
  const command = `game.fvttchroniclesystem.rollItemMacro("${data.uuid}");`;
  let macro = game.macros.find(
    (m) => m.name === item.name && m.command === command
  );
  if (!macro) {
    macro = await Macro.create({
      name: item.name,
      type: 'script',
      img: item.img,
      command: command,
      flags: { 'fvttchroniclesystem.itemMacro': true },
    });
  }
  game.user.assignHotbarMacro(macro, slot);
  return false;
}

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {string} itemUuid
 */
function rollItemMacro(itemUuid) {
  // Reconstruct the drop data so that we can load the item.
  const dropData = {
    type: 'Item',
    uuid: itemUuid,
  };
  // Load the item from the uuid.
  Item.fromDropData(dropData).then((item) => {
    // Determine if the item loaded and if it's an owned item.
    if (!item || !item.parent) {
      const itemName = item?.name ?? itemUuid;
      return ui.notifications.warn(
        `Could not find item ${itemName}. You may need to delete and recreate this macro.`
      );
    }

    // Trigger the item roll
    item.roll();
  });
}
