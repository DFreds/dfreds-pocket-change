import { CurrencyAmount, CurrencyStore } from "./currency-store.ts";
import log from "./logger.ts";
import { Settings } from "./settings.ts";
import { TreasureRow, TreasureTier } from "./treasure-table.ts";
import { Validator } from "./validator.ts";

/**
 * Handles generating currency for actors using the configured treasure table
 */
class PocketChange {
    #settings: Settings;
    #validator: Validator;

    constructor() {
        this.#settings = new Settings();
        this.#validator = new Validator();
    }

    /**
     * Takes the provided token and adds currency to it if it is valid
     *
     * @param tokenDocument - The token document for the dropped actor
     */
    async populateTreasureForToken(tokenDocument: TokenDocument): Promise<void> {
        const actor = tokenDocument.actor;
        if (!actor) return;

        if (!this.#validator.shouldAutoGenerateCurrency(tokenDocument)) return;

        log("Generating treasure");

        await this.generateCurrencyForActor(actor);
    }

    /**
     * Generates currency for the provided actor using the configured treasure
     * table and applies it to the actor
     *
     * @param actor - The actor to generate currency for
     */
    async generateCurrencyForActor(actor: Actor): Promise<void> {
        const store = await this.#generateCurrency(actor);
        if (!store) return;

        await actor.update(store.buildUpdate());

        if (this.#settings.showChatMessage) {
            this.#showChatMessage(actor, store.describe());
        }
    }

    async #generateCurrency(actor: Actor): Promise<CurrencyStore | null> {
        const config = this.#settings.treasureTable;

        if (!config.attributePath || config.currencies.length === 0) {
            log("No treasure table is configured for this system");
            return null;
        }

        const tier = this.#findTier(actor, config.attributePath);
        if (!tier) {
            log("No tier matches the actor's attribute value");
            return null;
        }

        const row = await this.#pickRow(tier, config.selectionFormula);
        if (!row) {
            log("No row matches the selection roll");
            return null;
        }

        const store = new CurrencyStore(actor, config);
        for (const [currencyIndex, formula] of row.formulas.entries()) {
            if (!formula) continue;
            store.add(currencyIndex, await this.#rollDice(formula));
        }

        store.convertDisabledDenominations();

        return store;
    }

    #findTier(actor: Actor, attributePath: string): TreasureTier | null {
        const rawValue = foundry.utils.getProperty(actor, attributePath);
        const value = typeof rawValue === "number" ? rawValue : 0;

        return (
            this.#settings.treasureTable.tiers.find(
                (tier) => value >= tier.min && (tier.max === null || value <= tier.max),
            ) ?? null
        );
    }

    async #pickRow(tier: TreasureTier, selectionFormula: string): Promise<TreasureRow | null> {
        const roll = await this.#rollDice(selectionFormula);

        return tier.rows.find((row) => roll >= row.rangeStart && roll <= row.rangeEnd) ?? null;
    }

    async #rollDice(formula: string): Promise<number> {
        const roll = await new Roll(formula).evaluate();
        return roll.total;
    }

    #showChatMessage(actor: Actor, amounts: CurrencyAmount[]): void {
        ChatMessage.create({
            whisper: game.users.filter((user) => user.isGM).map((gm) => gm.id),
            flavor: game.i18n.localize("PocketChange.CurrencyGeneratedFor", {
                name: actor.name,
            }),
            content: this.#currencyToString(amounts),
        });
    }

    #currencyToString(amounts: CurrencyAmount[]): string {
        const headers = amounts.map((amount) => `<th>${amount.label}</th>`).join("");
        const values = amounts.map((amount) => `<td>${amount.amount}</td>`).join("");

        return `<table class="pocket-change-currency"><thead><tr>${headers}</tr></thead><tbody><tr>${values}</tr></tbody></table>`;
    }
}

export { PocketChange };
