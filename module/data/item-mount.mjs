import CsItemBase from './base-item.mjs';

export default class CsMount extends CsItemBase {

  static defineSchema() {
    const fields = foundry.data.fields;
    const schema = super.defineSchema();
    return schema;
  }

}
