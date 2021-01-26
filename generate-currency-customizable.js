function generateCurrencyForSelectedTokens() {
  new Dialog({
    title: 'Currency Generator',
    content: `Generate currency for all selected tokens?`,
    buttons: {
      no: {
        icon: '<i class="fas fa-ban"></i>',
        label: 'Cancel',
      },
      yes: {
        icon: '<i class="fas fa-thumbs-up"></i>',
        label: 'Generate',
        callback: (html) => {
          if (canvas.tokens.controlled.length == 0) {
            ui.notifications.error(
              'Tokens must be selected to generate currency'
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
            const actor = game.actors.get(token.data.actorId);

            const pocketChange = new game.dfreds.PocketChange();
            const currency = pocketChange.generateCurrency(actor);
            let newCurrencyData = {};
            newCurrencyData['data.currency'] = currency;

            await token.actor.update(newCurrencyData);
          });
          ui.notifications.info(
            `Generated currency for ${filtered.length} tokens`
          );
        },
      },
    },
    default: 'no',
  }).render(true);
}

generateCurrencyForSelectedTokens();