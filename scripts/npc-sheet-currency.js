import API from './api.js';
import { itemPilesActive, lootSheetSimpleActive } from './main.js';
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
      await this._handleDefaultInjection();
    } else if (this._isTidySheet) {
      await this._handleTidyInjection();
    }
  }

  get _isDefaultSheet() {
    return this._app.template.includes('npc-sheet.hbs');
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
      `modules/${Settings.PACKAGE_NAME}/templates/default-npc-currency-row.html`,
      {
        data: this._data.system,
        config: {
          hasToken: !!this._app.token,
          isLootSheet: lootSheetSimpleActive,
          isItemPiles: itemPilesActive,
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
      '.sheet-body .attributes .center-pane .inventory-currency .currency'
    );
    injectionPoint.append(content);
  }

  async _getTidyTemplate() {
    return renderTemplate(
      `modules/${Settings.PACKAGE_NAME}/templates/tidy-npc-currency-row.html`,
      {
        data: this._data.system,
        config: {
          hasToken: !!this._app.token,
          isLootSheet: lootSheetSimpleActive,
          isItemPiles: itemPilesActive,
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
      case 'convertToItemPiles':
        await this._convertToItemPiles();
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
        const pocketChange = new API.PocketChange();
        const currency = pocketChange.generateCurrency(actor);
        await actor.update({ 'system.currency': currency });
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
        const pocketChange = new API.PocketChange();
        await pocketChange.convertToLoot({
          token: token.object,
          mode: 'lootsheet',
        });
      },
      defaultYes: false,
    });
  }

  async _convertToItemPiles() {
    return Dialog.confirm({
      title: game.i18n.localize('PocketChange.ConvertToItemPiles'),
      content: `<p>${game.i18n.localize(
        'PocketChange.ConvertToItemPilesWarning'
      )}</p>`,
      yes: async () => {
        const token = this._app.token;
        const pocketChange = new API.PocketChange();
        await pocketChange.convertToLoot({
          token: token.object,
          mode: 'itempiles',
        });
      },
      defaultYes: false,
    });
  }
}
