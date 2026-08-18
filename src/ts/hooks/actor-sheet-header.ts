import type { ApplicationHeaderControlsEntry } from "@client/applications/_types.mjs";
import { PocketChange } from "../pocket-change.ts";
import { Settings } from "../settings.ts";
import { Listener } from "./index.ts";

const { DialogV2 } = foundry.applications.api;

/**
 * Adds a control to the actor sheet header that rolls the treasure table again
 * for that actor.
 *
 * The hook name walks the inheritance chain, so this covers every sheet built
 * on ActorSheetV2 whatever the system.
 */
const ActorSheetHeader: Listener = {
    listen(): void {
        Hooks.on(
            "getHeaderControlsActorSheetV2" as any,
            (app: { document: Actor }, controls: ApplicationHeaderControlsEntry[]) => {
                if (!game.user.isGM) return;

                const config = new Settings().treasureTable;
                if (!config.attributePath || config.currencies.length === 0) return;

                controls.push({
                    action: "pocketChangeGenerateCurrency",
                    icon: "fa-solid fa-coins",
                    label: "PocketChange.GenerateCurrency",
                    onClick: () => {
                        void generateForActor(app.document);
                    },
                });
            },
        );
    },
};

async function generateForActor(actor: Actor): Promise<void> {
    const confirmed = await DialogV2.confirm({
        window: { title: game.i18n.localize("PocketChange.GenerateCurrency") },
        content: `<p>${game.i18n.localize("PocketChange.GenerateCurrencyWarning", {
            name: actor.name,
        })}</p>`,
    });
    if (!confirmed) return;

    await new PocketChange().generateCurrencyForActor(actor, { replace: true });

    ui.notifications.info(game.i18n.localize("PocketChange.CurrencyGeneratedFor", { name: actor.name }));
}

export { ActorSheetHeader };
