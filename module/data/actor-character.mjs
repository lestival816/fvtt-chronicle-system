import CsActorBase from './base-actor.mjs';
import { CS_SYSTEM } from '../helpers/config.mjs';
// Import Logger util
import LOGGER from '../utils/logger.mjs';

export default class CsCharacter extends CsActorBase {

  //** @override */
  static defineSchema() {
    const fields = foundry.data.fields;
    const requiredInteger = { required: true, nullable: false, integer: true };
    const optionalString = { required: false, default: "" };

    const schema = super.defineSchema();

    //Displayed in sheet header, along with Health and Injuries
    schema.wounds = new fields.SchemaField({
      value: new fields.NumberField({ ...requiredInteger, initial: 0, min: 0 }),
      max: new fields.NumberField({ ...requiredInteger, initial: 0, min: 0 }),
    });

    //Qualities
    //Extends the base schema
    schema.qualities = new fields.SchemaField({
      ...this.commonQualities,
      glory: new fields.SchemaField({
        total: new fields.NumberField({ ...requiredInteger, initial: 0, min: 0 }),
        spent: new fields.NumberField({ ...requiredInteger, initial: 0, min: 0 }),
        available: new fields.NumberField({ ...requiredInteger, initial: 0, min: 0 }),
      }),
      experience: new fields.SchemaField({
        total: new fields.NumberField({ ...requiredInteger, initial: 0, min: 0 }),
        spent: new fields.NumberField({ ...requiredInteger, initial: 0, min: 0 }),
        available: new fields.NumberField({ ...requiredInteger, initial: 0, min: 0 }),
      }),
      virtues: new fields.ArrayField(
        new fields.StringField(optionalString),
      ),
      vices: new fields.ArrayField(
        new fields.StringField(optionalString),
      ),
      goals: new fields.ArrayField(
        new fields.StringField(optionalString),
      ),
      motivations: new fields.ArrayField(
        new fields.StringField(optionalString),
      ),
      mannerisms: new fields.ArrayField(
        new fields.StringField(optionalString),
      ),
      distinguishingFeatures: new fields.ArrayField(
        new fields.StringField(optionalString),
      ),
      retainers: new fields.ArrayField(
        new fields.StringField(optionalString),
      ),
      allies: new fields.ArrayField(
        new fields.StringField(optionalString),
      ),
      enemies: new fields.ArrayField(
        new fields.StringField(optionalString),
      ),   
      oaths: new fields.ArrayField(
        new fields.StringField(optionalString),
      ),                                        
    });

    return schema;
  }

  //** @override */
  prepareDerivedData() {
    super.prepareDerivedData();

  }

  /**
  * Extends base modifiers with PC-specific logic.
  * @returns {Object} The combined modifiers for Player Characters.
  * @override
   */
  getRollModifiers() {
    const modifiers = super.getRollModifiers();

      // Wounds reduce the number of Test Dice (-1D per wound)
      // Affects the 'k' (keep) part of the roll formula
      modifiers.testDicePenalty = this.wounds?.value || 0;

    return modifiers;
  }
}
