// Import Logger util
import LOGGER from '../utils/logger.mjs'
// Import constants for icon files
import { CS_CONSTANTS } from '../helpers/constants.mjs';

/**
 * Extend the basic Item
 * @extends {Item}
 */
export class CsItem extends Item {

  /**
   * Extend the constructor to define default icons
   * @param {*} data 
   * @param {*} context 
   */
  constructor(data, context) {
    if (!data.img) {
      data.img = CS_CONSTANTS.Default_Icons[data.type];
    }
    super(data, context);
  }

  /**
   * Augment the basic Item data model with additional dynamic data.
   */
  prepareData() {
    // As with the actor class, items are documents that can have their data
    // preparation methods overridden (such as prepareBaseData()).
    super.prepareData();

    const itemData = this;
    LOGGER.debug("item.mjs | Derived data ready", itemData);
  }

  /**
   * Handle data preparation before the item is created.
   * @param {object} data     Initial data provided to the creation request.
   * @param {object} options  Additional options for creation.
   * @param {User} user      The user creating the item.
   * @returns {Promise<boolean|void>}
   * @private
   * @override
   */
  async _preCreate(data, options, user) {
    await super._preCreate(data, options, user);

    LOGGER.debug("item.mjs | preCreate", data, options, user);
    const updates = {};

    // We only want to apply defaults if we are creating a 'weapon'
    if (this.type === "weapon") {
      const updates = {
        system: {
          // Force logical defaults if not already provided
          type: data.system?.type || "melee",
          weaponQuality: data.system?.weaponQuality || "common",
          weaponAbility: data.system?.weaponAbility || "fighting",
          weaponSpecialty: data.system?.weaponSpecialty || "fencing",
          damageAbility: data.system?.damageAbility || "agility",
          damageModifier: data.system?.damageModifier ?? -1,
          training: data.system?.training ?? 0,
          weaponQualities: data.system?.weaponQualities ?? ""
        }
      };

      // Update the temporary document data before it reaches the database
      this.updateSource(updates);
      
      LOGGER.debug("item.mjs | New Weapon", this.system, updates);
    }
  }

    /**
   * Handle data preparation when the item is created.
   * @param {object} data     Initial data provided to the creation request.
   * @param {object} options  Additional options for creation.
   * @param {User} user      The user creating the item.
   * @returns {Promise<boolean|void>}
   * @private
   * @override
   */
  async _onCreate(data, options, user) {
    await super._onCreate(data, options, user);
  }


  /**
   * Prepare a data object which defines the data schema used by dice roll commands against this Item
   * @override
   */
  getRollData() {
    // Starts off by populating the roll data with a shallow copy of `this.system`
    const rollData = { ...this.system };

    // Quit early if there's no parent actor
    if (!this.actor) return rollData;

    // If present, add the actor's roll data
    rollData.actor = this.actor.getRollData();

    return rollData;
  }

  /**
   * Handle clickable rolls.
   * @param {Event} event   The originating click event
   * @private
   */
  async roll(event) {
    const item = this;

    // Initialize chat data.
    const speaker = ChatMessage.getSpeaker({ actor: this.actor });

    //rollMode deprecated from V14, replaced by messageMode
    const messageVisibilitySetting = CS_CONSTANTS.Settings.IS_V14_OR_HIGHER ? "messageMode" : "rollMode";
    const visibilitySetting = game.settings.get("core", messageVisibilitySetting);
    const rollMode = visibilitySetting;

    const label = `[${item.type}] ${item.name}`;

    // If there's no roll data, send a chat message.
    if (!this.system.formula) {
      ChatMessage.create({
        speaker: speaker,
        rollMode: rollMode,
        flavor: label,
        content: item.system.description ?? '',
      });
    }
    // Otherwise, create a roll and send a chat message from it.
    else {
      // Retrieve roll data.
      const rollData = this.getRollData();

      // Invoke the roll and submit it to chat.
      const roll = new Roll(rollData.formula, rollData.actor);
      // If you need to store the value first, uncomment the next line.
      // const result = await roll.evaluate();
      roll.toMessage({
        speaker: speaker,
        rollMode: rollMode,
        flavor: label,
      });
      return roll;
    }
  }
}
