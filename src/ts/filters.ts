import { ActorFilter, FilterConfig } from "./treasure-table.ts";

/**
 * Evaluates the configured filters against an actor.
 *
 * Every filter reads a value straight off one actor, so there is nothing to
 * compare against a previous state.
 */

function toNumber(value: unknown): number | undefined {
    if (typeof value === "number") return Number.isNaN(value) ? undefined : value;
    if (typeof value === "boolean") return value ? 1 : 0;
    if (typeof value === "string" && value.trim() !== "") {
        const parsed = Number(value);
        return Number.isNaN(parsed) ? undefined : parsed;
    }
    return undefined;
}

function resolveExpectedValue(raw: string): unknown {
    const trimmed = raw.trim();
    if (trimmed === "") return "";

    const asNumber = toNumber(trimmed);
    if (asNumber !== undefined) return asNumber;

    if (trimmed === "true") return true;
    if (trimmed === "false") return false;
    if (trimmed === "null") return null;

    return trimmed;
}

function compareEquality(current: unknown, expected: unknown): boolean {
    const currentNumber = toNumber(current);
    const expectedNumber = toNumber(expected);
    if (currentNumber !== undefined && expectedNumber !== undefined) {
        return currentNumber === expectedNumber;
    }

    return String(current ?? "").toLowerCase() === String(expected ?? "").toLowerCase();
}

function compareNumeric(current: unknown, expected: unknown, comparator: (a: number, b: number) => boolean): boolean {
    const currentNumber = toNumber(current);
    const expectedNumber = toNumber(expected);
    if (currentNumber === undefined || expectedNumber === undefined) return false;

    return comparator(currentNumber, expectedNumber);
}

function compareContains(current: unknown, expected: unknown): boolean {
    if (Array.isArray(current)) return current.some((entry) => compareEquality(entry, expected));
    if (current instanceof Set) return [...current].some((entry) => compareEquality(entry, expected));

    return String(current ?? "")
        .toLowerCase()
        .includes(String(expected ?? "").toLowerCase());
}

function compareStartsWith(current: unknown, expected: unknown): boolean {
    return String(current ?? "")
        .toLowerCase()
        .startsWith(String(expected ?? "").toLowerCase());
}

function compareMatches(current: unknown, expected: unknown): boolean {
    try {
        return new RegExp(String(expected ?? ""), "i").test(String(current ?? ""));
    } catch {
        return false;
    }
}

function evaluateFilter(filter: ActorFilter, actor: Actor): boolean {
    // A filter with no path is one that has not been filled in yet
    if (!filter.path) return true;

    const current = foundry.utils.getProperty(actor, filter.path);

    if (filter.operator === "exists") {
        return current !== undefined && current !== null;
    }

    const expected = resolveExpectedValue(filter.value);

    switch (filter.operator) {
        case "eq":
            return compareEquality(current, expected);
        case "ne":
            return !compareEquality(current, expected);
        case "lt":
            return compareNumeric(current, expected, (a, b) => a < b);
        case "lte":
            return compareNumeric(current, expected, (a, b) => a <= b);
        case "gt":
            return compareNumeric(current, expected, (a, b) => a > b);
        case "gte":
            return compareNumeric(current, expected, (a, b) => a >= b);
        case "contains":
            return compareContains(current, expected);
        case "startsWith":
            return compareStartsWith(current, expected);
        case "matches":
            return compareMatches(current, expected);
    }
}

/**
 * Checks whether an actor passes the configured filters.
 *
 * Everything in the `all` group has to match, and then at least one thing in
 * the `any` group. An empty group checks nothing, so a table with only `all`
 * filters behaves as though the `any` group were not there.
 *
 * @param config - The filter configuration to evaluate
 * @param actor - The actor to check
 * @returns true if the actor passes
 */
function passesFilters(config: FilterConfig, actor: Actor): boolean {
    const passesAll = config.all.every((filter) => evaluateFilter(filter, actor));
    if (!passesAll) return false;

    if (config.any.length === 0) return true;

    return config.any.some((filter) => evaluateFilter(filter, actor));
}

export { passesFilters };
