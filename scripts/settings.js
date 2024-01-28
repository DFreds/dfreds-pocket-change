import Constants from './constants.js';

/**
 * Handles registration and access of settings
 */
export default class Settings {
  // Settings keys
  static ENABLED = 'enabled';
  static SHOW_CURRENCY_ON_NPCS = 'showCurrencyOnNpcs';
  static SHOW_CHAT_MESSAGE = 'showChatMessage';
  static CREATURE_TYPES = 'creatureTypes';
  static CHANCE_OF_NO_CURRENCY = 'chanceOfNoCurrency';
  static CURRENCY_MULTIPLIER = 'currencyMultiplier';
  static CHANCE_OF_DAMAGED_ITEMS = 'chanceOfDamagedItems';
  static DAMAGED_ITEMS_MULTIPLIER = 'damagedItemsMultiplier';
  static REMOVE_DAMAGED_ITEMS = 'removeDamagedItems';
  static USE_SILVER = 'useSilver';
  static USE_ELECTRUM = 'useElectrum';
  static USE_GOLD = 'useGold';
  static USE_PLATINUM = 'usePlatinum';

  /**
   * Register all the settings for the module
   */
  registerSettings() {
    this._registerConfigSettings();
  }

  _registerConfigSettings() {
    game.settings.register(Constants.MODULE_ID, Settings.ENABLED, {
      name: game.i18n.localize('PocketChange.SettingEnabled'),
      hint: game.i18n.localize('PocketChange.SettingEnabledHint'),
      scope: 'world',
      config: true,
      default: true,
      type: Boolean,
    });

    game.settings.register(
      Constants.MODULE_ID,
      Settings.SHOW_CURRENCY_ON_NPCS,
      {
        name: game.i18n.localize('PocketChange.SettingShowCurrencyOnNpcs'),
        hint: game.i18n.localize('PocketChange.SettingShowCurrencyOnNpcsHint'),
        scope: 'world',
        config: true,
        default: true,
        type: Boolean,
      }
    );

    game.settings.register(Constants.MODULE_ID, Settings.SHOW_CHAT_MESSAGE, {
      name: game.i18n.localize('PocketChange.SettingShowChatMessage'),
      hint: game.i18n.localize('PocketChange.SettingShowChatMessageHint'),
      scope: 'world',
      config: true,
      default: false,
      type: Boolean,
    });

    game.settings.register(Constants.MODULE_ID, Settings.CREATURE_TYPES, {
      name: game.i18n.localize('PocketChange.SettingCreatureTypes'),
      hint: game.i18n.localize('PocketChange.SettingCreatureTypesHint'),
      scope: 'world',
      config: true,
      default: 'Humanoid',
      type: String,
    });

    game.settings.register(
      Constants.MODULE_ID,
      Settings.CHANCE_OF_NO_CURRENCY,
      {
        name: game.i18n.localize('PocketChange.SettingChanceOfNoCurrency'),
        hint: game.i18n.localize('PocketChange.SettingChanceOfNoCurrencyHint'),
        scope: 'world',
        config: true,
        default: 0.25,
        range: {
          min: 0,
          max: 1,
          step: 0.05,
        },
        type: Number,
      }
    );

    game.settings.register(Constants.MODULE_ID, Settings.CURRENCY_MULTIPLIER, {
      name: game.i18n.localize('PocketChange.SettingCurrencyMultiplier'),
      hint: game.i18n.localize('PocketChange.SettingCurrencyMultiplierHint'),
      scope: 'world',
      config: true,
      default: 1,
      range: {
        min: 0,
        max: 2,
        step: 0.1,
      },
      type: Number,
    });

    game.settings.register(
      Constants.MODULE_ID,
      Settings.CHANCE_OF_DAMAGED_ITEMS,
      {
        name: game.i18n.localize('PocketChange.SettingChanceOfDamagedItems'),
        hint: game.i18n.localize(
          'PocketChange.SettingChanceOfDamagedItemsHint'
        ),
        scope: 'world',
        config: true,
        default: 0.25,
        range: {
          min: 0,
          max: 1,
          step: 0.05,
        },
        type: Number,
      }
    );

    game.settings.register(
      Constants.MODULE_ID,
      Settings.DAMAGED_ITEMS_MULTIPLIER,
      {
        name: game.i18n.localize('PocketChange.SettingDamagedItemsMultiplier'),
        hint: game.i18n.localize(
          'PocketChange.SettingDamagedItemsMultiplierHint'
        ),
        scope: 'world',
        config: true,
        default: 0.25,
        range: {
          min: 0,
          max: 1,
          step: 0.05,
        },
        type: Number,
      }
    );

    game.settings.register(Constants.MODULE_ID, Settings.REMOVE_DAMAGED_ITEMS, {
      name: game.i18n.localize('PocketChange.SettingRemoveDamagedItems'),
      hint: game.i18n.localize('PocketChange.SettingRemoveDamagedItemsHint'),
      scope: 'world',
      config: true,
      default: false,
      type: Boolean,
    });

    game.settings.register(Constants.MODULE_ID, Settings.USE_SILVER, {
      name: game.i18n.localize('PocketChange.SettingUseSilver'),
      hint: game.i18n.localize('PocketChange.SettingUseSilverHint'),
      scope: 'world',
      config: true,
      default: true,
      type: Boolean,
    });

    game.settings.register(Constants.MODULE_ID, Settings.USE_ELECTRUM, {
      name: game.i18n.localize('PocketChange.SettingUseElectrum'),
      hint: game.i18n.localize('PocketChange.SettingUseElectrumHint'),
      scope: 'world',
      config: true,
      default: true,
      type: Boolean,
    });

    game.settings.register(Constants.MODULE_ID, Settings.USE_GOLD, {
      name: game.i18n.localize('PocketChange.SettingUseGold'),
      hint: game.i18n.localize('PocketChange.SettingUseGoldHint'),
      scope: 'world',
      config: true,
      default: true,
      type: Boolean,
    });

    game.settings.register(Constants.MODULE_ID, Settings.USE_PLATINUM, {
      name: game.i18n.localize('PocketChange.SettingUsePlatinum'),
      hint: game.i18n.localize('PocketChange.SettingUsePlatinumHint'),
      scope: 'world',
      config: true,
      default: true,
      type: Boolean,
    });
  }

  /**
   * Returns the game setting for enabled
   *
   * @returns {boolean} true if currency should be generated on token drop
   */
  get enabled() {
    return game.settings.get(Constants.MODULE_ID, Settings.ENABLED);
  }

  /**
   * Returns the game setting for showing currency on NPCs
   *
   * @returns {boolean} true if currency should be displayed on NPCs
   */
  get showCurrencyOnNpcs() {
    return game.settings.get(
      Constants.MODULE_ID,
      Settings.SHOW_CURRENCY_ON_NPCS
    );
  }

  /**
   * Returns the game setting for show chat message
   *
   * @returns {boolean} true if a chat message should be displayed for dropped tokens
   */
  get showChatMessage() {
    return game.settings.get(Constants.MODULE_ID, Settings.SHOW_CHAT_MESSAGE);
  }

  /**
   * Returns the game setting for creatureTypes
   *
   */
  get creatureTypes() {
    return game.settings
      .get(Constants.MODULE_ID, Settings.CREATURE_TYPES)
      .split(';')
      .map((type) => type.toLowerCase().trim())
      .filter((type) => type);
  }

  /**
   * Returns the game setting for chanceOfNoCurrency
   *
   * @returns {number} a number between 0 and 1 with 0.1 steps, representing
   * the percent chance that currency will not be generated
   */
  get chanceOfNoCurrency() {
    return game.settings.get(
      Constants.MODULE_ID,
      Settings.CHANCE_OF_NO_CURRENCY
    );
  }

  /**
   * Returns the game setting for currencyMultiplier
   *
   * @returns {number} a number between 0 and 2 with 0.1 steps, representing
   * the amount to multiply the currency by
   */
  get currencyMultiplier() {
    return game.settings.get(Constants.MODULE_ID, Settings.CURRENCY_MULTIPLIER);
  }

  /**
   * Returns the game setting for chanceOfDamagedItems
   *
   * @returns {number} a number between 0 and 1 with 0.1 steps, representing
   * the percent chance that an item will be damaged
   */
  get chanceOfDamagedItems() {
    return game.settings.get(
      Constants.MODULE_ID,
      Settings.CHANCE_OF_DAMAGED_ITEMS
    );
  }

  /**
   * Returns the game setting for damagedItemsMultiplier
   *
   * @returns {number} a number between 0 and 1 with 0.1 steps, representing
   * the amount to multiply the price of damaged items by
   */
  get damagedItemsMultiplier() {
    return game.settings.get(
      Constants.MODULE_ID,
      Settings.DAMAGED_ITEMS_MULTIPLIER
    );
  }

  /**
   * Returns the game setting for removeDamagedItems
   *
   * @returns {boolean} true if damaged items should be removed
   */
  get removeDamagedItems() {
    return game.settings.get(
      Constants.MODULE_ID,
      Settings.REMOVE_DAMAGED_ITEMS
    );
  }

  /**
   * Returns the game setting for useSilver
   *
   * @returns {boolean} true if silver can be used
   */
  get useSilver() {
    return game.settings.get(Constants.MODULE_ID, Settings.USE_SILVER);
  }

  /**
   * Returns the game setting for useElectrum
   *
   * @returns {boolean} true if electrum can be used
   */
  get useElectrum() {
    return game.settings.get(Constants.MODULE_ID, Settings.USE_ELECTRUM);
  }

  /**
   * Returns the game setting for useGold
   *
   * @returns {boolean} true if gold can be used
   */
  get useGold() {
    return game.settings.get(Constants.MODULE_ID, Settings.USE_GOLD);
  }

  /**
   * Returns the game setting for usePlatinum
   *
   * @returns {boolean} true if platinum can be used
   */
  get usePlatinum() {
    return game.settings.get(Constants.MODULE_ID, Settings.USE_PLATINUM);
  }
}
