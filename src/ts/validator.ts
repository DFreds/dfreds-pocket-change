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

        if (this.#isPercentageLower()) {
            log("Refuse to generate treasure because it did not pass the percent threshold");
            return false;
        }

        if (tokenDocument.isLinked) {
            log("Refuse to generate treasure for linked characters");
            return false;
        }

        if (!this.#isMatchingActorType(actor)) {
            log("Refuse to generate treasure for non-matching actor type");
            return false;
        }

        if (!this.#isMatchingCreatureType(actor)) {
            log("Refuse to generate treasure for non-matching creature type");
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

    #isPercentageLower(): boolean {
        return Math.random() < this.#settings.chanceOfNoCurrency;
    }

    #isMatchingActorType(actor: Actor): boolean {
        const actorTypes = this.#settings.treasureTable.actorTypes;

        // Handle no configured actor types by always saying they are valid
        if (actorTypes.length === 0) return true;

        return actorTypes.includes(actor.type);
    }

    #isMatchingCreatureType(actor: Actor): boolean {
        const creatureTypes = this.#settings.creatureTypes;

        // Handle blank creature types by always saying they are valid
        if (creatureTypes.length === 0) return true;

        const typePaths = this.#settings.treasureTable.typePaths;

        // With nowhere to read a creature type from, nothing can be excluded
        if (typePaths.length === 0) return true;

        const actorValues = typePaths
            .map((path) => foundry.utils.getProperty(actor, path))
            .filter((value): value is string => typeof value === "string")
            .map((value) => value.toLowerCase().trim())
            .filter((value) => value);

        return creatureTypes.some((type) => actorValues.some((value) => value.startsWith(type)));
    }
}

export { Validator };
