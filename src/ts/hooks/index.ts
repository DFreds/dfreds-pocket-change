import { ActorSheetHeader } from "./actor-sheet-header.ts";
import { CreateToken } from "./create-token.ts";
import { HotReload } from "./hot-reload.ts";
import { Init } from "./init.ts";
import { Setup } from "./setup.ts";

interface Listener {
    listen(): void;
}

const HooksModule: Listener = {
    listen(): void {
        const listeners: Listener[] = [HotReload, Init, Setup, CreateToken, ActorSheetHeader];

        for (const listener of listeners) {
            listener.listen();
        }
    },
};

export { HooksModule };
export type { Listener };
