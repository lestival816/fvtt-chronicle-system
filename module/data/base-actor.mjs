// Import Abilities and Specialities structure
import { CS_SYSTEM } from '../helpers/config.mjs';
// Import Logger util
import LOGGER from '../utils/logger.mjs';

export default class CsActorBase extends foundry.abstract.TypeDataModel {
  
  /**
  * Defines the common quality fields shared between all actor types (PC and NPC).
   * This includes core mechanics like Destiny points, Benefits, and Drawbacks.
   * * @returns {Object} A collection of mapping for destiny, benefits, and drawbacks fields.
   * @static
   */
  static get commonQualities() {
    const fields = foundry.data.fields;
    return {
      destiny: new fields.SchemaField({
        base: new fields.NumberField({ initial: 0, min: 0 }),
        gained: new fields.NumberField({ initial: 0, min: 0 }),
        invested: new fields.NumberField({ initial: 0, min: 0 }),
        bonus: new fields.NumberField({ initial: 0, min: 0 }),
        spent: new fields.NumberField({ initial: 0, min: 0 }),
        burnt: new fields.NumberField({ initial: 0, min: 0 }),
        available: new fields.NumberField({ initial: 0, min: 0 }),
      }),
      benefits: new fields.ArrayField(new fields.SchemaField({
        name: new fields.StringField(),
        effect: new fields.StringField(),
      })),
      drawbacks: new fields.ArrayField(new fields.SchemaField({
        name: new fields.StringField(),
        effect: new fields.StringField(),
      }))
    };
  }

  static defineSchema() {
    const fields = foundry.data.fields;
    const requiredInteger = { required: true, nullable: false, integer: true };
    const optionalString = { required: false, default: "" };
    const schema = {};

    //Character Details
      schema.details = new fields.SchemaField({
        age: new fields.StringField(optionalString),
        gender: new fields.StringField(optionalString),
        eyeColor: new fields.StringField(optionalString),
        hairColor: new fields.StringField(optionalString),
        height: new fields.StringField(optionalString),
        weight: new fields.StringField(optionalString),
        house: new fields.StringField(optionalString),
        motto: new fields.StringField(optionalString),
      });

    schema.biography = new fields.HTMLField();

    //Abilities and Specialities
    // Iterate over ability names and create a new SchemaField for each, and for each the list of specialities.
    const abilitySchema ={};
    for (const [abiKey, abilityConfig] of Object.entries(CS_SYSTEM.scores)) {
      let specialityField;
      const specKeys = Object.keys(abilityConfig.specialities);

      //number of specilities is known and defined in Data Model
      if (specKeys.length > 0) {       
        const specialitySchema = {};
        for (const specKey of specKeys) {
          specialitySchema[specKey] = new fields.SchemaField({
            value: new fields.NumberField({...requiredInteger, required: false, initial: 0, min: 0,}),
          });
        }
        // Wrap the fixed list in a SchemaField
        specialityField = new fields.SchemaField(specialitySchema);
      } else {
        //create a dynamic array in case of unknown number of specialities (languages)
        specialityField = new fields.ObjectField({initial: {} });
      }

      abilitySchema[abiKey] = new fields.SchemaField({
        value: new fields.NumberField({...requiredInteger, initial: 2, min: 0,}),
        specialities: specialityField
      });
    } 
    schema.abilities = new fields.SchemaField(abilitySchema);

    //Health and Injuries, displayed in sheet header
    //Wounds in CsCharacter Class
    schema.health = new fields.SchemaField({
      value: new fields.NumberField({ ...requiredInteger, initial: 0, min: 0 }),
      max: new fields.NumberField({ ...requiredInteger, initial: 0, min: 0 }),
    });

    schema.injuries = new fields.SchemaField({
      value: new fields.NumberField({ ...requiredInteger, initial: 0, min: 0 }),
      max: new fields.NumberField({ ...requiredInteger, initial: 0, min: 0 }),
    });

    //Qualities
    //Qualities extended in CsCharacter Class
    schema.qualities = new fields.SchemaField(this.commonQualities)

  //Combat and Intrigue
    schema.combatDefense= new fields.SchemaField({
      value: new fields.NumberField({ ...requiredInteger, initial: 0, min: 0 }),
      bonus: new fields.NumberField({ ...requiredInteger, initial: 0, min: 0 }),
    });
    schema.intrigueDefense = new fields.SchemaField({
      value: new fields.NumberField({ ...requiredInteger, initial: 0, min: 0 }),
      bonus: new fields.NumberField({ ...requiredInteger, initial: 0, min: 0 }),
    });
    schema.composure = new fields.SchemaField({
      value: new fields.NumberField({ ...requiredInteger, initial: 0, min: 0 }),
      max: new fields.NumberField({ ...requiredInteger, initial: 0, min: 0 }),
      bonus: new fields.NumberField({ ...requiredInteger, initial: 0, min: 0 }),
    });
      schema.frustration = new fields.SchemaField({
      value: new fields.NumberField({ ...requiredInteger, initial: 0, min: 0 }),
      max: new fields.NumberField({ ...requiredInteger, initial: 0, min: 0 }),
    });
      schema.fatigue = new fields.SchemaField({
      value: new fields.NumberField({ ...requiredInteger, initial: 0, min: 0 }),
      max: new fields.NumberField({ ...requiredInteger, initial: 0, min: 0 }),
    });

    //Armor
    schema.armor = new fields.SchemaField({
      type: new fields.StringField(optionalString),
      rating: new fields.NumberField({ ...requiredInteger, initial: 0, min:0 }),
      penalty: new fields.NumberField({ ...requiredInteger, initial: 0, min:0 }),  
      bulk: new fields.NumberField({ ...requiredInteger, initial: 0, min:0 }),  
    })

    //Coinage
    schema.coinage = new fields.SchemaField({
      copper: new fields.NumberField({ ...requiredInteger, initial: 0, min: 0 }),
      silver: new fields.NumberField({ ...requiredInteger, initial: 0, min: 0 }),
      gold: new fields.NumberField({ ...requiredInteger, initial: 0, min: 0 }),
    })

    return schema;
  }

  /**
   * Calculates and returns all active modifiers for the actor based on their current state.
   * This includes penalties from injuries, wounds, fatigue, and armor.
   * Other modificators are calculated in PC and NPC classes, if any.
   * * @returns {Object} An object containing various penalty totals.
   */
  getRollModifiers() {
    const modifiers = {

      // Injuries reduce the final result of any test (-1 per injury)
      // Fatigue reduces the final result of any test (-1 per fatigue point)
      // Both are summed here as they affect the total flat modifier
      globalResultPenalty: (this.injuries?.value || 0) + (this.fatigue?.value || 0),

      // Frustration reduces the number of Test Dice specifically for Deception and Persuasion (-1D per point)
      // This will be checked in the DiceRoller when the ability key matches
      frustrationPenalty: this.frustration?.value || 0,

      // Armor penalty reduces Agility tests and Combat Defense
      armorPenalty: this.armor?.penalty || 0,

      // Defined in Character class
      // NPC doen't have wound, therefore no penalty dice.
      testDicePenalty: 0,
    };

    return modifiers;
  }

}
