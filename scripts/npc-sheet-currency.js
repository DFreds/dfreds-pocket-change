import Settings from './settings.js';

/**
 * Handles injection of currency rows and actions in NPC sheets
 */
export default class NpcSheetCurrency {
  constructor({ app, html, data }) {
    this._app = app;
    this._html = html;
    this._data = data;

    this._settings = new Settings();
  }

  /**
   * Injects the currency row into an NPC sheet
   */
  async injectCurrencyRow() {
    if (!this._settings.showCurrencyOnNpcs) return;

    if (this._isDefaultSheet) {
      this._handleDefaultInjection();
    } else if (this._isTidySheet) {
      this._handleTidyInjection();
    }
  }

  get _isDefaultSheet() {
    return this._app.template.includes('npc-sheet.html');
  }

  get _isTidySheet() {
    return this._app.template.includes('tidy5e-npc.html');
  }

  async _handleDefaultInjection() {
    const content = $(await this._getDefaultTemplate());

    content
      .find('.rollable[data-action]')
      .on('click', this._onSheetAction.bind(this));

    const injectionPoint = this._html.find(
      '.sheet-body .features .inventory-filters'
    );
    injectionPoint.prepend(content);
  }

  async _getDefaultTemplate() {
    return renderTemplate(
      'modules/dfreds-pocket-change/templates/default-npc-currency-row.html',
      {
        data: this._data.data,
        config: {
          hasToken: !!this._app.token,
          currencies: {
            pp: game.i18n.localize('DND5E.CurrencyPP'),
            gp: game.i18n.localize('DND5E.CurrencyGP'),
            ep: game.i18n.localize('DND5E.CurrencyEP'),
            sp: game.i18n.localize('DND5E.CurrencySP'),
            cp: game.i18n.localize('DND5E.CurrencyCP'),
          },
        },
      }
    );
  }

  async _handleTidyInjection() {
    const content = $(await this._getTidyTemplate());

    content
      .find('.rollable[data-action]')
      .on('click', this._onSheetAction.bind(this));

    const injectionPoint = this._html.find(
      '.sheet-body .attributes .center-pane .spellbook-title'
    );
    injectionPoint.before(content);
  }

  async _getTidyTemplate() {
    return renderTemplate(
      'modules/dfreds-pocket-change/templates/tidy-npc-currency-row.html',
      {
        data: this._data.data,
        config: {
          hasToken: !!this._app.token,
          currencies: {
            pp: game.i18n.localize('TIDY5E.CurrencyAbbrPP'),
            gp: game.i18n.localize('TIDY5E.CurrencyAbbrGP'),
            ep: game.i18n.localize('TIDY5E.CurrencyAbbrEP'),
            sp: game.i18n.localize('TIDY5E.CurrencyAbbrSP'),
            cp: game.i18n.localize('TIDY5E.CurrencyAbbrCP'),
          },
        },
      }
    );
  }

  async _onSheetAction(event) {
    event.preventDefault();
    const button = event.currentTarget;
    switch (button.dataset.action) {
      case 'convertCurrency':
        await this._convertCurrency();
        break;
      case 'generateCurrency':
        await this._generateCurrency();
        break;
      case 'convertToLootable':
        await this._convertToLootable();
        break;
    }
  }

  async _convertCurrency() {
    return Dialog.confirm({
      title: `${game.i18n.localize('DND5E.CurrencyConvert')}`,
      content: `<p>${game.i18n.localize('DND5E.CurrencyConvertHint')}</p>`,
      yes: () => this._app.actor.convertCurrency(),
    });
  }

  async _generateCurrency() {
    return Dialog.confirm({
      title: game.i18n.localize('PocketChange.GenerateCurrency'),
      content: `<p>${game.i18n.localize(
        'PocketChange.GenerateCurrencyWarning'
      )}</p>`,
      yes: async () => {
        const actor = this._app.actor;
        const pocketChange = new game.dfreds.PocketChange();
        const currency = pocketChange.generateCurrency(actor);
        await actor.update({ 'data.currency': currency });
      },
      defaultYes: false,
    });
  }

  async _convertToLootable() {
    return Dialog.confirm({
      title: game.i18n.localize('PocketChange.ConvertToLootable'),
      content: `<p>${game.i18n.localize(
        'PocketChange.ConvertToLootableWarning'
      )}</p>`,
      yes: async () => {
        const token = this._app.token;
        const pocketChange = new game.dfreds.PocketChange();
        await pocketChange.convertToLoot({ token: token.object });
      },
      defaultYes: false,
    });
  }
}
