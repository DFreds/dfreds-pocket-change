import { getDnd5eSystemData } from "./dnd5e-data.ts";
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

        if (actor.type !== "npc") {
            log("Refuse to generate treasure for non-npc actors");
            return false;
        }

        if (!this.#isMatchingType(actor)) {
            log("Refuse to generate treasure for non-matching type");
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

    #isMatchingType(actor: Actor): boolean {
        const creatureTypes = this.#settings.creatureTypes;

        // Handle blank creature types by always saying they are valid
        if (creatureTypes.length === 0) return true;

        const typeData = getDnd5eSystemData(actor).details?.type;

        let actorType = typeData?.value?.toLowerCase().trim();
        const actorSubtype = typeData?.subtype?.toLowerCase().trim();

        if (actorType === "custom") {
            actorType = typeData?.custom?.toLowerCase().trim();
        }

        return creatureTypes.some((type) => actorType?.startsWith(type) || actorSubtype?.startsWith(type));
    }
}

export { Validator };
