import { getDnd5eSystemData } from "./dnd5e-data.ts";
import { Settings } from "./settings.ts";

interface StandardCurrency {
    cp: number;
    sp: number;
    ep: number;
    gp: number;
    pp: number;
}

/**
 * Tracks currency amounts for an actor and handles conversions between
 * denominations
 */
class Currency {
    #settings: Settings;

    #cp: number;
    #sp: number;
    #ep: number;
    #gp: number;
    #pp: number;

    /**
     * Creates a new currency class
     *
     * @param actor - The actor used to initialize the currency
     */
    constructor(actor: Actor) {
        this.#settings = new Settings();

        const currency = getDnd5eSystemData(actor).currency;
        this.#cp = currency?.cp ?? 0;
        this.#sp = currency?.sp ?? 0;
        this.#ep = currency?.ep ?? 0;
        this.#gp = currency?.gp ?? 0;
        this.#pp = currency?.pp ?? 0;
    }

    /**
     * Adds copper to the currency object
     *
     * @param amount - The amount of copper to add
     */
    addCopper(amount: number): void {
        this.#cp += Math.floor(amount * this.#settings.currencyMultiplier);
    }

    /**
     * Adds silver to the currency object
     *
     * @param amount - The amount of silver to add
     */
    addSilver(amount: number): void {
        this.#sp += Math.floor(amount * this.#settings.currencyMultiplier);
    }

    /**
     * Adds electrum to the currency object
     *
     * @param amount - The amount of electrum to add
     */
    addElectrum(amount: number): void {
        this.#ep += Math.floor(amount * this.#settings.currencyMultiplier);
    }

    /**
     * Adds gold to the currency object
     *
     * @param amount - The amount of gold to add
     */
    addGold(amount: number): void {
        this.#gp += Math.floor(amount * this.#settings.currencyMultiplier);
    }

    /**
     * Adds platinum to the currency object
     *
     * @param amount - The amount of platinum to add
     */
    addPlatinum(amount: number): void {
        this.#pp += Math.floor(amount * this.#settings.currencyMultiplier);
    }

    /**
     * Converts currencies down a type if they are not enabled in the settings.
     *
     * Example: Platinum converts to gold converts to electrum if both platinum
     * and gold are disabled.
     */
    convertCurrencies(): void {
        if (!this.#settings.usePlatinum) {
            this.#convertPlatinumToGold();
        }

        if (!this.#settings.useGold) {
            this.#convertGoldToElectrum();
        }

        if (!this.#settings.useElectrum) {
            this.#convertElectrumToSilver();
        }

        if (!this.#settings.useSilver) {
            this.#convertSilverToCopper();
        }
    }

    #convertPlatinumToGold(): void {
        this.#gp += this.#pp * 10;
        this.#pp = 0;
    }

    #convertGoldToElectrum(): void {
        this.#ep += this.#gp * 2;
        this.#gp = 0;
    }

    #convertElectrumToSilver(): void {
        this.#sp += this.#ep * 5;
        this.#ep = 0;
    }

    #convertSilverToCopper(): void {
        this.#cp += this.#sp * 10;
        this.#sp = 0;
    }

    /**
     * Converts the currency data to the standard format for an Actor sheet
     *
     * @returns An object containing the currencies
     */
    convertToStandardCurrency(): StandardCurrency {
        return {
            cp: this.#cp,
            sp: this.#sp,
            ep: this.#ep,
            gp: this.#gp,
            pp: this.#pp,
        };
    }
}

export { Currency };
export type { StandardCurrency };
