import { CreateToken } from "./create-token.ts";
import { Init } from "./init.ts";
import { RenderNpcSheet } from "./render-npc-sheet.ts";
import { Setup } from "./setup.ts";

interface Listener {
    listen(): void;
}

const HooksModule: Listener = {
    listen(): void {
        const listeners: Listener[] = [Init, Setup, CreateToken, RenderNpcSheet];

        for (const listener of listeners) {
            listener.listen();
        }
    },
};

export { HooksModule };
export type { Listener };
