import PocketChange from './pocket-change.js';

Hooks.once('init', () => {
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
      "These are the types of creatures that will generate currency, separated via semi-colons. Leave it blank to generate currency for all types of creatures. Example: Humanoid;Gnome;Elf",
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

  game.settings.register('dfreds-pocket-change', 'currencyStandard', {
    name: 'Currency standard',
    hint:
      'This controls what type of currency is generated. ' +
      "'Normal' generates all types of currency. " + 
      "'Silver standard' replaces all platinum, gold, electrum, and copper with silver, with copper leftovers remaining copper. " + 
      "'No electrum' replaces all electrum pieces with silver.",
    scope: 'world',
    config: true,
    default: 'normal',
    choices: {
      normal: 'Normal',
      silverStandard: 'Silver standard',
      noElectrum: 'No electrum',
    },
    type: String,
  });
});

Hooks.on('preCreateToken', (scene, data, options, userId) => {
  const actor = game.actors.get(data.actorId);
  const pocketChange = new PocketChange();

  pocketChange.populateTreasureForActor(data, actor);
});
