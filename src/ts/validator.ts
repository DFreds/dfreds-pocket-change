import { passesFilters } from "./filters.ts";
import log from "./logger.ts";
import { Settings } from "./settings.ts";

/**
 * Ensures a token is a valid candidate for generating currency
 */
class Validator {
    #settings: Settings;

    constructor() {
        this.#settings = new Settings();
    }

    /**
     * Checks if the provided token can have currency generated for it.
     *
     * @param tokenDocument - the token to check
     * @returns true if it can have currency generated for it
     */
    shouldAutoGenerateCurrency(tokenDocument: TokenDocument): boolean {
        const actor = tokenDocument.actor;
        if (!actor) return false;

        if (!this.#settings.enabled) {
            log("Refuse to generate treasure because you don't want me to");
            return false;
        }

        const filters = this.#settings.treasureTable.filters;

        if (Math.random() * 100 < filters.chanceOfNothing) {
            log("Refuse to generate treasure because it did not pass the percent threshold");
            return false;
        }

        if (tokenDocument.isLinked) {
            log("Refuse to generate treasure for linked characters");
            return false;
        }

        if (!passesFilters(filters, actor)) {
            log("Refuse to generate treasure for an actor that does not pass the filters");
            return false;
        }

        if (actor.hasPlayerOwner) {
            log("Refuse to generate treasure for player owned actors");
            return false;
        }

        if (!game.user.isGM) {
            log("Refuse to generate treasure on the behest of mere players");
            return false;
        }

        return true;
    }
}

export { Validator };
