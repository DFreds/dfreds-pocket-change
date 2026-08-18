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
