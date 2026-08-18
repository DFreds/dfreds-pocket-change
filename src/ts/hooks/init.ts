import { ThisModule } from "../api.ts";
import { MODULE_ID } from "../constants.ts";
import { HandlebarHelpers } from "../handlebar-helpers.ts";
import { PocketChange } from "../pocket-change.ts";
import { Settings } from "../settings.ts";
import { Listener } from "./index.ts";

const Init: Listener = {
    listen(): void {
        Hooks.once("init", () => {
            new Settings().register();
            new HandlebarHelpers().register();

            (game.modules.get(MODULE_ID) as ThisModule).api = {
                generateCurrency(actor: Actor) {
                    return new PocketChange().generateCurrency(actor);
                },
            };
        });
    },
};

export { Init };
