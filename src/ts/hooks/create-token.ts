import { PocketChange } from "../pocket-change.ts";
import { Listener } from "./index.ts";

const CreateToken: Listener = {
    listen(): void {
        Hooks.on("createToken", (tokenDocument: TokenDocument) => {
            const pocketChange = new PocketChange();
            pocketChange.populateTreasureForToken(tokenDocument);
        });
    },
};

export { CreateToken };
