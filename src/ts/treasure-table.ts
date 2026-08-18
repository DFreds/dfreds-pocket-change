/**
 * A currency that generated treasure can be added to
 */
interface CurrencyDefinition {
    /** The name shown in the configuration menu and chat messages */
    label: string;
    /** The actor attribute path the currency is stored at */
    path: string;
}

/**
 * A single row in a tier. When the selection roll lands within the row's
 * range, the row's formulas determine how much of each currency is created.
 */
interface TreasureRow {
    /** The lowest selection roll total that picks this row */
    rangeStart: number;
    /** The highest selection roll total that picks this row */
    rangeEnd: number;
    /**
     * The roll formulas that determine how much of each currency is created,
     * in the same order as the configured currencies. An empty formula creates
     * none of that currency.
     */
    formulas: string[];
}

/**
 * A group of treasure rows that applies to actors whose attribute value falls
 * between min and max
 */
interface TreasureTier {
    /** The lowest attribute value this tier applies to */
    min: number;
    /** The highest attribute value this tier applies to, or null for no limit */
    max: number | null;
    rows: TreasureRow[];
}

/**
 * The full configuration for generating treasure
 */
interface TreasureTableConfig {
    /** The actor attribute path used to pick a tier, such as the challenge rating */
    attributePath: string;
    /** The roll made to pick a row within a tier */
    selectionFormula: string;
    /** The actor types that can receive currency. Empty allows every type */
    actorTypes: string[];
    /**
     * The actor attribute paths checked against the creature types setting.
     * Empty skips the creature type check entirely
     */
    typePaths: string[];
    currencies: CurrencyDefinition[];
    tiers: TreasureTier[];
}

/**
 * Fills in any fields missing from a stored treasure table, such as one saved
 * by an older version of the module
 *
 * @param stored - The stored treasure table value
 * @returns A treasure table with every field present
 */
function normalizeTreasureTable(stored: unknown): TreasureTableConfig {
    const raw = (stored ?? {}) as Partial<TreasureTableConfig>;

    return {
        attributePath: raw.attributePath ?? "",
        selectionFormula: raw.selectionFormula ?? "1d100",
        actorTypes: raw.actorTypes ?? [],
        typePaths: raw.typePaths ?? [],
        currencies: raw.currencies ?? [],
        tiers: raw.tiers ?? [],
    };
}

/**
 * Builds the default treasure table for the active game system.
 *
 * The dnd5e default recreates the DMG Individual Treasure tables by Challenge
 * Rating. Other systems start empty and must be configured by the user.
 *
 * @returns The default treasure table configuration
 */
function getDefaultTreasureTable(): TreasureTableConfig {
    if (game.system.id === "dnd5e") {
        return getDnd5eTreasureTable();
    }

    return {
        attributePath: "",
        selectionFormula: "1d100",
        actorTypes: [],
        typePaths: [],
        currencies: [],
        tiers: [],
    };
}

function getDnd5eTreasureTable(): TreasureTableConfig {
    // Formula order matches the currencies order: cp, sp, ep, gp, pp
    return {
        attributePath: "system.details.cr",
        selectionFormula: "1d100",
        actorTypes: ["npc"],
        typePaths: ["system.details.type.value", "system.details.type.subtype", "system.details.type.custom"],
        currencies: [
            { label: "CP", path: "system.currency.cp" },
            { label: "SP", path: "system.currency.sp" },
            { label: "EP", path: "system.currency.ep" },
            { label: "GP", path: "system.currency.gp" },
            { label: "PP", path: "system.currency.pp" },
        ],
        tiers: [
            {
                min: 0,
                max: 4,
                rows: [
                    row(1, 30, { cp: "5d6" }),
                    row(31, 60, { sp: "4d6" }),
                    row(61, 70, { ep: "3d6" }),
                    row(71, 95, { gp: "3d6" }),
                    row(96, 100, { pp: "1d6" }),
                ],
            },
            {
                min: 5,
                max: 10,
                rows: [
                    row(1, 30, { cp: "4d6*100", ep: "1d6*10" }),
                    row(31, 60, { sp: "6d6*10", gp: "2d6*10" }),
                    row(61, 70, { ep: "3d6*10", gp: "2d6*10" }),
                    row(71, 95, { gp: "4d6*10" }),
                    row(96, 100, { gp: "2d6*10", pp: "3d6" }),
                ],
            },
            {
                min: 11,
                max: 16,
                rows: [
                    row(1, 20, { sp: "4d6*100", gp: "1d6*100" }),
                    row(21, 35, { ep: "1d6*100", gp: "1d6*100" }),
                    row(36, 75, { gp: "2d6*100", pp: "1d6*10" }),
                    row(76, 100, { gp: "2d6*100", pp: "2d6*10" }),
                ],
            },
            {
                min: 17,
                max: null,
                rows: [
                    row(1, 15, { ep: "2d6*1000", gp: "8d6*100" }),
                    row(16, 55, { gp: "1d6*1000", pp: "1d6*100" }),
                    row(56, 100, { gp: "1d6*1000", pp: "2d6*100" }),
                ],
            },
        ],
    };
}

function row(
    rangeStart: number,
    rangeEnd: number,
    formulas: Partial<Record<"cp" | "sp" | "ep" | "gp" | "pp", string>>,
): TreasureRow {
    return {
        rangeStart,
        rangeEnd,
        formulas: [formulas.cp ?? "", formulas.sp ?? "", formulas.ep ?? "", formulas.gp ?? "", formulas.pp ?? ""],
    };
}

export { getDefaultTreasureTable, normalizeTreasureTable };
export type { CurrencyDefinition, TreasureRow, TreasureTier, TreasureTableConfig };
