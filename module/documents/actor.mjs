import { CS_SYSTEM } from '../helpers/config.mjs';
// Import Logger util
import LOGGER from '../utils/logger.mjs'

/**
 * Extend the base Actor document by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Actor}
 */
export class CsActor extends Actor {
  /** @override */
  prepareData() {
    // Prepare data for the actor. Calling the super version of this executes
    // the following, in order: data reset (to clear active effects),
    // prepareBaseData(), prepareEmbeddedDocuments() (including active effects),
    // prepareDerivedData().
    super.prepareData();
  }

  /** @override */
  prepareBaseData() {
    // Data modifications in this step occur before processing embedded
    // documents or derived data.
    super.prepareBaseData();
  }

  /**
   * @override
   * Augment the actor source data with additional dynamic data that isn't
   * handled by the actor's DataModel. Data calculated in this step should be
   * available both inside and outside of character sheets (such as if an actor
   * is queried and has a roll executed directly from it).
   */
  prepareDerivedData() {
      const actorData = this;
      
      // Safety check for flags
      const flags = actorData.flags.fvttchroniclesystem || {};

      LOGGER.debug("actor.mjs | Preparing derived data", actorData);

      // Common mapping for all actor types (Abilities & Specialities)
      this._prepareAbilityShortcuts(actorData);

      this._prepareNpcData(actorData);

      // Specific preparation based on type
      if (actorData.type === 'character') {
          this._prepareCharacterData(actorData);   
      }

      LOGGER.debug("actor.mjs | Derived data ready", actorData);
  }

  /**
   * Perform preliminary operations before a new Actor is created.
   * @param {object} data     The initial data object provided to the document creation.
   * @param {object} options  Additional options which modify the creation request.
   * @param {User} user       The User requesting the creation.
   * @returns {Promise<boolean|void>}      LOGGER.debug("actor.mjs | Preparing derived data:", actorData);
   * @protected
   * @override
   */
  async _preCreate(data, options, user) {
    await super._preCreate(data, options, user);

    //At the time of Actor creation, values are set to the maximum
    const updates = {
        "system.health.value": this.system.endurance * 3,
        "system.composure.value": this.system.will * 3
    };
//[Dev]
    //Change sheet image based on character type


    this.updateSource(updates);
  }


 

  /**
   * Follow the standard Foundry VTT lifecycle for document updates.
   * This method is called before any changes are written to the database.
   * Handle updates to the Actor before they are written to the database.
   * Useful for synchronizing current values with new maximums.
   * @param {object} changed  The differential data that is being changed.
   * @param {object} options  Additional options which modify the update request.
   * @param {string} userId   The ID of the User requesting the update.
   * @returns {Promise<boolean|void>}
   * @protected
   * @override
   */
  async _preUpdate(changed, options, user) {
    await super._preUpdate(changed, options, user);

    //Handle Health synchronization
    const enduranceUpdate = foundry.utils.getProperty(changed, "system.abilities.endurance.value");
    const healthUpdate = foundry.utils.getProperty(changed, "system.health.value");

    if (enduranceUpdate !== undefined) {
        const oldEndurance = this.system.abilities.endurance.value;
        const oldMax = oldEndurance * 3;
        const currentHealth = this.system.health.value;

        // Sync ONLY if the health was at max OR if the health update is just a repeat of current health
        const isAtMax = currentHealth >= oldMax;
        const isNotManualEdit = (healthUpdate === undefined) || (healthUpdate === currentHealth);

        if (isAtMax && isNotManualEdit) {
            const newMax = enduranceUpdate * 3;
            foundry.utils.setProperty(changed, "system.health.value", newMax);
        }
    }

    // Handle Composure synchronization
    const willUpdate = foundry.utils.getProperty(changed, "system.abilities.will.value");
    const composureUpdate = foundry.utils.getProperty(changed, "system.composure.value");

    if (willUpdate !== undefined) {
        const oldWill = this.system.abilities.will.value;
        const oldMaxComp = oldWill * 3;
        const currentComposure = this.system.composure.value;

        const isAtMaxComp = currentComposure >= oldMaxComp;
        const isNotManualEditComp = (composureUpdate === undefined) || (composureUpdate === currentComposure);

        if (isAtMaxComp && isNotManualEditComp) {
            const newMaxComp = willUpdate * 3;
            foundry.utils.setProperty(changed, "system.composure.value", newMaxComp);
        }
    }
  }

  /**
   * Generic mapping to create shortcuts like @agility or @quickness in roll formulas.
   * Applies to both Characters and NPCs.
   * @param {Object} actorData
   * @private
   */
  _prepareAbilityShortcuts(actorData) {
    const system = actorData.system;

    // Loop through the configuration defined in CS_SYSTEM.scores
    for (const [ablKey, ablConfig] of Object.entries(CS_SYSTEM.scores)) {
        const ability = system.abilities[ablKey];
        if (!ability) continue;

        // Create shortcut for the main Ability (e.g., system.agility = 2)
        system[ablKey] = ability.value ?? 2;

        // Create shortcuts for each Speciality within this Ability
        for (const specKey of Object.keys(ablConfig.specialities)) {
            const speciality = ability.specialities[specKey];
            
            // Create shortcut (e.g., system.quickness = 1)
            // Using nullish coalescing to ensure a number is always returned
            system[specKey] = speciality?.value ?? 0;
        }
    }
  } 

  /**
   * Extends NPC data with PC data
   * @param {Object} actorData
   * @private
   */
  _prepareCharacterData(actorData) {
    const system = actorData.system;

      // Max WWounds = Endurance rank
      system.wounds.max = system.endurance;

      // Glory Points: Total - Spent
      system.qualities.glory.available = system.qualities.glory.total - system.qualities.glory.spent;

      // Experience Points: Total - Spent
      system.qualities.experience.available = system.qualities.experience.total - system.qualities.experience.spent;

    }

  /**
   * Prepare NPC data. Includes PC data
   */
  _prepareNpcData(actorData) {
    const system = actorData.system;
    
    // --- GAUGES MAX VALUES ---
    // Health = 3 × Endurance rank
    system.health.max = 3 * system.endurance; 

    // Max Injuries & Wounds = Endurance rank
    system.injuries.max = system.endurance;

    // Max Fatigue = Endurance rank
    system.fatigue.max = system.endurance;

    // Composure = 3 × Will rank
    system.composure.max = 3 * system.will;

    // Max Frustration = Will rank
    system.frustration.max = system.will;

    // --- DEFENSES ---
    // Intrigue Defense = Awareness + Cunning + Status
    system.intrigueDefense.value = system.awareness + system.cunning + system.status + (system.intrigueDefense.bonus ?? 0);

    // Combat Defense = Agility + Athletics + Awareness + Bonus (– Penalty only in SIFRP)
    const defenseBonus = system.combatDefense?.bonus ?? 0;
    const armorPenalty = system.armor?.penalty ?? 0; 
    
    //[IMPROVEMENT] armor penalty applied only in SIFRP system.combatDefense.value = system.agility + system.athletics + system.awareness + defenseBonus - armorPenalty;
    system.combatDefense.value = system.agility + system.athletics + system.awareness + defenseBonus;

    // ---  IMPROVEMENT POINTS ---
    // Destiny Points: Available = Base + Gained - Invested - Spent - Burnt
    system.qualities.destiny.available = system.qualities.destiny.base + system.qualities.destiny.gained - system.qualities.destiny.invested - system.qualities.destiny.spent - system.qualities.destiny.burnt;
  }

  /**
   * @override
   * Augment the actor's default getRollData() method by appending the data object
   * generated by the its DataModel's getRollData(), or null. This polymorphic
   * approach is useful when you have actors & items that share a parent Document,
   * but have slightly different data preparation needs.
   */
  getRollData() {
    return { ...super.getRollData(), ...(this.system.getRollData?.() ?? null) };
  }
}
