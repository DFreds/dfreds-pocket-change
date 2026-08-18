import type Module from "@client/packages/module.d.mts";

interface ThisModule extends Module {
    api: ThisApi;
}

interface ThisApi {
    /**
     * Generates currency for the provided actor using the configured treasure
     * table and applies it to the actor
     *
     * @param actor - The actor to generate currency for
     * @returns A promise that resolves when the currency has been applied
     */
    generateCurrencyForActor(actor: Actor): Promise<void>;
}

export { type ThisModule, type ThisApi };
