# DFreds Pocket Change

![Foundry Version](https://img.shields.io/badge/Foundry-v0.7.9-informational)
![Forge Installs](https://img.shields.io/badge/dynamic/json?label=Forge%20Installs&query=package.installs&suffix=%25&url=https://forge-vtt.com/api/bazaar/package/dfreds-pocket-change&colorB=4aa94a)

__DFreds Pocket Change__ is a FoundryVTT module which automatically adds currency to actors based on the [DMG Individual Treasure Tables by Challenge Rating](https://dungeonmastertools.github.io/treasure.html).

## Let Me Sell You This

Have you ever watched as the peaceful NPCs of the town you've lovingly crafted get slaughtered by your players, only for them to ask how much money was in their pockets so they could loot them afterwards? Well, now you can automate that part. The money part. Not the slaughter. That would be weird.

Oh yeah. This module is useless without [Loot Sheet NPC 5e](https://foundryvtt.com/packages/lootsheetnpc5e/) by ChalkOne. So get that bad boy.

## What This Module Does

On the drop of a token onto a scene, Pocket Change generates currency for the token based on its challenge rating using the Individual Treasure Tables by Challenge Rating from the DMG.

You can configure some stuff:

![Module Configuration](https://i.imgur.com/7O8jcFY.png)

### Friggin' Cool Macros

This module also includes sweet macros. Basically, we got three of these bangers that work for selected tokens:

1. __Generate Currency for Selected Tokens__ - Useful for when you want to disable the automatic generation and do it all on demand (you overachiever you). This is the __officially supported__ way to do this, by yours truly.
1. __Convert Selected Tokens to Loot__ - This macro takes each token and changes their actor sheet to LootSheetNPC, deletes all their Feat items, sets token privileges to Observer for players, and add a treasure overlay icon to the bodies. This allows players to steal that sweet cash straight from the dead dude. Careful with this one because it's actually deleting stuff from that instance of the actor (not the prototype). This is the __officially supported__ way to do this, by yours truly.
1. __Generate Currency and Convert to Loot for Selected Tokens__ - Combo of those first two rad mofos.
1. __Generate Currency for Selected Tokens (Customizable)__ - This lets you customize and break the corresponding macro to your hearts content
1. __Convert Selected Tokens to Loot (Customizable)__ - This lets you customize and break the corresponding macro to your hearts content

## When it Generates Currency

It only generates currency if all of the following are true:

* The module is enabled (configurable).
  
  > Sort of the whole point of this thing but hey, now you can temporarily turn it off.

* It passes the configurable percent threshold. This allows currency to be generated for only a certain percentage of actors.

  > Not every random acolyte should have money you know!

* The actor is not a loot sheet provided by Loot Sheet NPC 5e. This avoids any conflicts for loot sheet actors that have manually entered currency.

  >  I wouldn't want to mess up your perfectly balanced loot chests!

* The actor is not a linked actor. This avoids situations with modifying important NPCs data.

  > Now the big bad evil guy won't be randomly receiving cash! I bet he would be less evil if he did, though.

* The actor has a type that matches the configuration provided in the settings.

  > It would be a bit weird if that wolf your players slew had some coins shoved up its nether regions. But hey, maybe that sounds fun, too. Go nuts!

* The actor is an NPC. This avoids messing with any data related to player characters.

  > I'm sure you have cooler ways to mess with player characters anyway.

* The actor does not have a player owner. This avoids situations where we're generating currency for NPCs that players can actively control and drag onto the scenes.

  > We wouldn't that silly sidekick the party controls that you forgot to turn into a linked character for some reason to start having his pockets generate money.

* The user is a GM. The final catch-all to make sure only GMs are generating currency.

  > Take that you pesky players!

## What This Module Doesn't Do

Stops your players from being murder hobos. Also, it doesn't actually provide anyway for you to actually let the players steal that lovable NPC's life savings. That's what [Loot Sheet NPC 5e](https://foundryvtt.com/packages/lootsheetnpc5e/) does for you in conjunction with my included macros.

## Installation

1. Copy this link and paste it in Foundry's Module Manager

    > https://raw.githubusercontent.com/dfreds/dfreds-pocket-change/main/module.json

2. Enable the module in your world's module settings
