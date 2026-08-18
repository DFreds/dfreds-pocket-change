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
     * @param options - Options for the generation
     * @param options.replace - If true, the currency the actor already carries
     * is thrown away rather than added to
     * @returns A promise that resolves when the currency has been applied
     */
    generateCurrencyForActor(actor: Actor, options?: { replace?: boolean }): Promise<void>;
}

export { type ThisModule, type ThisApi };
