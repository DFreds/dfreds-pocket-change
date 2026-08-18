import type { ApplicationClosingOptions, ApplicationConfiguration } from "@client/applications/_module.mjs";
import type { HandlebarsRenderOptions } from "@client/applications/api/_module.mjs";
import { MODULE_ID } from "../constants.ts";
import { Settings } from "../settings.ts";
import {
    CurrencyDefinition,
    getDefaultTreasureTable,
    TreasureRow,
    TreasureTableConfig,
    TreasureTier,
} from "../treasure-table.ts";

const { ApplicationV2, HandlebarsApplicationMixin, DialogV2 } = foundry.applications.api;

/**
 * The settings menu for editing the treasure table
 */
class TreasureConfig extends HandlebarsApplicationMixin(
    ApplicationV2<ApplicationConfiguration, HandlebarsRenderOptions>,
) {
    #config: TreasureTableConfig | null = null;

    static override DEFAULT_OPTIONS: DeepPartial<ApplicationConfiguration> = {
        id: "dfreds-pocket-change-treasure-config",
        tag: "form",
        classes: ["dfreds-pocket-change-treasure-config"],
        window: {
            contentClasses: ["standard-form"],
            icon: "fas fa-coins",
            title: "PocketChange.TreasureConfig.AppName",
            resizable: true,
            minimizable: true,
        },
        position: { width: 780, height: 800 },
        form: {
            handler: TreasureConfig.#onSubmit,
            submitOnChange: false,
            closeOnSubmit: false,
        },
        actions: {
            addCurrency: TreasureConfig.#onAddCurrency,
            deleteCurrency: TreasureConfig.#onDeleteCurrency,
            addTier: TreasureConfig.#onAddTier,
            deleteTier: TreasureConfig.#onDeleteTier,
            addRow: TreasureConfig.#onAddRow,
            deleteRow: TreasureConfig.#onDeleteRow,
            resetDefaults: TreasureConfig.#onResetDefaults,
        },
    };

    static override PARTS = {
        form: {
            id: "form",
            template: `modules/${MODULE_ID}/templates/treasure-config.hbs`,
            scrollable: [".treasure-config-body"],
        },
        footer: { template: "templates/generic/form-footer.hbs" },
    };

    protected override _onClose(options: ApplicationClosingOptions): void {
        this.#config = null;
        super._onClose(options);
    }

    protected override async _prepareContext(options: HandlebarsRenderOptions): Promise<object> {
        const context = (await super._prepareContext(options)) as Record<string, unknown>;

        this.#config ??= foundry.utils.deepClone(new Settings().treasureTable);

        return Object.assign(context, {
            attributePath: this.#config.attributePath,
            selectionFormula: this.#config.selectionFormula,
            currencies: this.#config.currencies,
            tiers: this.#config.tiers,
            buttons: [
                {
                    type: "button",
                    action: "resetDefaults",
                    icon: "fa-solid fa-rotate-left",
                    label: "PocketChange.TreasureConfig.Reset",
                },
                {
                    type: "submit",
                    icon: "fa-solid fa-floppy-disk",
                    label: "SETTINGS.Save",
                },
            ],
        });
    }

    static async #onSubmit(this: TreasureConfig): Promise<void> {
        this.#syncFromForm();
        if (!this.#config) return;

        const error = this.#findValidationError(this.#config);
        if (error) {
            ui.notifications.error(error);
            return;
        }

        await new Settings().setTreasureTable(this.#config);
        ui.notifications.info(game.i18n.localize("PocketChange.TreasureConfig.Saved"));
        await this.close();
    }

    static async #onAddCurrency(this: TreasureConfig): Promise<void> {
        this.#syncFromForm();
        if (!this.#config) return;

        this.#config.currencies.push({ label: "", path: "" });
        for (const tier of this.#config.tiers) {
            for (const row of tier.rows) {
                row.formulas.push("");
            }
        }

        await this.render();
    }

    static async #onDeleteCurrency(this: TreasureConfig, _event: Event, target: HTMLElement): Promise<void> {
        this.#syncFromForm();
        if (!this.#config) return;

        const index = Number(target.dataset.currencyIndex);
        if (Number.isNaN(index)) return;

        this.#config.currencies.splice(index, 1);
        for (const tier of this.#config.tiers) {
            for (const row of tier.rows) {
                row.formulas.splice(index, 1);
            }
        }

        await this.render();
    }

    static async #onAddTier(this: TreasureConfig): Promise<void> {
        this.#syncFromForm();
        if (!this.#config) return;

        this.#config.tiers.push({
            min: 0,
            max: null,
            rows: [],
        });

        await this.render();
    }

    static async #onDeleteTier(this: TreasureConfig, _event: Event, target: HTMLElement): Promise<void> {
        this.#syncFromForm();
        if (!this.#config) return;

        const index = Number(target.dataset.tierIndex);
        if (Number.isNaN(index)) return;

        this.#config.tiers.splice(index, 1);

        await this.render();
    }

    static async #onAddRow(this: TreasureConfig, _event: Event, target: HTMLElement): Promise<void> {
        this.#syncFromForm();
        if (!this.#config) return;

        const tier = this.#config.tiers[Number(target.dataset.tierIndex)];
        if (!tier) return;

        tier.rows.push({
            rangeStart: 1,
            rangeEnd: 100,
            formulas: this.#config.currencies.map(() => ""),
        });

        await this.render();
    }

    static async #onDeleteRow(this: TreasureConfig, _event: Event, target: HTMLElement): Promise<void> {
        this.#syncFromForm();
        if (!this.#config) return;

        const tier = this.#config.tiers[Number(target.dataset.tierIndex)];
        if (!tier) return;

        const rowIndex = Number(target.dataset.rowIndex);
        if (Number.isNaN(rowIndex)) return;

        tier.rows.splice(rowIndex, 1);

        await this.render();
    }

    static async #onResetDefaults(this: TreasureConfig): Promise<void> {
        const confirmed = await DialogV2.confirm({
            window: {
                title: game.i18n.localize("PocketChange.TreasureConfig.ResetTitle"),
            },
            content: `<p>${game.i18n.localize("PocketChange.TreasureConfig.ResetContent")}</p>`,
        });
        if (!confirmed) return;

        this.#config = getDefaultTreasureTable();
        await this.render();
    }

    /**
     * Reads the current form values into the working configuration so that
     * edits survive re-renders when rows are added or removed
     */
    #syncFromForm(): void {
        if (!this.#config || !this.form) return;

        const data = new foundry.applications.ux.FormDataExtended(this.form).object;
        const expanded = foundry.utils.expandObject(data) as Record<string, unknown>;

        this.#config.attributePath = String(expanded.attributePath ?? "");
        this.#config.selectionFormula = String(expanded.selectionFormula ?? "");
        this.#config.currencies = this.#toArray(expanded.currencies).map((currency): CurrencyDefinition => {
            const data = currency as Record<string, unknown>;
            return {
                label: String(data.label ?? ""),
                path: String(data.path ?? ""),
            };
        });
        this.#config.tiers = this.#toArray(expanded.tiers).map((tier): TreasureTier => {
            const data = tier as Record<string, unknown>;
            return {
                min: typeof data.min === "number" ? data.min : 0,
                max: typeof data.max === "number" ? data.max : null,
                rows: this.#toArray(data.rows).map((row): TreasureRow => {
                    const rowData = row as Record<string, unknown>;
                    return {
                        rangeStart: typeof rowData.rangeStart === "number" ? rowData.rangeStart : 1,
                        rangeEnd: typeof rowData.rangeEnd === "number" ? rowData.rangeEnd : 1,
                        formulas: this.#toArray(rowData.formulas).map((formula) => String(formula ?? "")),
                    };
                }),
            };
        });
    }

    /**
     * Converts an object expanded from form data with numeric keys, such as
     * {0: "a", 1: "b"}, into an array ordered by those keys
     */
    #toArray(value: unknown): unknown[] {
        if (!value || typeof value !== "object") return [];

        return Object.entries(value)
            .sort(([a], [b]) => Number(a) - Number(b))
            .map(([, entry]) => entry);
    }

    #findValidationError(config: TreasureTableConfig): string | null {
        if (config.currencies.some((currency) => !currency.label.trim() || !currency.path.trim())) {
            return game.i18n.localize("PocketChange.TreasureConfig.Errors.CurrencyBlank");
        }

        if (!Roll.validate(config.selectionFormula)) {
            return game.i18n.localize("PocketChange.TreasureConfig.Errors.InvalidFormula", {
                formula: config.selectionFormula,
            });
        }

        for (const tier of config.tiers) {
            if (tier.max !== null && tier.min > tier.max) {
                return game.i18n.localize("PocketChange.TreasureConfig.Errors.InvalidTierRange");
            }

            for (const row of tier.rows) {
                if (row.rangeStart > row.rangeEnd) {
                    return game.i18n.localize("PocketChange.TreasureConfig.Errors.InvalidRange");
                }

                for (const formula of row.formulas) {
                    if (formula && !Roll.validate(formula)) {
                        return game.i18n.localize("PocketChange.TreasureConfig.Errors.InvalidFormula", { formula });
                    }
                }
            }
        }

        return null;
    }
}

export { TreasureConfig };
