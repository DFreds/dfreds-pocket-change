import { TreasureTableConfig } from "./treasure-table.ts";

interface CurrencyAmount {
    label: string;
    amount: number;
}

/**
 * Tracks currency totals for an actor while treasure is generated.
 *
 * Totals start at the actor's current amounts, so generated treasure is added
 * on top of what the actor already carries. Starting from nothing instead
 * throws those amounts away, which is what regenerating from a sheet does.
 */
class CurrencyStore {
    #config: TreasureTableConfig;
    #amounts: number[];

    constructor(actor: Actor, config: TreasureTableConfig, { startFromNothing = false } = {}) {
        this.#config = config;
        this.#amounts = config.currencies.map((currency) => {
            if (startFromNothing) return 0;

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
     * @returns The current total for each currency with its label
     */
    describe(): CurrencyAmount[] {
        return this.#config.currencies.map((currency, index) => {
            return { label: currency.label, amount: this.#amounts[index] };
        });
    }
}

export { CurrencyStore };
export type { CurrencyAmount };
