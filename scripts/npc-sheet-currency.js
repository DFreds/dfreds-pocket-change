export default class NpcSheetCurrency {
  constructor({ app, html, data }) {
    this._app = app;
    this._html = html;
    this._data = data;
  }

  /**
   * Injects the currency row into an NPC sheet
   */
  async injectCurrencyRow() {
    const content = $(await this._getTemplate());

    content
      .find('.rollable[data-action]')
      .on('click', this._onSheetAction.bind(this));

    const inventoryFilters = this._html.find(
      '.sheet-body .features .inventory-filters'
    );
    inventoryFilters.prepend(content);
  }

  async _getTemplate() {
    return renderTemplate(
      'modules/dfreds-pocket-change/templates/npc-currency-row.html',
      {
        data: this._data.data,
        config: {
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

  async _onSheetAction(event) {
    event.preventDefault();
    const button = event.currentTarget;
    switch (button.dataset.action) {
      case 'convertCurrency':
        await Dialog.confirm({
          title: `${game.i18n.localize('DND5E.CurrencyConvert')}`,
          content: `<p>${game.i18n.localize('DND5E.CurrencyConvertHint')}</p>`,
          yes: () => this._app.actor.convertCurrency(),
        });
        break;
      case 'regenerateCurrency':
        await Dialog.confirm({
          title: 'Regenerate All Currency',
          content: `<p>Regenerate all currency for this NPC. Be wary, this will remove all current coinage carried by the NPC and cannot be undone.</p>`,
          yes: async () => {
            const actor = this._app.actor;
            const pocketChange = new game.dfreds.PocketChange();
            const currency = pocketChange.generateCurrency(actor);
            await actor.update({ 'data.currency': currency });
          },
        });
        break;
    }
  }
}
