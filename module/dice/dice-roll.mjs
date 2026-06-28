// Import Logger util
import LOGGER from '../utils/logger.mjs';

// Import the roll modifier dialog class
import { CsRollDialog } from '../dialog/roll-dialog.mjs';

// Import Sytem Constants
import { CS_CONSTANTS } from '../helpers/constants.mjs';

/**
 * Centralized class for handling dice rolls
 */
export class CsDiceRoll {


  static async roll({ actor, dataset } = {}) {

    //Show manuel modifier dialog and wait for data
    const manualMods = await CsRollDialog.wait();

    // If the user cancelled or closed the window
    if (!manualMods) return null;

    // Prepare the roll data (formula and flavor) with manual inputs
    const rollInfo = this.prepareRollData(actor, dataset, manualMods);

    // Execute and send to chat
    const roll = new Roll(rollInfo.formula);
    await roll.evaluate();

    //rollMode deprecated from V14, replaced by messageMode
    const messageVisibilitySetting = CS_CONSTANTS.Settings.IS_V14_OR_HIGHER ? "messageMode" : "rollMode";
    const visibilitySetting = game.settings.get("core", messageVisibilitySetting);

    await roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor: actor }),
      flavor: rollInfo.flavor,
      rollMode: visibilitySetting
    });
  }

  /**
   * Method to execute a roll based on a formula and actor data.
   * * @param {Object} params
   * @param {Actor} params.actor       The actor performing the roll.
   * @param {string} params.formula    The dice formula (e.g., "4d6kh3").
   * @param {string} params.label      Label for the chat flavor text.
   */
  static async rollFormula({ actor, formula, label = "" } = {}) {
    // 1. Prepare roll data from the actor (for variables like @abilities.agility.value)
    const rollData = actor ? actor.getRollData() : {};

    // 2. Instantiate the Roll object
    const roll = new Roll(formula, rollData);

    // 3. Execute the roll
    await roll.evaluate();

    // 4. Determine roll mode (public, private, etc.)
    //rollMode deprecated from V14, replaced by messageMode
    const messageVisibilitySetting = CS_CONSTANTS.Settings.IS_V14_OR_HIGHER ? "messageMode" : "rollMode";
    const visibilitySetting = game.settings.get("core", messageVisibilitySetting);
    const rollMode = visibilitySetting;

    // 5. Send to Chat
    await roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor: actor }),
      flavor: label,
      rollMode: rollMode,
    });

    return roll;
  }


  /**
   * Prepares the dice formula and flavor text for the chat message.
   * Uses "dl" (drop lower) logic to handle Bonus Dice and penalties.
   * @param {Actor} actor       The actor performing the roll.
   * @param {Object} dataset    The dataset containing rollType, roll, and label.
   * @param {Object} manualMods The modifiers provided by the user through a dialog
   * @returns {Object}          An object containing the formula (string) and flavor (HTML string).
   */
  static prepareRollData(actor, dataset, manualMods) {

    // Get the actor's active modifiers
    const modifiers = actor.system.getRollModifiers();
    //Get the actor's abilities
    const abilities = actor.system.abilities;
    
    const label = dataset.label || "";
    
    let testDice = 0;
    let bonusDice = 0;
    let trainingDice = 0;
    let action = "";

    const parts = dataset.roll ? dataset.roll.split(':') : [];

    switch (dataset.rollType) {
      case "ability":
        action = game.i18n.localize("GAME.MESSAGES.Roll.TestAction");
        testDice = parseInt(parts[0]) || 0;
        break;

      case "speciality":
        action = game.i18n.localize("GAME.MESSAGES.Roll.TestAction");
        testDice = parseInt(parts[0]) || 0;
        bonusDice = parseInt(parts[1]) || 0;
        break;
      case "cbtInitiative":
        action = game.i18n.localize("GAME.MESSAGES.Roll.CombatInitiativeAction");
        testDice = parseInt(parts[0]) || 0;
        bonusDice = parseInt(parts[1]) || 0;
        break;        
      case "itrInitiative":
        action = game.i18n.localize("GAME.MESSAGES.Roll.IntrigueInitiativeAction");
        testDice = parseInt(parts[0]) || 0;
        bonusDice = parseInt(parts[1]) || 0;
        break;
      case "attack":
        action = game.i18n.localize("GAME.MESSAGES.Roll.CombatAttackAction");
        testDice = parseInt(parts[0]) || 0;
        bonusDice = parseInt(parts[1]) || 0;
        trainingDice = parseInt(parts[2]) || 0;
        break;

    }

    //Training can reduce Bonus Dice
    let trainingPenaltyDice = 0;
    if (dataset.rollType === "attack") {
      trainingPenaltyDice = trainingDice;
    }

    // Manual Modifiers from CsRollDialog
    const mBonusDice = parseInt(manualMods.manualBonusDice) || 0;
    const mPenaltyDice = parseInt(manualMods.manualPenaltyDice) || 0;
    const mBonusMod = parseInt(manualMods.manualBonusModifier) || 0;
    const mPenaltyMod = parseInt(manualMods.manualPenaltyModifier) || 0;

    // Determine how many dice to keep (Test Dice minus Dice Penalties)
    let diceToKeep = testDice - (modifiers.testDicePenalty || 0) - mPenaltyDice - trainingPenaltyDice;

    // Each point of frustration gained imposes –1D on all Deception and Persuasion tests
    // NPC doesn't have Frustration
    let frustrationApplied = 0;
    if (dataset.ability === "deception" || dataset.ability === "persuasion") {
      frustrationApplied = modifiers.frustrationPenalty || 0; 
      diceToKeep -= frustrationApplied;
    }

    // Determine flat penalties to result (Injuries, Fatigue, Armor)
    let flatPenalty = modifiers.globalResultPenalty || 0;

    //All forms of armor impose a penalty that you apply to the results of all Agility tests
    let armorApplied = 0;
    if (dataset.ability === "agility") {
      armorApplied = modifiers.armorPenalty;
      flatPenalty += armorApplied;
    }

    // Combined manual flat mods vs system flat penalties
    const totalFlatMod = mBonusMod - mPenaltyMod - flatPenalty;

    // Construct Formula / Format: Xd6dlY + Z
    const totalDiceCount = testDice + bonusDice + mBonusDice;

    // We make sure we don't drop negative dice if penalties made diceToKeep higher than total (rare but safe)
    let totaldiceToDrop = Math.max(0, totalDiceCount - diceToKeep);


    let formula = "";

    // If totalDiceCount is 5 and we drop 5, Foundry breaks.
    // If penalties are too high, the character rolls no dice (0d6)
    if (totaldiceToDrop >= totalDiceCount || totalDiceCount <= 0) {
      formula = `0d6`;
    } else {
      // Do not add 'dl' if totaldiceToDrop is 0
      formula = `${totalDiceCount}d6`;
      if (totaldiceToDrop > 0) {
        formula += `dl${totaldiceToDrop}`;
      }
    }

    LOGGER.debug("DiceRoll | Test Roll | Data", dataset, manualMods, modifiers, abilities, totalDiceCount, totaldiceToDrop, formula);

    // Add flat modifiers to the 0d6 or the standard roll
    if (totalFlatMod > 0) formula += ` + ${totalFlatMod}`;
    else if (totalFlatMod < 0) formula += ` - ${Math.abs(totalFlatMod)}`;

    // Construct Flavor Text (HTML)

    let flavor = `<strong>${action} ${label}</strong><br>`;
    flavor += `<small>${testDice} ${game.i18n.localize("GAME.MESSAGES.Roll.TestDice")}`;
    if (bonusDice + mBonusDice > 0) flavor += ` + ${bonusDice + mBonusDice} ${game.i18n.localize("GAME.MESSAGES.Roll.BonusDice")}`;
    if (totaldiceToDrop >0) flavor += ` (${game.i18n.localize("GAME.MESSAGES.Roll.DropAction")} ${totaldiceToDrop})</small>`;

    // List active modifiers only if they exist
    let bonuses = [];
    if (mBonusDice > 0) bonuses.push(`${game.i18n.localize("GAME.DIALOG.RollModifiers.BonusDice")}: +${mBonusDice}D`);
    if (mBonusMod > 0) bonuses.push(`${game.i18n.localize("GAME.DIALOG.RollModifiers.BonusModifier")}: +${mBonusMod}`);

    let penalties = [];
    if (mPenaltyDice > 0) penalties.push(`${game.i18n.localize("GAME.DIALOG.RollModifiers.PenaltyDice")}: -${mPenaltyDice}D`);
    if (mPenaltyMod > 0) penalties.push(`${game.i18n.localize("GAME.DIALOG.RollModifiers.PenaltyModifier")}: +${mPenaltyMod}`);
    if (trainingPenaltyDice > 0) penalties.push(`${game.i18n.localize("CS_SYSTEM.Item.Weapon.Fields.training")}: -${trainingPenaltyDice}D`);
    if (modifiers.testDicePenalty > 0) penalties.push(`${game.i18n.localize("CS_SYSTEM.Actor.Character.Fields.wounds.label")}: -${modifiers.testDicePenalty}D`);
    if (frustrationApplied > 0) penalties.push(`${game.i18n.localize("CS_SYSTEM.Actor.Character.Fields.frustration.label")}: -${frustrationApplied}D`);
    if (modifiers.globalResultPenalty > 0) penalties.push(`${game.i18n.localize("CS_SYSTEM.Actor.Character.Fields.injuries.label")}/${game.i18n.localize("CS_SYSTEM.Actor.Character.Fields.fatigue.label")}: -${modifiers.globalResultPenalty}`);
    if (armorApplied > 0) penalties.push(`${game.i18n.localize("CS_SYSTEM.Actor.Character.Fields.armor.penalty")}: -${armorApplied}`);

    if (bonuses.length > 0) {
      flavor += `<div style="color: #006400; font-size: 0.8em; border-top: 1px solid #ccc; margin-top: 4px;">`;
      flavor += `${game.i18n.localize("GAME.MESSAGES.Roll.Bonus")}:  ${bonuses.join(', ')}`;
      flavor += `</div>`;
    }

    if (penalties.length > 0) {
      flavor += `<div style="color: #8b0000; font-size: 0.8em; border-top: 1px solid #ccc; margin-top: 4px;">`;
      flavor += `${game.i18n.localize("GAME.MESSAGES.Roll.Penalties")}: ${penalties.join(', ')}`;
      flavor += `</div>`;
    }

    return { formula, flavor };
  }

}