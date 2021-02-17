export default class Currency {
  /**
   * Creates a new currency class
   *
   * @param {Actor} actor - The actor used to initialize the currency
   */
  constructor(actor) {
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
    this._cp += Math.floor(amount * this._getCurrencyMultiplier());
  }

  /**
   * Adds silver to the currency object
   *
   * @param {Number} amount - The amount of silver to add
   */
  addSilver(amount) {
    this._sp += Math.floor(amount * this._getCurrencyMultiplier());
  }

  /**
   * Adds electrum to the currency object
   *
   * @param {Number} amount - The amount of electrum to add
   */
  addElectrum(amount) {
    this._ep += Math.floor(amount * this._getCurrencyMultiplier());
  }

  /**
   * Adds gold to the currency object
   *
   * @param {Number} amount - The amount of gold to add
   */
  addGold(amount) {
    this._gp += Math.floor(amount * this._getCurrencyMultiplier());
  }

  /**
   * Adds platinum to the currency object
   *
   * @param {Number} amount - The amount of platinum to add
   */
  addPlatinum(amount) {
    this._pp += Math.floor(amount * this._getCurrencyMultiplier());
  }

  /**
   * Converts the currency data to a format acceptable by LootSheetNPC5e
   *
   * @returns {Object} An object containing the currencies
   */
  convertToLootSheetCurrency() {
    this._replaceCurrencyBasedOnStandard();

    return {
      cp: { value: this._cp },
      sp: { value: this._sp },
      ep: { value: this._ep },
      gp: { value: this._gp },
      pp: { value: this._pp },
    };
  }

  _getCurrencyMultiplier() {
    return game.settings.get('dfreds-pocket-change', 'currencyMultiplier');
  }

  _replaceCurrencyBasedOnStandard() {
    const currencyStandard = game.settings.get(
      'dfreds-pocket-change',
      'currencyStandard'
    );

    if (currencyStandard == 'normal') return;

    // Convert ep to sp
    this._sp += this._ep * 5;
    this._ep = 0;

    if (currencyStandard == 'silverStandard') {
      // Convert gp to sp
      this._sp += this._gp * 10;
      this._gp = 0;

      // Convert pp to sp
      this._sp += this._pp * 100;
      this._pp = 0;

      // Convert cp to sp, keep cp change
      this._sp += Math.floor(this._cp / 10);
      this._cp = this._cp % 10;
    }
  }
}
