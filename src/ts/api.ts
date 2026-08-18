import type Module from "@client/packages/module.d.mts";
import { StandardCurrency } from "./currency.ts";

interface ThisModule extends Module {
    api: ThisApi;
}

interface ThisApi {
    /**
     * Generates currency for the provided actor based on its challenge rating
     *
     * @param actor - The actor to base the coin generation off of
     * @returns The generated currency
     */
    generateCurrency(actor: Actor): StandardCurrency;
}

export { type ThisModule, type ThisApi };
