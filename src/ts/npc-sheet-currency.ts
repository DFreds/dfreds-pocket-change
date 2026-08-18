import { MODULE_ID } from "./constants.ts";
import { PocketChange } from "./pocket-change.ts";
import { Settings } from "./settings.ts";

/**
 * Handles injection of currency rows and actions in NPC sheets
 */
class NpcSheetCurrency {
    #app: any;
    #html: JQuery;
    #data: any;

    #settings: Settings;

    constructor({ app, html, data }: { app: any; html: JQuery; data: any }) {
        this.#app = app;
        this.#html = html;
        this.#data = data;

        this.#settings = new Settings();
    }

    /**
     * Injects the currency row into an NPC sheet
     */
    async injectCurrencyRow(): Promise<void> {
        if (!this.#settings.showCurrencyOnNpcs) return;

        if (this.#isDefaultSheet) {
            await this.#handleDefaultInjection();
        } else if (this.#isTidySheet) {
            await this.#handleTidyInjection();
        }
    }

    get #isDefaultSheet(): boolean {
        return this.#app.template.includes("npc-sheet.hbs");
    }

    get #isTidySheet(): boolean {
        return this.#app.template.includes("tidy5e-npc.html");
    }

    async #handleDefaultInjection(): Promise<void> {
        const content = $(await this.#getDefaultTemplate());

        content
            .find(".rollable[data-action]")
            .on("click", this.#onSheetAction.bind(this));

        const injectionPoint = this.#html.find(
            ".sheet-body .features .inventory-filters",
        );
        injectionPoint.prepend(content);
    }

    async #getDefaultTemplate(): Promise<string> {
        return foundry.applications.handlebars.renderTemplate(
            `modules/${MODULE_ID}/templates/default-npc-currency-row.hbs`,
            {
                data: this.#data.system,
                config: {
                    currencies: {
                        pp: game.i18n.localize("DND5E.CurrencyPP"),
                        gp: game.i18n.localize("DND5E.CurrencyGP"),
                        ep: game.i18n.localize("DND5E.CurrencyEP"),
                        sp: game.i18n.localize("DND5E.CurrencySP"),
                        cp: game.i18n.localize("DND5E.CurrencyCP"),
                    },
                },
            },
        );
    }

    async #handleTidyInjection(): Promise<void> {
        const content = $(await this.#getTidyTemplate());

        content
            .find(".rollable[data-action]")
            .on("click", this.#onSheetAction.bind(this));

        const injectionPoint = this.#html.find(
            ".sheet-body .attributes .center-pane .inventory-currency .currency",
        );
        injectionPoint.append(content);
    }

    async #getTidyTemplate(): Promise<string> {
        return foundry.applications.handlebars.renderTemplate(
            `modules/${MODULE_ID}/templates/tidy-npc-currency-row.hbs`,
            {
                data: this.#data.data,
                config: {},
            },
        );
    }

    async #onSheetAction(event: Event): Promise<void> {
        event.preventDefault();
        const button = event.currentTarget as HTMLElement;
        switch (button.dataset.action) {
            case "convertCurrency":
                await this.#convertCurrency();
                break;
            case "generateCurrency":
                await this.#generateCurrency();
                break;
        }
    }

    async #convertCurrency(): Promise<unknown> {
        return foundry.applications.api.DialogV2.confirm({
            window: { title: game.i18n.localize("DND5E.CurrencyConvert") },
            content: `<p>${game.i18n.localize("DND5E.CurrencyConvertHint")}</p>`,
            yes: {
                callback: () => this.#app.actor.convertCurrency(),
            },
        });
    }

    async #generateCurrency(): Promise<unknown> {
        return foundry.applications.api.DialogV2.confirm({
            window: {
                title: game.i18n.localize("PocketChange.GenerateCurrency"),
            },
            content: `<p>${game.i18n.localize(
                "PocketChange.GenerateCurrencyWarning",
            )}</p>`,
            yes: {
                default: false,
                callback: async () => {
                    const actor = this.#app.actor;
                    const pocketChange = new PocketChange();
                    const currency = pocketChange.generateCurrency(actor);
                    await actor.update({ "system.currency": currency });
                },
            },
        });
    }
}

export { NpcSheetCurrency };
