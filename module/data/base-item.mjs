export default class CsItemBase extends foundry.abstract.TypeDataModel {
  
  static defineSchema() {
    const fields = foundry.data.fields;
    const requiredInteger = { required: true, nullable: false, integer: true };
    const optionalString = { required: false, default: "" };
    const schema = {};

    schema.description = new fields.HTMLField();
    schema.quantity = new fields.NumberField({
      ...requiredInteger,
      initial: 1,
      min: 1,
    });
    schema.cost = new fields.StringField(optionalString);
    schema.weight = new fields.StringField(optionalString);

    return schema;
  }

}
