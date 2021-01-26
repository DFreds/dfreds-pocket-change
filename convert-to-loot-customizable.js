function convertSelectedTokensToLoot() {
  new Dialog({
    title: 'Loot Converter',
    content: `Convert all selected tokens to loot?`,
    buttons: {
      no: {
        icon: '<i class="fas fa-ban"></i>',
        label: 'Cancel',
      },
      yes: {
        icon: '<i class="fas fa-thumbs-up"></i>',
        label: 'Convert',
        callback: (html) => {
          if (canvas.tokens.controlled.length == 0) {
            ui.notifications.error(
              'Tokens must be selected to convert to loot'
            );
            return;
          }

          const filtered = canvas.tokens.controlled.filter((token) => {
            if (token.actor.hasPlayerOwner) {
              ui.notifications.warn(
                `Cannot modify player owned token ${token.name}`
              );
              return false;
            }

            if (token.actor.data.token.actorLink) {
              ui.notifications.warn(`Cannot modify linked token ${token.name}`);
              return false;
            }

            if (token.actor.data.type != 'npc') {
              ui.notifications.warn(
                `Cannot modify non-NPC token ${token.name}`
              );
              return false;
            }

            return true;
          });
          filtered.forEach(async (token) => {
            // Remove natural weapons, natural armor, class features, spells, and feats.
            let newItems = token.actor.data.items.filter((item) => {
              if (item.type == 'weapon') {
                return item.data.weaponType != 'natural';
              }
              if (item.type == 'equipment') {
                if (!item.data.armor) return true;
                return item.data.armor.type != 'natural';
              }
              return !['class', 'spell', 'feat'].includes(item.type);
            });

            let newCurrencyData = {};

            // Handles if they already have currency set somehow
            if (typeof token.actor.data.data.currency.cp === 'number') {
              newCurrencyData['data.currency'] = {
                cp: { value: token.actor.data.data.currency.cp },
                ep: { value: token.actor.data.data.currency.ep },
                gp: { value: token.actor.data.data.currency.gp },
                pp: { value: token.actor.data.data.currency.pp },
                sp: { value: token.actor.data.data.currency.sp },
              };
            }

            await token.actor.update(newCurrencyData);
            await token.actor.setFlag(
              'core',
              'sheetClass',
              'dnd5e.LootSheet5eNPC'
            );
            await token.update({
              'actorData.permission.default': ENTITY_PERMISSIONS.OBSERVER,
              overlayEffect: `icons/svg/chest.svg`,
              // effects: ['icons/containers/bags/pouch-simple-brown.webp'],
            });
            await token.actor.update({ items: newItems });
          });
          ui.notifications.info(`Converted ${filtered.length} tokens to loot`);
        },
      },
    },
    default: 'no',
  }).render(true);
}

convertSelectedTokensToLoot();