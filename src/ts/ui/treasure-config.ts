import type { ApplicationClosingOptions, ApplicationConfiguration } from "@client/applications/_module.mjs";
import type { HandlebarsRenderOptions } from "@client/applications/api/_module.mjs";
import { MODULE_ID } from "../constants.ts";
import { Settings } from "../settings.ts";
import { bindPathInput } from "./path-autocomplete.ts";
import {
    ActorFilter,
    CurrencyDefinition,
    FILTER_OPERATORS,
    FilterGroup,
    FilterOperator,
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
            addFilter: TreasureConfig.#onAddFilter,
            deleteFilter: TreasureConfig.#onDeleteFilter,
            resetDefaults: TreasureConfig.#onResetDefaults,
        },
    };

    static override PARTS = {
        tabs: { template: "templates/generic/tab-navigation.hbs" },
        configuration: {
            id: "configuration",
            template: `modules/${MODULE_ID}/templates/treasure-config-configuration.hbs`,
            scrollable: [".treasure-scroll"],
        },
        filters: {
            id: "filters",
            template: `modules/${MODULE_ID}/templates/treasure-config-filters.hbs`,
            scrollable: [".treasure-scroll"],
        },
        tables: {
            id: "tables",
            template: `modules/${MODULE_ID}/templates/treasure-config-tables.hbs`,
            scrollable: [".treasure-scroll"],
        },
        footer: { template: "templates/generic/form-footer.hbs" },
    };

    static override TABS = {
        sheet: {
            tabs: [
                {
                    id: "configuration",
                    icon: "fa-solid fa-gears",
                    label: "PocketChange.TreasureConfig.ConfigurationTab",
                },
                {
                    id: "filters",
                    icon: "fa-solid fa-filter",
                    label: "PocketChange.TreasureConfig.FiltersTab",
                },
                {
                    id: "tables",
                    icon: "fa-solid fa-table-list",
                    label: "PocketChange.TreasureConfig.RollTablesTab",
                },
            ],
            initial: "configuration",
        },
    };

    protected override _onClose(options: ApplicationClosingOptions): void {
        this.#config = null;
        super._onClose(options);
    }

    protected override async _onRender(context: object, options: HandlebarsRenderOptions): Promise<void> {
        await super._onRender(context, options);

        const pathInputs = this.element.querySelectorAll<HTMLInputElement>(
            'input[name="attributePath"], input[name$=".path"]',
        );

        for (const input of pathInputs) {
            bindPathInput(input);
        }
    }

    protected override async _preparePartContext(
        partId: string,
        context: Record<string, unknown>,
        options: HandlebarsRenderOptions,
    ): Promise<object> {
        await super._preparePartContext(partId, context, options);

        const tabs = context.tabs as Record<string, unknown> | undefined;
        if (tabs && partId in tabs) context.tab = tabs[partId];

        return context;
    }

    protected override async _prepareContext(options: HandlebarsRenderOptions): Promise<object> {
        const context = (await super._prepareContext(options)) as Record<string, unknown>;

        this.#config ??= foundry.utils.deepClone(new Settings().treasureTable);

        return Object.assign(context, {
            attributePath: this.#config.attributePath,
            selectionFormula: this.#config.selectionFormula,
            currencies: this.#config.currencies,
            tiers: this.#config.tiers,
            filters: this.#config.filters,
            operators: Object.fromEntries(
                FILTER_OPERATORS.map((operator) => [
                    operator,
                    game.i18n.localize(`PocketChange.TreasureConfig.Operators.${operator}`),
                ]),
            ),
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

    static async #onAddFilter(this: TreasureConfig, _event: Event, target: HTMLElement): Promise<void> {
        this.#syncFromForm();
        if (!this.#config) return;

        const group = this.#groupOf(target);
        if (!group) return;

        this.#config.filters[group].push({
            path: "",
            operator: "eq",
            value: "",
        });

        await this.render();
    }

    static async #onDeleteFilter(this: TreasureConfig, _event: Event, target: HTMLElement): Promise<void> {
        this.#syncFromForm();
        if (!this.#config) return;

        const group = this.#groupOf(target);
        if (!group) return;

        const index = Number(target.dataset.filterIndex);
        if (Number.isNaN(index)) return;

        this.#config.filters[group].splice(index, 1);

        await this.render();
    }

    #groupOf(target: HTMLElement): FilterGroup | null {
        const group = target.dataset.filterGroup;
        return group === "all" || group === "any" ? group : null;
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

        const filters = (expanded.filters ?? {}) as Record<string, unknown>;
        this.#config.filters = {
            all: this.#toFilters(filters.all),
            any: this.#toFilters(filters.any),
            chanceOfNothing: typeof filters.chanceOfNothing === "number" ? filters.chanceOfNothing : 0,
        };

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

    #toFilters(value: unknown): ActorFilter[] {
        return this.#toArray(value).map((filter): ActorFilter => {
            const data = filter as Record<string, unknown>;
            return {
                path: String(data.path ?? ""),
                operator: String(data.operator ?? "eq") as FilterOperator,
                value: String(data.value ?? ""),
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

        const allFilters = [...config.filters.all, ...config.filters.any];
        if (allFilters.some((filter) => !filter.path.trim())) {
            return game.i18n.localize("PocketChange.TreasureConfig.Errors.FilterBlank");
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
