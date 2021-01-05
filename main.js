import IndividualTreasures from './individual-treasures.js';

Hooks.once('init', () => {
  game.settings.register('dfreds-individual-treasures', 'humanoidsOnly', {
    name: 'Humanoids only',
    hint: 'Only generate treasure for humanoid creatures',
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
