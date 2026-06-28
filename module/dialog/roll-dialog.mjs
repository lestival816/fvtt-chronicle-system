import LOGGER from '../utils/logger.mjs'

/**
 * Specialized Dialog for roll modifiers.
 */
const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class CsRollDialog extends HandlebarsApplicationMixin(ApplicationV2) {
  constructor(options = {}) {
    super(options);
    this.resolve = null;
    // Keep the data between renders
    this.formData = {
      manualBonusDice: 0,
      manualPenaltyDice: 0,
      manualBonusModifier: 0,
      manualPenaltyModifier: 0
    };
  }

  static DEFAULT_OPTIONS = {
    tag: "form",
    id: "fvttchroniclesystem-roll-dialog",
    classes: ["fvttcs"],
    window: {
      title: "GAME.DIALOG.RollModifiers.Title",
      icon: "fas fa-dice",
    },
    position : {
      width: 280,
      height:250,
    },
    resizable: false,
    actions: {
      roll: CsRollDialog.prototype._onRoll,
      cancel: CsRollDialog.prototype._onCancel
    }
  };

  static PARTS = {
    form: {
      template: "systems/fvttchroniclesystem/templates/dialog/roll-dialog.hbs"
    }
  };

  /** @override */
  async _prepareContext(options) {
    return {
      ...this.formData,
      buttons: [
        { type: "submit", icon: "fa-solid fa-check", label: "GAME.DIALOG.RollModifiers.SubmitLabel", action: "roll" },
        { type: "button", icon: "fa-solid fa-times", label: "GAME.DIALOG.RollModifiers.CancelLabel", action: "cancel" }
      ]
    };
  }

  async _onRoll(event, target) {
    event.preventDefault();

    if (!this.element.checkValidity()) {
      this.element.reportValidity();
      return;
    }

    const fd = new foundry.applications.ux.FormDataExtended(this.element);
    this.formData = fd.object; // Saving current state

    this.resolve(this.formData);
    this.close();
  }

  _onCancel() {
    this.resolve(null);
    this.close();
  }

  /**
   * .wait() behaviour imitation
   */
  static async wait() {
    return new Promise(resolve => {
      const dialog = new CsRollDialog();
      dialog.resolve = resolve;
      dialog.render(true);
    });
  }
}