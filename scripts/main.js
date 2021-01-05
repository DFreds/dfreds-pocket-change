import IndividualTreasures from './individual-treasures.js';

Hooks.once('init', () => {
  game.settings.register('dfreds-individual-treasures', 'enabled', {
    name: 'Enabled',
    hint: 'If enabled, currency will be generated for tokens dropped in scenes.',
    scope: 'world',
    config: true,
    default: true,
    type: Boolean,
  });
  game.settings.register('dfreds-individual-treasures', 'humanoidsOnly', {
    name: 'Humanoids only',
    hint: "If enabled, currency will only be generated for NPCs that have a type of 'Humanoid'.",
    scope: 'world',
    config: true,
    default: true,
    type: Boolean,
  });
});

Hooks.on('preCreateToken', (scene, data, options, userId) => {
  const actor = game.actors.get(data.actorId);
  const individualTreasures = new IndividualTreasures();

  individualTreasures.populateTreasureForActor(data, actor);
});
