import { CurrencyAmount, CurrencyStore } from "./currency-store.ts";
import { error, log } from "./logger.ts";
import { Settings } from "./settings.ts";
import { TreasureTier } from "./treasure-table.ts";
import { Validator } from "./validator.ts";

/** One currency formula that was rolled, and what it came to */
interface CurrencyRoll {
    label: string;
    formula: string;
    total: number;
}

/** Everything one generation produced, so the chat message can report it */
interface GenerationResult {
    store: CurrencyStore;
    selectionFormula: string;
    selectionTotal: number;
    rolls: CurrencyRoll[];
}

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
     * @param options - Options for the generation
     * @param options.replace - If true, the currency the actor already carries
     * is thrown away rather than added to
     */
    async generateCurrencyForActor(actor: Actor, { replace = false } = {}): Promise<void> {
        const result = await this.#generateCurrency(actor, replace);
        if (!result) return;

        await actor.update(result.store.buildUpdate());

        if (this.#settings.showChatMessage) {
            this.#showChatMessage(actor, result);
        }
    }

    async #generateCurrency(actor: Actor, replace: boolean): Promise<GenerationResult | null> {
        const config = this.#settings.treasureTable;

        if (!config.attributePath || config.currencies.length === 0) {
            log("No treasure table is configured for this system");
            return null;
        }

        const tier = this.#findTier(actor, config.attributePath, config.tiers);
        if (!tier) {
            log("No tier matches the actor's attribute value");
            return null;
        }

        const selection = await this.#rollDice(config.selectionFormula);
        if (selection === null) return null;

        const row = tier.rows.find((row) => selection >= row.rangeStart && selection <= row.rangeEnd);
        if (!row) {
            log("No row matches the selection roll");
            return null;
        }

        const store = new CurrencyStore(actor, config, { startFromNothing: replace });
        const rolls: CurrencyRoll[] = [];

        for (const [currencyIndex, formula] of row.formulas.entries()) {
            if (!formula) continue;

            const total = await this.#rollDice(formula);
            if (total === null) return null;

            store.add(currencyIndex, total);
            rolls.push({
                label: config.currencies[currencyIndex]?.label ?? "",
                formula,
                total,
            });
        }

        return {
            store,
            selectionFormula: config.selectionFormula,
            selectionTotal: selection,
            rolls,
        };
    }

    #findTier(actor: Actor, attributePath: string, tiers: TreasureTier[]): TreasureTier | null {
        const value = foundry.utils.getProperty(actor, attributePath);
        if (typeof value !== "number") return null;

        return tiers.find((tier) => value >= tier.min && (tier.max === null || value <= tier.max)) ?? null;
    }

    async #rollDice(formula: string): Promise<number | null> {
        try {
            const roll = await new Roll(formula).evaluate();
            return roll.total;
        } catch (err) {
            const message = game.i18n.localize("PocketChange.TreasureConfig.Errors.InvalidFormula", { formula });
            error(`${message} ${err}`);
            ui.notifications.error(message);
            return null;
        }
    }

    #showChatMessage(actor: Actor, result: GenerationResult): void {
        ChatMessage.create({
            whisper: game.users.filter((user) => user.isGM).map((gm) => gm.id),
            flavor: game.i18n.localize("PocketChange.CurrencyGeneratedFor", {
                name: actor.name,
            }),
            content: this.#rollsToString(result) + this.#currencyToString(result.store.describe()),
        });
    }

    #rollsToString({ selectionFormula, selectionTotal, rolls }: GenerationResult): string {
        const lines = [
            game.i18n.localize("PocketChange.SelectionRollLine", {
                formula: selectionFormula,
                total: selectionTotal,
            }),
            ...rolls.map((roll) =>
                game.i18n.localize("PocketChange.CurrencyRollLine", {
                    label: roll.label,
                    formula: roll.formula,
                    total: roll.total,
                }),
            ),
        ];

        // Nothing was rolled for any currency, so say so rather than showing an
        // empty space under the selection roll
        if (rolls.length === 0) {
            lines.push(game.i18n.localize("PocketChange.NothingRolled"));
        }

        const summary = game.i18n.localize("PocketChange.RollResults");
        const body = lines.map((line) => `<div>${line}</div>`).join("");

        return `<details class="pocket-change-rolls"><summary>${summary}</summary>${body}</details>`;
    }

    #currencyToString(amounts: CurrencyAmount[]): string {
        const headers = amounts.map((amount) => `<th>${amount.label}</th>`).join("");
        const values = amounts.map((amount) => `<td>${amount.amount}</td>`).join("");

        return `<table class="pocket-change-currency"><thead><tr>${headers}</tr></thead><tbody><tr>${values}</tr></tbody></table>`;
    }
}

export { PocketChange };
