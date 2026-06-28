import { prepareActiveEffectCategories } from '../helpers/effects.mjs';
// Import Abilities and Specialities structure
import { CS_SYSTEM } from '../helpers/config.mjs';
// Import Logger util
import LOGGER from '../utils/logger.mjs';

//To handle Dice roll
import { CsDiceRoll } from '../dice/dice-roll.mjs';

const { api, sheets } = foundry.applications;
const TextEditor = foundry.applications.ux.TextEditor;
const FilePicker = foundry.applications.apps.FilePicker;


/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheetV2}
 */
export class CsActorSheet extends api.HandlebarsApplicationMixin(
  sheets.ActorSheetV2
) {
  /** @override */
  static DEFAULT_OPTIONS = {
    classes: ['fvttcs', 'actor'],
    position: {
      width: 650,
      height: 600,
    },
    actions: {
      onEditImage: this._onEditImage,
      viewDoc: this._viewDoc,
      createDoc: this._createDoc,
      deleteDoc: this._deleteDoc,
      toggleEffect: this._toggleEffect,
      roll: this._onRoll,
      addSpeciality: this._onAddDynamicSpeciality,
      deleteSpeciality: this._onDeleteDynamicSpeciality,      
      addQuality: this._onAddQuality,
      removeQuality: this._onRemoveQuality,
      addSimpleQuality: this._onAddSimpleQuality,
    },
    // Custom property that's merged into `this.options`
    dragDrop: [{ dragSelector: '.draggable', dropSelector: null }],
    form: {
      submitOnChange: true,
    },
  };

  /** @override */
  static PARTS = {
    header: {
      template: 'systems/fvttchroniclesystem/templates/actor/header.hbs',
    },
    tabs: {
      // Foundry-provided generic template
      template: 'templates/generic/tab-navigation.hbs',
    },
    abilities: {
      template: 'systems/fvttchroniclesystem/templates/actor/abilities.hbs',
      scrollable: [""],
    },
    details: {
      template: 'systems/fvttchroniclesystem/templates/actor/details.hbs',
      scrollable: [""],
    },
    combat: {
      template: 'systems/fvttchroniclesystem/templates/actor/combat.hbs',
      scrollable: [""],
    },
    gear: {
      template: 'systems/fvttchroniclesystem/templates/actor/gear.hbs',
      scrollable: [""],
    },
  };

  /** @override */
  _configureRenderOptions(options) {
    super._configureRenderOptions(options);
    // Not all parts always render
    options.parts = ['header'];
    // Don't show the other tabs if only limited view
    if (this.document.limited) return;
    // Control which parts show based on document subtype
    switch (this.document.type) {
      case 'character':
      case 'npc':
        options.parts.push('tabs', 'abilities', 'details', 'combat', 'gear');
        break;
    }
  }

  /* -------------------------------------------- */

  /** @override */
  async _prepareContext(options) {
    // Output initialization
    const context = {
      // Validates both permissions and compendium status
      editable: this.isEditable,
      owner: this.document.isOwner,
      limited: this.document.limited,
      // Add the actor document.
      actor: this.actor,
      // Add the actor's data to context.data for easier access, as well as flags.
      system: this.actor.system,
      flags: this.actor.flags,
      // Adding a pointer to CONFIG.CS_SYSTEM
      config: CONFIG.CS_SYSTEM,
      tabs: this._getTabs(options.parts),
      // Necessary for formInput and formFields helpers
      fields: this.document.schema.fields,
      systemFields: this.document.system.schema.fields,
    };

    // Offloading context prep to a helper function
    this._prepareItems(context);

    return context;
  }

  /**
   * Prepare and sort abilities and specialities base on localization
   * @returns {Object}  All abilities, sorted in alphabetical order
   * @private
   */
  _getSortedAbilities() {
    const actorData = this.actor.system;
    const config = CONFIG.CS_SYSTEM.scores;

    const allAbilities = Object.entries(actorData.abilities).map(([key, ability]) => {
      
      // Get the specialities associated to the Ability and sort
      const sortedSpecialities = Object.entries(ability.specialities).map(([sKey, sData]) => {
        // Accessing config[key].specialities[sKey] which is the localization string
        const specLabelPath = config[key]?.specialities?.[sKey];
        
        return {
          key: sKey,
          value: sData.value,
          // Fallback to sKey if translation path is missing
          label: specLabelPath ? game.i18n.localize(specLabelPath) : sKey
        };
      }).sort((a, b) => a.label.localeCompare(b.label, game.i18n.lang));

      const abilityLabelPath = config[key]?.ability;

      return {
        key: key,
        value: ability.value,
        // Fallback to key if translation path is missing
        label: abilityLabelPath ? game.i18n.localize(abilityLabelPath) : key,
        specialities: sortedSpecialities
      };
    });

    // Sort Abilities in alphabetical order
    allAbilities.sort((a, b) => a.label.localeCompare(b.label, game.i18n.lang));

    return allAbilities;
  }

  /** @override */
  async _preparePartContext(partId, context) {
    switch (partId) {
      case 'abilities':
        context.tab = context.tabs[partId];

        const sortedAbilitiesArray = this._getSortedAbilities();
//[Dev] To improve: The left colum is longer than the right column, static -1. To change the mid point based on number of Specilaities     
        const midPoint = Math.ceil(sortedAbilitiesArray.length / 2)-1;        
        
        context.abilitiesLeft = {};
        context.abilitiesRight = {};

        sortedAbilitiesArray.forEach((abilityData, index) => {
          const key = abilityData.key; 

          const dataForHbs = {
            ...context.system.abilities[key],
            label: abilityData.label,
            sortedSpecialities: abilityData.specialities 
          };
          
          if (index < midPoint) {
            context.abilitiesLeft[key] = dataForHbs;
          } else {
            context.abilitiesRight[key] = dataForHbs;
          }
        });
        break;
      case 'combat':
        context.tab = context.tabs[partId];
        
        const actorAbilities = this.actor.system.abilities;

        // Retrieve raw data for Agility and Quickness (combat) / for Status and Reputation (intrigue)
        const cbtAblKey = "agility";
        const cbtSpecKey = "quickness";
        const itrAblKey = "status";
        const itrSpecKey = "reputation";
        
        const agilityData = actorAbilities[cbtAblKey] || { value: 2, specialities: {} };
        const quicknessValue = agilityData.specialities?.[cbtSpecKey]?.value ?? 0;
        const statusData = actorAbilities[itrAblKey] || { value: 2, specialities: {} };
        const reputationValue = statusData.specialities?.[itrSpecKey]?.value ?? 0;

        // Get localized labels
        // Using your capitalization logic if your JSON requires "Agility" and "Quickness"
        const capitalize = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : "";
        const cbtAblLabel = game.i18n.localize(`CS_SYSTEM.Ability.${capitalize(cbtAblKey)}`);
        const cbtSpecLabel = game.i18n.localize(`CS_SYSTEM.Speciality.${capitalize(cbtSpecKey)}`);
        const itrAblLabel = game.i18n.localize(`CS_SYSTEM.Ability.${capitalize(itrAblKey)}`);
        const itrSpecLabel = game.i18n.localize(`CS_SYSTEM.Speciality.${capitalize(itrSpecKey)}`);

        // Create the initiative objects for the HBS
        context.combatInitiative = {
          ability: cbtAblKey,
          speciality: cbtSpecKey,
          roll: `${agilityData.value}:${quicknessValue}`,
          label: `${cbtAblLabel} | ${cbtSpecLabel}`
        };
        context.intrigueInitiative = {
          ability: itrAblKey,
          speciality: itrSpecKey,
          roll: `${statusData.value}:${reputationValue}`,
          label: `${itrAblLabel} | ${itrSpecLabel}`
        };
        break;
      case 'gear':
        context.tab = context.tabs[partId];
        break;
      case 'details':
        context.tab = context.tabs[partId];
        // Enrich biography info for display
        // Enrichment turns text like `[[/r 1d20]]` into buttons
        context.enrichedBiography = await TextEditor.enrichHTML(
          this.actor.system.biography,
          {
            // Whether to show secret blocks in the finished html
            secrets: this.document.isOwner,
            // Data to fill in for inline rolls
            rollData: this.actor.getRollData(),
            // Relative UUID resolution
            relativeTo: this.actor,
          }
        );

        break;
    }
    return context;
  }

  /**
   * Generates the data for the generic tab navigation template
   * @param {string[]} parts An array of named template parts to render
   * @returns {Record<string, Partial<ApplicationTab>>}
   * @protected
   */
  _getTabs(parts) {
    // If you have sub-tabs this is necessary to change
    const tabGroup = 'primary';
    // Default tab for first time it's rendered this session
    if (!this.tabGroups[tabGroup]) this.tabGroups[tabGroup] = 'abilities';
    return parts.reduce((tabs, partId) => {
      const tab = {
        cssClass: '',
        group: tabGroup,
        // Matches tab property to
        id: '',
        // FontAwesome Icon, if you so choose
        icon: '',
        // Run through localization
        label: 'CS_SYSTEM.Actor.Tabs.',
      };
      switch (partId) {
        case 'header':
        case 'tabs':
          return tabs;
        case 'biography':
          tab.id = 'biography';
          tab.label += 'Biography';
          break;
        case 'details':
          tab.id = 'details';
          tab.label += 'Details';
          break;
        case 'abilities':
          tab.id = 'abilities';
          tab.label += 'Abilities';
          break;
        case 'combat':
          tab.id = 'combat';
          tab.label += 'Combat';
          break;
        case 'gear':
          tab.id = 'gear';
          tab.label += 'Gear';
          break;
      }
      if (this.tabGroups[tabGroup] === tab.id) tab.cssClass = 'active';
      tabs[partId] = tab;
      return tabs;
    }, {});
  }

  /**
   * Organize and classify Items for Actor sheets.
   *
   * @param {object} context The context object to mutate
   */
  _prepareItems(context) {
    
    // Initialize containers
    const gear = [];
    const mount = [];
    const weapon = [];

    // Shortcuts for actor data to retrieve scores
    const actorAbilities = this.actor.system.abilities || {};

    // Helper to capitalize first letter
    const capitalize = (s) => s && s[0].toUpperCase() + s.slice(1);

    // Iterate through items, allocating to containers
    for (let i of this.document.items) {
      const itemData = i.system;
      const itemName = i.name;

      if (i.type === 'gear') {
        gear.push(i);
      }
      else if (i.type === 'mount') {
        mount.push(i);
      }
      else if (i.type === 'weapon') {
        // --- Data in HBS used for Roll ---

        //Get Ability scores from Actor (e.g., Fighting)
        const ablKey = itemData.weaponAbility;
        const ablData = actorAbilities[ablKey] || { value: 2, specialities: {} };
        const dmgAblKey = itemData.damageAbility;
        const dmgAblData = actorAbilities[dmgAblKey] || {value: 2, specialities: {} };
        
        //Get Specialty rank from Actor (e.g., Longblades)
        const specKey = itemData.weaponSpecialty;
        const specValue = ablData.specialities?.[specKey]?.value || 0;

        // Transform keys to match PascalCase in localization json (e.g., fighting -> Fighting)
        const ablKeyCap = capitalize(ablKey);
        const specKeyCap = capitalize(specKey);
        const dmgAblKeyCap = capitalize(dmgAblKey)

        //Get localized labels for the chat flavor
        const ablLabel = game.i18n.localize(`CS_SYSTEM.Ability.${ablKeyCap}`);
        const specLabel = game.i18n.localize(`CS_SYSTEM.Speciality.${specKeyCap}`);
        const dmgAblLabel = game.i18n.localize(`CS_SYSTEM.Ability.${dmgAblKeyCap}`);

        //Prepare the damage modifier label
        const dmgMod = itemData.damageModifier
        let dmgModLabel = dmgMod < 0 ? String(dmgMod) : '+ ' + dmgMod;
        let dmgValue = dmgAblData.value + dmgMod;
        // Damage can't be below 1
        if (dmgValue <=1) {
            dmgValue = String("1");
        } else {
            dmgValue = String(dmgValue);
        }
  
        //Attach pre-calculated data to the item instance for the HBS template
        // We use a custom property 'hbsData'
        i.hbsData = {
          rollString: `${ablData.value}:${specValue}:${itemData.training}`,
          fullLabel: `${itemName} (${ablLabel} | ${specLabel}) `,
          abilityKey: ablKey,
          specKey: specKey,
          damageAblLabel: `${dmgValue} (${dmgAblLabel} ${dmgAblData.value} ${dmgModLabel})`
        };
        LOGGER.debug("actor-sheet.mjs | prepareItems | Data for HBS", i.hbsData);

        weapon.push(i);
      }
    }

    // Sort and assign to context (Performing sort after the loop is more efficient)
    context.gear = gear.sort((a, b) => (a.sort || 0) - (b.sort || 0));
    context.mount = mount.sort((a, b) => (a.sort || 0) - (b.sort || 0));
    context.weapon = weapon.sort((a, b) => (a.sort || 0) - (b.sort || 0));
  }

  /**
   * Actions performed after any render of the Application.
   * Post-render steps are not awaited by the render process.
   * @param {ApplicationRenderContext} context      Prepared context data
   * @param {RenderOptions} options                 Provided render options
   * @protected
   * @override
   */
  async _onRender(context, options) {
    await super._onRender(context, options);
    this.#disableOverrides();
    // You may want to add other special handling here
    // Foundry comes with a large number of utility classes, e.g. SearchFilter
    // That you may want to implement yourself.
  }

  /**************
   *
   *   ACTIONS
   *
   **************/

  /**
   * Handle changing a Document's image.
   *
   * @this CsActorSheet
   * @param {PointerEvent} event   The originating click event
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
   * @returns {Promise}
   * @protected
   */
  static async _onEditImage(event, target) {
    const attr = target.dataset.edit;
    const current = foundry.utils.getProperty(this.document, attr);
    const { img } =
      this.document.constructor.getDefaultArtwork?.(this.document.toObject()) ??
      {};
    const fp = new FilePicker({
      current,
      type: 'image',
      redirectToRoot: img ? [img] : [],
      callback: (path) => {
        this.document.update({ [attr]: path });
      },
      top: this.position.top + 40,
      left: this.position.left + 10,
    });
    return fp.browse();
  }

  /**
   * Renders an embedded document's sheet
   *
   * @this CsActorSheet
   * @param {PointerEvent} event   The originating click event
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
   * @protected
   */
  static async _viewDoc(event, target) {
    const doc = this._getEmbeddedDocument(target);
    doc.sheet.render(true);
  }

  /**
   * Handles item deletion
   *
   * @this CsActorSheet
   * @param {PointerEvent} event   The originating click event
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
   * @protected
   */
  static async _deleteDoc(event, target) {
    const doc = this._getEmbeddedDocument(target);
    await doc.delete();
  }

  /**
   * Handle creating a new Owned Item or the actor using initial data defined in the HTML dataset
   *
   * @this CsActorSheet
   * @param {PointerEvent} event   The originating click event
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
   * @private
   */
  static async _createDoc(event, target) {
    // Retrieve the configured document class for Item or ActiveEffect
    const docCls = getDocumentClass(target.dataset.documentClass);

    // Prepare the document creation data by initializing it a default name.
    const docData = {
      name: docCls.defaultName({
        // defaultName handles an undefined type gracefully
        type: target.dataset.type,
        parent: this.actor,
      }),
    };
    // Loop through the dataset and add it to our docData
    for (const [dataKey, value] of Object.entries(target.dataset)) {
      // These data attributes are reserved for the action handling
      if (['action', 'documentClass'].includes(dataKey)) continue;
      // Nested properties require dot notation in the HTML, e.g. anything with `system`
      // An example exists in spells.hbs, with `data-system.spell-level`
      // which turns into the dataKey 'system.spellLevel'
      foundry.utils.setProperty(docData, dataKey, value);
    }

    // Finally, create the embedded document!
    await docCls.create(docData, { parent: this.actor });
  }


  /**
   * Handle clickable rolls.
   *
   * @this CsActorSheet
   * @param {PointerEvent} event   The originating click event
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
   * @protected
   */
  static async _onRoll(event, target) {
    event.preventDefault();
    const dataset = target.dataset;

    if (dataset.action === 'roll') {
      
      /**
       * We delegate the entire logic to CsDiceRoll.roll().
       * This method will:
       * 1. Open the DialogV2 (CsRollDialog)
       * 2. Wait for manual modifiers
       * 3. Prepare the "dl" formula and localized flavor text
       * 4. Execute the roll and send it to the Chat
       */
      return await CsDiceRoll.roll({
        actor: this.actor,
        dataset: dataset
      });
    }

  }

  /** Helper Functions */

  /**
   * Fetches the embedded document representing the containing HTML element
   *
   * @param {HTMLElement} target    The element subject to search
   * @returns {Item | ActiveEffect} The embedded Item or ActiveEffect
   */
  _getEmbeddedDocument(target) {
    const docRow = target.closest('li[data-document-class]');
    if (docRow.dataset.documentClass === 'Item') {
      return this.actor.items.get(docRow.dataset.itemId);
    } else if (docRow.dataset.documentClass === 'ActiveEffect') {
      const parent =
        docRow.dataset.parentId === this.actor.id
          ? this.actor
          : this.actor.items.get(docRow?.dataset.parentId);
      return parent.effects.get(docRow?.dataset.effectId);
    } else return console.warn('Could not find document class');
  }

  /***************
   *
   * Drag and Drop
   *
   ***************/

    /**
   * Handle the dropping of ActiveEffect data onto an Actor Sheet
   * @param {DragEvent} event                  The concluding DragEvent which contains drop data
   * @param {object} data                      The data transfer extracted from the event
   * @returns {Promise<ActiveEffect|boolean>}  The created ActiveEffect object or false if it couldn't be created.
   * @protected
   */
  async _onDropActiveEffect(event, data) {
    const aeCls = getDocumentClass('ActiveEffect');
    const effect = await aeCls.fromDropData(data);
    if (!this.actor.isOwner || !effect) return false;
    if (effect.target === this.actor)
      return this._onSortActiveEffect(event, effect);
    return aeCls.create(effect, { parent: this.actor });
  }

  /**
   * Handle a drop event for an existing embedded Active Effect to sort that Active Effect relative to its siblings
   *
   * @param {DragEvent} event
   * @param {ActiveEffect} effect
   */
  async _onSortActiveEffect(event, effect) {
    /** @type {HTMLElement} */
    const dropTarget = event.target.closest('[data-effect-id]');
    if (!dropTarget) return;
    const target = this._getEmbeddedDocument(dropTarget);

    // Don't sort on yourself
    if (effect.uuid === target.uuid) return;

    // Identify sibling items based on adjacent HTML elements
    const siblings = [];
    for (const el of dropTarget.parentElement.children) {
      const siblingId = el.dataset.effectId;
      const parentId = el.dataset.parentId;
      if (
        siblingId &&
        parentId &&
        (siblingId !== effect.id || parentId !== effect.parent.id)
      )
        siblings.push(this._getEmbeddedDocument(el));
    }

    // Perform the sort
    const sortUpdates = SortingHelpers.performIntegerSort(effect, {
      target,
      siblings,
    });

    // Split the updates up by parent document
    const directUpdates = [];

    const grandchildUpdateData = sortUpdates.reduce((items, u) => {
      const parentId = u.target.parent.id;
      const update = { _id: u.target.id, ...u.update };
      if (parentId === this.actor.id) {
        directUpdates.push(update);
        return items;
      }
      if (items[parentId]) items[parentId].push(update);
      else items[parentId] = [update];
      return items;
    }, {});

    // Effects-on-items updates
    for (const [itemId, updates] of Object.entries(grandchildUpdateData)) {
      await this.actor.items
        .get(itemId)
        .updateEmbeddedDocuments('ActiveEffect', updates);
    }

    // Update on the main actor
    return this.actor.updateEmbeddedDocuments('ActiveEffect', directUpdates);
  }

  /**
   * Handle dropping of an Actor data onto another Actor sheet
   * @param {DragEvent} event            The concluding DragEvent which contains drop data
   * @param {object} data                The data transfer extracted from the event
   * @returns {Promise<object|boolean>}  A data object which describes the result of the drop, or false if the drop was
   *                                     not permitted.
   * @protected
   */
  async _onDropActor(event, data) {
    if (!this.actor.isOwner) return false;
  }


  /* -------------------------------------------- */

  /**
   * Handle dynamic specilities (languages)
   * 
   */

  /**
   * Handle adding a new dynamic specialty (e.g., a new Language).
   * @param {MouseEvent} event                    The originating click event
   * @param {HTMLElement} target                  The anchor element that triggered the action, containing data-path.
   * @protected
   * @static
   */
  static async _onAddDynamicSpeciality(event, target) {

    event.preventDefault();

    
    // Extract the ability key from the data-ability attribute (e.g., "language")
    const abilityKey = target.dataset.ability;
    
    // Generate a unique random ID to prevent key collisions in the ObjectField
    const randomId = foundry.utils.randomID();

    
    // Prepare the update object using a template literal for the path
    const updateData = {
      [`system.abilities.${abilityKey}.specialities.${randomId}`]: {
        label: "",
        value: 1 
      }
    };
    
    // Execute the update on the actor document
    return await this.actor.update(updateData);
  }

  /**
   * Handle deleting a dynamic specialty from an ObjectField.
   * @param {MouseEvent} event                    The originating click event
   * @param {HTMLElement} target                  The anchor element that triggered the action, containing data-path.
   * @protected
   * @static
   */
  static async _onDeleteDynamicSpeciality(event, target) {
    event.preventDefault();
    
    // Destructure ability and speciality keys from the dataset (data-ability, data-speciality)
    const { ability, speciality } = target.dataset;
    
    return await this.actor.update({
      [`system.abilities.${ability}.specialities.-=${speciality}`]: null
    });
    
  }

  /* -------------------------------------------- */

  /**
   * Handle benefit/drawback element creation
   * 
   */
  /**
   * Adds a new, empty quality object {name, effect} to an array path in the Actor's data.
   * Used for ArrayField<SchemaField> like Benefits and Drawbacks.
   * @param {MouseEvent} event                    The originating click event.
   * @param {HTMLElement} target                  The anchor element that triggered the action, containing data-path.
   * @returns {Promise<void>}
   * @protected
   * @static
   */ 
  static async _onAddQuality(event, target) {
    const path = target.dataset.path;
    const currentArray = foundry.utils.getProperty(this.actor, path) || [];
    
    // Create new item
    const newItem = { name: "", effect: "" };
    
    // Update the actor with the new table
    await this.actor.update({
      [path]: [...currentArray, newItem]
    });
  }

  /**
   * Adds a new, empty string element to an array path in the Actor's data.
   * Used for ArrayField<StringField> like Virtues, Vices, Goals, etc.
   * @param {MouseEvent} event                    The originating click event.
   * @param {HTMLElement} target                  The anchor element that triggered the action, containing data-path.
   * @returns {Promise<void>}
   * @protected
   * @static
   */
  static async _onAddSimpleQuality(event, target) {
    const path = target.dataset.path;
    const currentArray = foundry.utils.getProperty(this.actor, path) || [];
    
    // Create new item
    const newItem = "";
    
    // Update the actor with the new table
    await this.actor.update({
      [path]: [...currentArray, newItem]
    });
  }

/**
   * Removes an element from an array path in the Actor's data based on its index.
   * Works for both object arrays (Benefits) and string arrays (Virtues).
   * @param {MouseEvent} event                    The originating click event.
   * @param {HTMLElement} target                  The anchor element that triggered the action, containing data-path and data-index.
   * @returns {Promise<void>}
   * @protected
   * @static
   */
  static async _onRemoveQuality(event, target) {
    const path = target.dataset.path;
    const index = parseInt(target.dataset.index); // Item indesx to delete
    
    const currentArray = foundry.utils.getProperty(this.actor, path);
    if (!currentArray) return;

    const newArray = [...currentArray];
    newArray.splice(index, 1);

    // Update the actor
    await this.actor.update({
      [path]: newArray
    });
  }



  /* -------------------------------------------- */
   /**
   * Handle dropping of a Folder on an Actor Sheet.
   * The core sheet currently supports dropping a Folder of Items to create all items as owned items.
   * @param {DragEvent} event     The concluding DragEvent which contains drop data
   * @param {object} data         The data transfer extracted from the event
   * @returns {Promise<Item[]>}
   * @protected
   */
  async _onDropFolder(event, data) {
    if (!this.actor.isOwner) return [];
    const folder = await Folder.implementation.fromDropData(data);
    if (folder.type !== 'Item') return [];
    const droppedItemData = await Promise.all(
      folder.contents.map(async (item) => {
        if (!(document instanceof Item)) item = await fromUuid(item.uuid);
        return item;
      })
    );
    return this._onDropItemCreate(droppedItemData, event);
  }

  /**
   * Handle the final creation of dropped Item data on the Actor.
   * This method is factored out to allow downstream classes the opportunity to override item creation behavior.
   * @param {object[]|object} itemData      The item data requested for creation
   * @param {DragEvent} event               The concluding DragEvent which provided the drop data
   * @returns {Promise<Item[]>}
   * @private
   */
  async _onDropItemCreate(itemData, event) {
    itemData = itemData instanceof Array ? itemData : [itemData];
    return this.actor.createEmbeddedDocuments('Item', itemData);
  }

  /********************
   *
   * Actor Override Handling
   *
   ********************/

  /**
   * Submit a document update based on the processed form data.
   * @param {SubmitEvent} event                   The originating form submission event
   * @param {HTMLFormElement} form                The form element that was submitted
   * @param {object} submitData                   Processed and validated form data to be used for a document update
   * @returns {Promise<void>}
   * @protected
   * @override
   */
  async _processSubmitData(event, form, submitData) {

    const overrides = foundry.utils.flattenObject(this.actor.overrides);
    for (let k of Object.keys(overrides)) delete submitData[k];
    await this.document.update(submitData);
  }

  /**
   * Render the application by updating its HTML content.
   * Logs the Actor's schema to the console when the sheet is opened.
   * @param {boolean} [force=false]               Force the application to re-render, even if it is already rendered.
   * @param {ApplicationRenderOptions} [options={}] Optional arguments which override rendering defaults.
   * @returns {Application}                       The Application instance for chaining.
   * @protected
   * @override
   */
  render(options) {

    return super.render(options);
  }

  /**
   * Disables inputs subject to active effects
   */
  #disableOverrides() {
    const flatOverrides = foundry.utils.flattenObject(this.actor.overrides);
    for (const override of Object.keys(flatOverrides)) {
      const input = this.element.querySelector(`[name="${override}"]`);
      if (input) {
        input.disabled = true;
      }
    }
  }
}
