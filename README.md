# DFreds Pocket Change

[![Become a patron](https://github.com/codebard/patron-button-and-widgets-by-codebard/blob/master/images/become_a_patron_button.png?raw=true)](https://www.patreon.com/dfreds) 
<a href="https://www.buymeacoffee.com/dfreds" target="_blank"><img src="https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png" alt="Buy Me A Coffee" style="height: 41px !important;width: 174px !important;box-shadow: 0px 3px 2px 0px rgba(190, 190, 190, 0.5) !important;-webkit-box-shadow: 0px 3px 2px 0px rgba(190, 190, 190, 0.5) !important;" ></a>

![Foundry Version](https://img.shields.io/badge/Foundry-v11-informational)
![Forge Installs](https://img.shields.io/badge/dynamic/json?label=Forge%20Installs&query=package.installs&suffix=%25&url=https://forge-vtt.com/api/bazaar/package/dfreds-pocket-change&colorB=4aa94a)
![Latest Release Download Count](https://img.shields.io/github/downloads/dfreds/dfreds-pocket-change/latest/dfreds-pocket-change.zip)
![All Downloads](https://img.shields.io/github/downloads/dfreds/dfreds-pocket-change/total)

__DFreds Pocket Change__ is a FoundryVTT module which automatically adds currency to actors based on the DMG Individual Treasure Tables by Challenge Rating.

## Let Me Sell You This

Have you ever watched as the peaceful NPCs of the town you've lovingly crafted get slaughtered by your players, only for them to ask how much money was in their pockets so they could loot them afterwards? Well, now you can automate that part. The money part. Not the slaughter. That would be weird.

Oh yeah. This module is useless without [Loot Sheet NPC 5e](https://foundryvtt.com/packages/lootsheetnpc5e/) by ChalkOne. So get that bad boy.

## What This Module Does

On the drop of a token onto a scene, Pocket Change generates currency for the token based on its challenge rating.

Pocket Change also adds a currency row onto the NPC sheet. From there, you can do the following:

- Convert All Currency: Changes all coins to the highest possible denomination (like in the PC sheet)
- Generate Currency: This replaces all their currency with new values. These values will be kept for all linked tokens and potentially overridden for non-linked tokens (see When it Automatically Generates Currency).
- Convert to Lootable - This changes the actor sheet to a LootSheet5eNPC, deletes all the Feat and Spell items, applies damage to the rest of the items based on your settings, sets token privileges to Observer for players, and add a treasure overlay icon to the bodies. This allows players to steal that sweet cash and loot straight from the dead dude. Note that this only works on NPC actor sheets for tokens on the canvas.

See here:

![Currency row](docs/currency-row.png)

You can configure some stuff:

![Module Configuration](docs/settings.png)

## When it Automatically Generates Currency

It only generates currency if all of the following are true:

- The module is enabled (configurable).
  
  > Sort of the whole point of this thing but hey, now you can temporarily turn it off.

- It passes the configurable percent threshold. This allows currency to be generated for only a certain percentage of actors.

  > Not every random acolyte should have money you know!

- The actor is not a loot sheet provided by Loot Sheet NPC 5e. This avoids any conflicts for loot sheet actors that have manually entered currency.

  >  I wouldn't want to mess up your perfectly balanced loot chests!

- The actor is not a linked actor. This avoids situations with modifying important NPCs data.

  > Now the big bad evil guy won't be randomly receiving cash! I bet he would be less evil if he did, though.

- The actor is an NPC. This avoids messing with any data related to player characters.

  > I'm sure you have cooler ways to mess with player characters anyway.

- The actor has a type that matches the configuration provided in the settings.

  > It would be a bit weird if that wolf your players slew had some coins shoved up its nether regions. But hey, maybe that sounds fun, too. Go nuts!

- The actor does not have a player owner. This avoids situations where we're generating currency for NPCs that players can actively control and drag onto the scenes.

  > We wouldn't that silly sidekick the party controls that you forgot to turn into a linked character for some reason to start having his pockets generate money.

- The user is a GM. The final catch-all to make sure only GMs are generating currency.

  > Take that you pesky players!

## What This Module Doesn't Do

Stops your players from being murder hobos. Also, it doesn't actually provide anyway for you to actually let the players steal that lovable NPC's life savings. That's what [Loot Sheet NPC 5e](https://foundryvtt.com/packages/lootsheetnpc5e/) or [Item Piles](https://foundryvtt.com/packages/item-piles) does for you.