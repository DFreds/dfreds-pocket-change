import { TreasureTableConfig } from "./treasure-table.ts";

/**
 * A currency total after generation, used for chat messages
 */
interface CurrencyAmount {
    label: string;
    amount: number;
}

/**
 * Tracks currency totals for an actor while treasure is generated.
 *
 * Totals start at the actor's current amounts so that generated treasure is
 * added on top of what the actor already carries.
 */
class CurrencyStore {
    #config: TreasureTableConfig;
    #amounts: number[];

    constructor(actor: Actor, config: TreasureTableConfig) {
        this.#config = config;
        this.#amounts = config.currencies.map((currency) => {
            const value = foundry.utils.getProperty(actor, currency.path);
            return typeof value === "number" ? value : 0;
        });
    }

    /**
     * Adds an amount of the currency at the given index
     *
     * @param currencyIndex - The index of the currency in the configuration
     * @param amount - The amount to add
     */
    add(currencyIndex: number, amount: number): void {
        if (currencyIndex < 0 || currencyIndex >= this.#amounts.length) return;

        this.#amounts[currencyIndex] += Math.floor(amount);
    }

    /**
     * Builds the actor update data for the current totals
     *
     * @returns An object mapping each currency path to its new total
     */
    buildUpdate(): Record<string, number> {
        const update: Record<string, number> = {};
        this.#config.currencies.forEach((currency, index) => {
            update[currency.path] = this.#amounts[index];
        });
        return update;
    }

    /**
     * Returns the current total for each currency with its label
     */
    describe(): CurrencyAmount[] {
        return this.#config.currencies.map((currency, index) => {
            return { label: currency.label, amount: this.#amounts[index] };
        });
    }
}

export { CurrencyStore };
export type { CurrencyAmount };
