import IndividualTreasures from './individual-treasures.js';

Hooks.once('init', () => {
  game.settings.register('dfreds-individual-treasures', 'enabled', {
    name: 'Enabled',
    hint:
      'If enabled, currency will be generated for tokens dropped in scenes.',
    scope: 'world',
    config: true,
    default: true,
    type: Boolean,
  });

  game.settings.register('dfreds-individual-treasures', 'humanoidsOnly', {
    name: 'Humanoids only',
    hint:
      "If enabled, currency will only be generated for NPCs that have a type of 'Humanoid'.",
    scope: 'world',
    config: true,
    default: true,
    type: Boolean,
  });

  game.settings.register('dfreds-individual-treasures', 'chanceOfNoCurrency', {
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

  game.settings.register(
    'dfreds-individual-treasures',
    'replaceElectrumWithSilver',
    {
      name: 'Replace electrum with silver',
      hint:
        'If enabled, all electrum pieces will be replaced with silver pieces.',
      scope: 'world',
      config: true,
      default: false,
      type: Boolean,
    }
  );
});

Hooks.on('preCreateToken', (scene, data, options, userId) => {
  const actor = game.actors.get(data.actorId);
  const individualTreasures = new IndividualTreasures();

  individualTreasures.populateTreasureForActor(data, actor);
});
