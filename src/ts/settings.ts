import { MODULE_ID } from "./constants.ts";
import { getDefaultTreasureTable, normalizeTreasureTable, TreasureTableConfig } from "./treasure-table.ts";
import { TreasureConfig } from "./ui/treasure-config.ts";

/**
 * Handles registration and access of settings
 */
class Settings {
    // Settings keys
    #ENABLED = "enabled";
    #SHOW_CHAT_MESSAGE = "showChatMessage";
    #CREATURE_TYPES = "creatureTypes";
    #CHANCE_OF_NO_CURRENCY = "chanceOfNoCurrency";
    #TREASURE_TABLE = "treasureTable";

    // Menu keys
    #TREASURE_MENU = "treasureMenu";

    /**
     * Register all the settings for the module
     */
    register(): void {
        this.#registerMenus();
        this.#registerConfigSettings();
        this.#registerNonConfigSettings();
    }

    #registerMenus(): void {
        game.settings.registerMenu(MODULE_ID, this.#TREASURE_MENU, {
            name: "PocketChange.Settings.TreasureMenu.Name",
            label: "PocketChange.Settings.TreasureMenu.Label",
            hint: "PocketChange.Settings.TreasureMenu.Hint",
            icon: "fas fa-coins",
            type: TreasureConfig as any,
            restricted: true,
        });
    }

    #registerConfigSettings(): void {
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
    }

    #registerNonConfigSettings(): void {
        game.settings.register(MODULE_ID, this.#TREASURE_TABLE, {
            name: "Treasure Table",
            scope: "world",
            config: false,
            default: getDefaultTreasureTable(),
            type: Object,
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
     * Returns the configured treasure table
     */
    get treasureTable(): TreasureTableConfig {
        return normalizeTreasureTable(game.settings.get(MODULE_ID, this.#TREASURE_TABLE));
    }

    /**
     * Saves the treasure table configuration
     *
     * @param config - The treasure table configuration to save
     */
    async setTreasureTable(config: TreasureTableConfig): Promise<unknown> {
        return game.settings.set(MODULE_ID, this.#TREASURE_TABLE, config);
    }
}

export { Settings };
