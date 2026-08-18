import { MODULE_ID } from "./constants.ts";

/**
 * Handles registration and access of settings
 */
class Settings {
    // Settings keys
    #ENABLED = "enabled";
    #SHOW_CHAT_MESSAGE = "showChatMessage";
    #CREATURE_TYPES = "creatureTypes";
    #CHANCE_OF_NO_CURRENCY = "chanceOfNoCurrency";
    #CURRENCY_MULTIPLIER = "currencyMultiplier";
    #USE_SILVER = "useSilver";
    #USE_ELECTRUM = "useElectrum";
    #USE_GOLD = "useGold";
    #USE_PLATINUM = "usePlatinum";

    /**
     * Register all the settings for the module
     */
    register(): void {
        game.settings.register(MODULE_ID, this.#ENABLED, {
            name: "PocketChange.Settings.Enabled.Name",
            hint: "PocketChange.Settings.Enabled.Hint",
            scope: "world",
            config: true,
            default: true,
            type: Boolean,
        });

        game.settings.register(MODULE_ID, this.#SHOW_CHAT_MESSAGE, {
            name: "PocketChange.Settings.ShowChatMessage.Name",
            hint: "PocketChange.Settings.ShowChatMessage.Hint",
            scope: "world",
            config: true,
            default: false,
            type: Boolean,
        });

        game.settings.register(MODULE_ID, this.#CREATURE_TYPES, {
            name: "PocketChange.Settings.CreatureTypes.Name",
            hint: "PocketChange.Settings.CreatureTypes.Hint",
            scope: "world",
            config: true,
            default: "Humanoid",
            type: String,
        });

        game.settings.register(MODULE_ID, this.#CHANCE_OF_NO_CURRENCY, {
            name: "PocketChange.Settings.ChanceOfNoCurrency.Name",
            hint: "PocketChange.Settings.ChanceOfNoCurrency.Hint",
            scope: "world",
            config: true,
            default: 0.25,
            type: new foundry.data.fields.NumberField({
                required: true,
                nullable: false,
                min: 0,
                max: 1,
                step: 0.05,
                initial: 0.25,
            }),
        });

        game.settings.register(MODULE_ID, this.#CURRENCY_MULTIPLIER, {
            name: "PocketChange.Settings.CurrencyMultiplier.Name",
            hint: "PocketChange.Settings.CurrencyMultiplier.Hint",
            scope: "world",
            config: true,
            default: 1,
            type: new foundry.data.fields.NumberField({
                required: true,
                nullable: false,
                min: 0,
                max: 2,
                step: 0.1,
                initial: 1,
            }),
        });

        game.settings.register(MODULE_ID, this.#USE_SILVER, {
            name: "PocketChange.Settings.UseSilver.Name",
            hint: "PocketChange.Settings.UseSilver.Hint",
            scope: "world",
            config: true,
            default: true,
            type: Boolean,
        });

        game.settings.register(MODULE_ID, this.#USE_ELECTRUM, {
            name: "PocketChange.Settings.UseElectrum.Name",
            hint: "PocketChange.Settings.UseElectrum.Hint",
            scope: "world",
            config: true,
            default: true,
            type: Boolean,
        });

        game.settings.register(MODULE_ID, this.#USE_GOLD, {
            name: "PocketChange.Settings.UseGold.Name",
            hint: "PocketChange.Settings.UseGold.Hint",
            scope: "world",
            config: true,
            default: true,
            type: Boolean,
        });

        game.settings.register(MODULE_ID, this.#USE_PLATINUM, {
            name: "PocketChange.Settings.UsePlatinum.Name",
            hint: "PocketChange.Settings.UsePlatinum.Hint",
            scope: "world",
            config: true,
            default: true,
            type: Boolean,
        });
    }

    /**
     * Returns true if currency should be generated on token drop
     */
    get enabled(): boolean {
        return game.settings.get(MODULE_ID, this.#ENABLED) as unknown as boolean;
    }

    /**
     * Returns true if a chat message should be displayed for dropped tokens
     */
    get showChatMessage(): boolean {
        return game.settings.get(MODULE_ID, this.#SHOW_CHAT_MESSAGE) as unknown as boolean;
    }

    /**
     * Returns the list of creature types that can have currency generated
     */
    get creatureTypes(): string[] {
        const types = game.settings.get(MODULE_ID, this.#CREATURE_TYPES) as unknown as string;

        return types
            .split(";")
            .map((type) => type.toLowerCase().trim())
            .filter((type) => type);
    }

    /**
     * Returns a number between 0 and 1, representing the percent chance that
     * currency will not be generated
     */
    get chanceOfNoCurrency(): number {
        return game.settings.get(MODULE_ID, this.#CHANCE_OF_NO_CURRENCY) as unknown as number;
    }

    /**
     * Returns the amount to multiply generated currency by
     */
    get currencyMultiplier(): number {
        return game.settings.get(MODULE_ID, this.#CURRENCY_MULTIPLIER) as unknown as number;
    }

    /**
     * Returns true if silver can be used
     */
    get useSilver(): boolean {
        return game.settings.get(MODULE_ID, this.#USE_SILVER) as unknown as boolean;
    }

    /**
     * Returns true if electrum can be used
     */
    get useElectrum(): boolean {
        return game.settings.get(MODULE_ID, this.#USE_ELECTRUM) as unknown as boolean;
    }

    /**
     * Returns true if gold can be used
     */
    get useGold(): boolean {
        return game.settings.get(MODULE_ID, this.#USE_GOLD) as unknown as boolean;
    }

    /**
     * Returns true if platinum can be used
     */
    get usePlatinum(): boolean {
        return game.settings.get(MODULE_ID, this.#USE_PLATINUM) as unknown as boolean;
    }
}

export { Settings };
