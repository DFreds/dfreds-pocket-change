import { NpcSheetCurrency } from "../npc-sheet-currency.ts";
import { Listener } from "./index.ts";

const RenderNpcSheet: Listener = {
    listen(): void {
        Hooks.on(
            "renderActorSheet5eNPC",
            async (app: any, html: JQuery, data: any) => {
                const supportedTemplates = [
                    "systems/dnd5e/templates/actors/npc-sheet.hbs",
                    "modules/tidy5e-sheet/templates/actors/tidy5e-npc.html",
                ];

                if (!supportedTemplates.includes(app.template)) return;

                const npcSheetCurrency = new NpcSheetCurrency({
                    app,
                    html,
                    data,
                });
                await npcSheetCurrency.injectCurrencyRow();
            },
        );
    },
};

export { RenderNpcSheet };
