// Import Abilities and Specialities structure
import { CS_SYSTEM } from '../helpers/config.mjs';

import CsItemBase from './base-item.mjs';

export default class CsWeapon extends CsItemBase {

  static defineSchema() {
    const fields = foundry.data.fields;
    const requiredInteger = { required: true, nullable: false, integer: true };
    const optionalString = { required: false, default: "" };
    const schema = super.defineSchema();

    // Weapon category: defines which primary ability is used for the test
      schema.type = new fields.StringField({
        required: true,
        initial: "melee",
        choices: ["melee", "ranged"]
      }),

      // Craftsmanship level of the weapon
     schema.weaponQuality = new fields.StringField({
        required: true,
        initial: "common",
        choices: ["poor", "common", "superior", "extraordinary"]
      }),

      // The specific ability used for the attack test (based on Abilities and Specialities Structure)
      // melee -> "fighting" / ranged -> "marksmanship";
      schema.weaponAbility = new fields.StringField({ 
        required: true,
        initial: "", 
        blank: true 
      }),

      // The specific speciality used for the attack test (based on Abilities and Specialities Structure)
      schema.weaponSpecialty = new fields.StringField({ 
        required: true,
        initial: "", 
        blank: true 
      }),

      // Training level or bonus dice notation (e.g., "1B", "2B") - only number of dice is provided
      schema.training = new fields.NumberField({
        ...requiredInteger,
        initial: 0,
        min: 0,
        max:2,
      });

      // Which actor ability is added to the base damage
      schema.damageAbility = new fields.StringField({
        required:true,
        initial: "none",
        choices: Object.keys(CS_SYSTEM.scores).concat(["none"])
      }),

      // Flat damage modifier. Can be negative (e.g., -2 for a dagger) 
      // or positive (e.g., +3 for a Greatsword).
      // Damage can't be below 1
      schema.damageModifier = new fields.NumberField({ 
        initial: 0, 
        integer: true, 
        required: true,
        min: -5, 
        max: 5
      }),

      // String description of weapon traits (e.g., "Slow, Powerful, Piercing 1")
      schema.weaponQualities = new fields.StringField({ 
        initial: "", 
        blank: true 
      })

    return schema;
  }

}
