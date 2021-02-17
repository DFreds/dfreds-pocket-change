export default class Settings {
  /**
   * Register all the settings for the module
   */
  registerSettings() {
    game.settings.register('dfreds-pocket-change', 'enabled', {
      name: 'Enabled',
      hint:
        'If enabled, currency will be generated for tokens dropped in scenes.',
      scope: 'world',
      config: true,
      default: true,
      type: Boolean,
    });

    game.settings.register('dfreds-pocket-change', 'creatureTypes', {
      name: 'Creature types',
      hint:
        'These are the types of creatures that will generate currency, separated via semi-colons. Leave it blank to generate currency for all types of creatures. Example: Humanoid;Gnome;Elf',
      scope: 'world',
      config: true,
      default: 'Humanoid',
      type: String,
    });

    game.settings.register('dfreds-pocket-change', 'chanceOfNoCurrency', {
      name: 'Chance of no currency',
      hint:
        'This is the percent chance that no money will be generated for a token.',
      scope: 'world',
      config: true,
      default: 0.25,
      range: {
        min: 0,
        max: 1,
        step: 0.05,
      },
      type: Number,
    });

    game.settings.register('dfreds-pocket-change', 'currencyMultiplier', {
      name: 'Currency multiplier',
      hint: 'This multiplies the generated currency by the given number.',
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

    game.settings.register('dfreds-pocket-change', 'useSilver', {
      name: 'Use Silver',
      hint: 'If enabled, generated currency could include silver. Copper is always included.',
      scope: 'world',
      config: true,
      default: true,
      type: Boolean,
    });

    game.settings.register('dfreds-pocket-change', 'useElectrum', {
      name: 'Use Electrum',
      hint: 'If enabled, generated currency could include electrum. Copper is always included.',
      scope: 'world',
      config: true,
      default: true,
      type: Boolean,
    });

    game.settings.register('dfreds-pocket-change', 'useGold', {
      name: 'Use Gold',
      hint: 'If enabled, generated currency could include gold. Copper is always included.',
      scope: 'world',
      config: true,
      default: true,
      type: Boolean,
    });

    game.settings.register('dfreds-pocket-change', 'usePlatinum', {
      name: 'Use Platinum',
      hint: 'If enabled, generated currency could include platinum. Copper is always included.',
      scope: 'world',
      config: true,
      default: true,
      type: Boolean,
    });
  }
}
