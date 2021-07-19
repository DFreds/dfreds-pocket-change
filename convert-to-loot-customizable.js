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
            let newItems = token.actor.data.items
              .filter((item) => {
                if (item.type == 'weapon') {
                  return item.data.weaponType != 'natural';
                }
                if (item.type == 'equipment') {
                  if (!item.data.armor) return true;
                  return item.data.armor.type != 'natural';
                }
                return !['class', 'spell', 'feat'].includes(item.type);
              })
              .filter((item) => {
                // Determine if item is damaged
                const chanceOfDamagedItems = game.settings.get(
                  'dfreds-pocket-change',
                  'chanceOfDamagedItems'
                );
                const removeDamagedItems = game.settings.get(
                  'dfreds-pocket-change',
                  'removeDamagedItems'
                );
                const damagedItemsMultiplier = game.settings.get(
                  'dfreds-pocket-change',
                  'damagedItemsMultiplier'
                );

                if (
                  (item.data.rarity === 'Common' ||
                    item.data.rarity === 'None') &&
                  Math.random() < chanceOfDamagedItems
                ) {
                  if (removeDamagedItems) return false;

                  item.name += ' (Damaged)';
                  item.data.price *= damagedItemsMultiplier;
                }

                return true;
              })
              .map((item) => {
                item.data.equipped = false;
                return item;
              });

            await token.actor.update({ items: [] });
            await token.actor.update({ items: newItems });

            let newActorData = {
              flags: {
                core: {
                  sheetClass: 'dnd5e.LootSheet5eNPC',
                },
                lootsheetnpc5e: {
                  lootsheettype: 'Loot',
                },
              },
            };

            // Handles if they already have currency set somehow
            if (typeof token.actor.data.data.currency.cp === 'number') {
              let oldCurrencyData = token.actor.data.data.currency;
              newActorData['data.currency'] = {
                cp: { value: oldCurrencyData.cp },
                ep: { value: oldCurrencyData.ep },
                gp: { value: oldCurrencyData.gp },
                pp: { value: oldCurrencyData.pp },
                sp: { value: oldCurrencyData.sp },
              };
            }
            await token.actor.update(newActorData);

            if (game.modules.get('combat-utility-belt')?.active) {
              await game.cub.removeAllConditions(token);
            }

            let lootingUsers = game.users.entries.filter((user) => {
              return (
                user.role == USER_ROLES.PLAYER ||
                user.role == USER_ROLES.TRUSTED
              );
            });
            let permissions = {};
            Object.assign(permissions, token.actor.data.permission);
            lootingUsers.forEach((user) => {
              permissions[user.data._id] = ENTITY_PERMISSIONS.OBSERVER;
            });

            await token.update({
              overlayEffect: 'icons/svg/chest.svg',
              // effects: ['icons/containers/bags/pouch-simple-brown.webp'],
              actorData: {
                actor: {
                  flags: {
                    loot: {
                      playersPermission: ENTITY_PERMISSIONS.OBSERVER,
                    },
                  },
                },
                permission: permissions,
              },
            });
          });
          ui.notifications.info(`Converted ${filtered.length} tokens to loot`);
        },
      },
    },
    default: 'no',
  }).render(true);
}

convertSelectedTokensToLoot();
