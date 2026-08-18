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
        if (!tokenDocument.actor) return false;

        if (!this.#settings.enabled) {
            log("Refuse to generate treasure because you don't want me to");
            return false;
        }

        if (this.#isPercentageLower()) {
            log(
                "Refuse to generate treasure because it did not pass the percent threshold",
            );
            return false;
        }

        if (this.#isLootSheetNpc5e(tokenDocument)) {
            log("Refuse to generate treasure for existing loot sheets");
            return false;
        }

        if (tokenDocument.isLinked) {
            log("Refuse to generate treasure for linked characters");
            return false;
        }

        if (!this.#isActorNpc(tokenDocument)) {
            log("Refuse to generate treasure for non-npc actors");
            return false;
        }

        if (!this.#isMatchingType(tokenDocument)) {
            log("Refuse to generate treasure for non-matching type");
            return false;
        }

        if (tokenDocument.actor.hasPlayerOwner) {
            log("Refuse to generate treasure for player owned actors");
            return false;
        }

        if (!this.#isGm()) {
            log("Refuse to generate treasure on the behest of mere players");
            return false;
        }

        return true;
    }

    #isPercentageLower(): boolean {
        return Math.random() < this.#settings.chanceOfNoCurrency;
    }

    #isLootSheetNpc5e(tokenDocument: TokenDocument): boolean {
        return tokenDocument.actor.sheet.template.includes("lootsheetnpc5e");
    }

    #isActorNpc(tokenDocument: TokenDocument): boolean {
        return tokenDocument.actor.type === "npc";
    }

    #isMatchingType(tokenDocument: TokenDocument): boolean {
        const actor = tokenDocument.actor;

        const creatureTypes = this.#settings.creatureTypes;

        // Handle blank creature types by always saying they are valid
        if (creatureTypes.length === 0) return true;

        let actorType = this.#getActorType(actor);
        const actorSubtype = this.#getActorSubtype(actor);

        if (actorType === "custom") {
            actorType = actor.system.details?.type?.custom
                ?.toLowerCase()
                .trim();
        }

        return creatureTypes.some(
            (type) =>
                actorType?.startsWith(type) || actorSubtype?.startsWith(type),
        );
    }

    #getActorType(actor: Actor): string | undefined {
        return actor.system.details?.type?.value?.toLowerCase().trim();
    }

    #getActorSubtype(actor: Actor): string | undefined {
        return actor.system.details?.type?.subtype?.toLowerCase().trim();
    }

    #isGm(): boolean {
        return game.user.isGM;
    }
}

export { Validator };
