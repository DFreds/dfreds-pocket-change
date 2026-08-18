import { PocketChange } from "../pocket-change.ts";
import { Listener } from "./index.ts";

const CreateToken: Listener = {
    listen(): void {
        Hooks.on("createToken" as any, async (tokenDocument: TokenDocument) => {
            const pocketChange = new PocketChange();
            await pocketChange.populateTreasureForToken(tokenDocument);
        });
    },
};

export { CreateToken };
