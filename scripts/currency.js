import Settings from "./settings.js";

export default class Currency {
  /**
   * Creates a new currency class
   *
   * @param {Actor} actor - The actor used to initialize the currency
   */
  constructor(actor) {
    this._settings = new Settings();

    this._cp = actor.data.data.currency.cp.value || 0;
    this._sp = actor.data.data.currency.cp.value || 0;
    this._ep = actor.data.data.currency.cp.value || 0;
    this._gp = actor.data.data.currency.cp.value || 0;
    this._pp = actor.data.data.currency.cp.value || 0;
  }

  /**
   * Adds copper to the currency object
   *
   * @param {Number} amount - The amount of copper to add
   */
  addCopper(amount) {
    this._cp += Math.floor(amount * this._settings.currencyMultiplier);
  }

  /**
   * Adds silver to the currency object
   *
   * @param {Number} amount - The amount of silver to add
   */
  addSilver(amount) {
    this._sp += Math.floor(amount * this._settings.currencyMultiplier);
  }

  /**
   * Adds electrum to the currency object
   *
   * @param {Number} amount - The amount of electrum to add
   */
  addElectrum(amount) {
    this._ep += Math.floor(amount * this._settings.currencyMultiplier);
  }

  /**
   * Adds gold to the currency object
   *
   * @param {Number} amount - The amount of gold to add
   */
  addGold(amount) {
    this._gp += Math.floor(amount * this._settings.currencyMultiplier);
  }

  /**
   * Adds platinum to the currency object
   *
   * @param {Number} amount - The amount of platinum to add
   */
  addPlatinum(amount) {
    this._pp += Math.floor(amount * this._settings.currencyMultiplier);
  }

  /**
   * Converts currencies down a type if they are not enabled in the settings.
   * 
   * Example: Platinum converts to gold converts to electrum if both platinum
   * and gold are disabled.
   */
  convertCurrencies() {
    if (!this._settings.usePlatinum) {
      this._convertPlatinumToGold();
    }

    if (!this._settings.useGold) {
      this._convertGoldToElectrum();
    }

    if (!this._settings.useElectrum) {
      this._convertElectrumToSilver();
    }

    if (!this._settings.useSilver)  {
      this._convertSilverToCopper();
    }
  }

  _convertPlatinumToGold() {
    this._gp += this._pp * 10;
    this._pp = 0;
  }

  _convertGoldToElectrum() {
    this._ep += this._gp * 2;
    this._gp = 0;
  }
  
  _convertElectrumToSilver() {
    this._sp += this._ep * 5;
    this._ep = 0;
  }

  _convertSilverToCopper() {
    this._cp += this._sp * 10;
    this._sp = 0;
  }

  /**
   * Converts the currency data to a format acceptable by LootSheetNPC5e
   *
   * @returns {Object} An object containing the currencies
   */
  convertToLootSheetCurrency() {
    return {
      cp: { value: this._cp },
      sp: { value: this._sp },
      ep: { value: this._ep },
      gp: { value: this._gp },
      pp: { value: this._pp },
    };
  }
}
