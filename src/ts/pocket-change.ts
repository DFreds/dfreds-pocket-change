import { Currency, StandardCurrency } from "./currency.ts";
import { getDnd5eSystemData } from "./dnd5e-data.ts";
import log from "./logger.ts";
import { Settings } from "./settings.ts";
import { Validator } from "./validator.ts";

/**
 * Handles generating currency for tokens
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

        const currency = this.generateCurrency(actor);
        await actor.update({ "system.currency": currency });
    }

    /**
     * Generates currency for the provided actor based on its challenge rating
     *
     * @param actor - The actor to base the coin generation off of
     * @returns The generated currency
     */
    generateCurrency(actor: Actor): StandardCurrency {
        let currency: Currency;

        if (this.#isWithinChallengeRating(actor, 0, 4)) {
            currency = this.#treasureForChallengeRating0to4(actor);
        } else if (this.#isWithinChallengeRating(actor, 5, 10)) {
            currency = this.#treasureForChallengeRating5to10(actor);
        } else if (this.#isWithinChallengeRating(actor, 11, 16)) {
            currency = this.#treasureForChallengeRating11to16(actor);
        } else {
            currency = this.#treasureForChallengeRating17andUp(actor);
        }

        currency.convertCurrencies();

        const converted = currency.convertToStandardCurrency();
        if (this.#settings.showChatMessage) {
            this.#showChatMessage(actor, converted);
        }

        return converted;
    }

    #isWithinChallengeRating(actor: Actor, lowerCr: number, upperCr: number): boolean {
        const cr = getDnd5eSystemData(actor).details?.cr ?? 0;
        return cr >= lowerCr && cr <= upperCr;
    }

    #treasureForChallengeRating0to4(actor: Actor): Currency {
        const currency = new Currency(actor);
        const roll = this.#rollDice("1d100");

        if (roll >= 1 && roll <= 30) {
            currency.addCopper(this.#rollDice("5d6"));
        } else if (roll >= 31 && roll <= 60) {
            currency.addSilver(this.#rollDice("4d6"));
        } else if (roll >= 61 && roll <= 70) {
            currency.addElectrum(this.#rollDice("3d6"));
        } else if (roll >= 71 && roll <= 95) {
            currency.addGold(this.#rollDice("3d6"));
        } else {
            currency.addPlatinum(this.#rollDice("1d6"));
        }

        return currency;
    }

    #treasureForChallengeRating5to10(actor: Actor): Currency {
        const currency = new Currency(actor);
        const roll = this.#rollDice("1d100");

        if (roll >= 1 && roll <= 30) {
            currency.addCopper(this.#rollDice("4d6*100"));
            currency.addElectrum(this.#rollDice("1d6*10"));
        } else if (roll >= 31 && roll <= 60) {
            currency.addSilver(this.#rollDice("6d6*10"));
            currency.addGold(this.#rollDice("2d6*10"));
        } else if (roll >= 61 && roll <= 70) {
            currency.addElectrum(this.#rollDice("3d6*10"));
            currency.addGold(this.#rollDice("2d6*10"));
        } else if (roll >= 71 && roll <= 95) {
            currency.addGold(this.#rollDice("4d6*10"));
        } else {
            currency.addGold(this.#rollDice("2d6*10"));
            currency.addPlatinum(this.#rollDice("3d6"));
        }

        return currency;
    }

    #treasureForChallengeRating11to16(actor: Actor): Currency {
        const currency = new Currency(actor);
        const roll = this.#rollDice("1d100");

        if (roll >= 1 && roll <= 20) {
            currency.addSilver(this.#rollDice("4d6*100"));
            currency.addGold(this.#rollDice("1d6*100"));
        } else if (roll >= 21 && roll <= 35) {
            currency.addElectrum(this.#rollDice("1d6*100"));
            currency.addGold(this.#rollDice("1d6*100"));
        } else if (roll >= 36 && roll <= 75) {
            currency.addGold(this.#rollDice("2d6*100"));
            currency.addPlatinum(this.#rollDice("1d6*10"));
        } else {
            currency.addGold(this.#rollDice("2d6*100"));
            currency.addPlatinum(this.#rollDice("2d6*10"));
        }

        return currency;
    }

    #treasureForChallengeRating17andUp(actor: Actor): Currency {
        const currency = new Currency(actor);
        const roll = this.#rollDice("1d100");

        if (roll >= 1 && roll <= 15) {
            currency.addElectrum(this.#rollDice("2d6*1000"));
            currency.addGold(this.#rollDice("8d6*100"));
        } else if (roll >= 16 && roll <= 55) {
            currency.addGold(this.#rollDice("1d6*1000"));
            currency.addPlatinum(this.#rollDice("1d6*100"));
        } else {
            currency.addGold(this.#rollDice("1d6*1000"));
            currency.addPlatinum(this.#rollDice("2d6*100"));
        }

        return currency;
    }

    #rollDice(formula: string): number {
        const roll = new Roll(formula).evaluateSync();
        return roll.total;
    }

    #showChatMessage(actor: Actor, currency: StandardCurrency): void {
        ChatMessage.create({
            whisper: game.users.filter((user) => user.isGM).map((gm) => gm.id),
            flavor: game.i18n.localize("PocketChange.CurrencyGeneratedFor", {
                name: actor.name,
            }),
            content: this.#currencyToString(currency),
        });
    }

    #currencyToString(currency: StandardCurrency): string {
        return `
        <table>
          <tr>
            <th>PP</th>
            <th>GP</th>
            <th>EP</th>
            <th>SP</th>
            <th>CP</th>
          </tr>
          <tr>
            <td>${currency.pp}</td>
            <td>${currency.gp}</td>
            <td>${currency.ep}</td>
            <td>${currency.sp}</td>
            <td>${currency.cp}</td>
        </table>
        `;
    }
}

export { PocketChange };
