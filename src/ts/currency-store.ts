import { Settings } from "./settings.ts";
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
    #settings: Settings;
    #config: TreasureTableConfig;
    #amounts: number[];

    constructor(actor: Actor, config: TreasureTableConfig) {
        this.#settings = new Settings();
        this.#config = config;
        this.#amounts = config.currencies.map((currency) => {
            const value = foundry.utils.getProperty(actor, currency.path);
            return typeof value === "number" ? value : 0;
        });
    }

    /**
     * Adds an amount of the currency at the given index, multiplied by the
     * currency multiplier setting
     *
     * @param currencyIndex - The index of the currency in the configuration
     * @param amount - The amount to add before the multiplier is applied
     */
    add(currencyIndex: number, amount: number): void {
        if (currencyIndex < 0 || currencyIndex >= this.#amounts.length) return;

        this.#amounts[currencyIndex] += Math.floor(amount * this.#settings.currencyMultiplier);
    }

    /**
     * Converts currencies down a denomination if they are not enabled in the
     * settings. This only applies to the standard dnd5e denominations.
     *
     * Example: Platinum converts to gold, which converts to electrum, if both
     * platinum and gold are disabled.
     */
    convertDisabledDenominations(): void {
        if (!this.#settings.usePlatinum) {
            this.#convertDown("pp", "gp", 10);
        }

        if (!this.#settings.useGold) {
            this.#convertDown("gp", "ep", 2);
        }

        if (!this.#settings.useElectrum) {
            this.#convertDown("ep", "sp", 5);
        }

        if (!this.#settings.useSilver) {
            this.#convertDown("sp", "cp", 10);
        }
    }

    #convertDown(fromKey: string, toKey: string, rate: number): void {
        const fromIndex = this.#findDenomination(fromKey);
        const toIndex = this.#findDenomination(toKey);
        if (fromIndex === -1 || toIndex === -1) return;

        this.#amounts[toIndex] += this.#amounts[fromIndex] * rate;
        this.#amounts[fromIndex] = 0;
    }

    #findDenomination(key: string): number {
        return this.#config.currencies.findIndex((currency) => currency.path.endsWith(`.${key}`));
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
