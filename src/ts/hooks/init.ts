import { ThisModule } from "../api.ts";
import { MODULE_ID } from "../constants.ts";
import { PocketChange } from "../pocket-change.ts";
import { Settings } from "../settings.ts";
import { Listener } from "./index.ts";

const Init: Listener = {
    listen(): void {
        Hooks.once("init", () => {
            new Settings().register();

            (game.modules.get(MODULE_ID) as ThisModule).api = {
                generateCurrencyForActor(actor: Actor, options?: { replace?: boolean }) {
                    return new PocketChange().generateCurrencyForActor(actor, options);
                },
            };
        });
    },
};

export { Init };
