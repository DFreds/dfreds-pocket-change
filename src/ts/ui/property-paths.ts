/**
 * The property paths a document type actually has, for suggesting as the user types.
 *
 * Built by walking data model schemas rather than from a hardcoded list, so it works
 * on any system without knowing anything about it. Systems that still use
 * `template.json` have no schema to walk, hence the fallbacks.
 *
 * Nothing here touches the DOM; `path-autocomplete.ts` is what puts it on screen.
 *
 * Adapted from dfreds-triggers.
 */

/**
 * A schema field as far as this walker cares.
 *
 * Duck-typed rather than checked with `instanceof`, both because the vendored Foundry
 * types do not expose these shapes usefully and because it lets tests hand in plain
 * objects instead of building real DataFields.
 */
interface WalkableField {
    /** Present on SchemaField and its subclasses, including embedded data fields */
    fields?: Record<string, WalkableField>;
    /** Present on array, set and typed object fields */
    element?: WalkableField;
    /**
     * The fixed set of keys a typed object field is created with, when it
     * declares one. Either a list of keys or an object keyed by them.
     */
    initialKeys?: string[] | Record<string, unknown> | null;
}

/** Guards against a schema that refers to itself, and against silly path lengths. */
const MAX_DEPTH = 8;

const cache = new Map<string, string[]>();

function isWalkable(value: unknown): value is WalkableField {
    return typeof value === "object" && value !== null;
}

/** The fixed keys a typed object field declares, if it declares any. */
function declaredKeys(field: WalkableField): string[] {
    const keys = field.initialKeys;
    if (!keys) return [];

    return Array.isArray(keys) ? keys : Object.keys(keys);
}

/**
 * Add every path inside a schema field to `into`.
 *
 * Intermediate nodes are added as well as leaves, so that `system` and
 * `system.attributes` can both be offered while the user is still typing.
 *
 * Array and typed object fields contribute their own path but are not descended
 * into: what is underneath them is addressed by index or by arbitrary key, so
 * `items.element.name` is not a path anybody can usefully type. The exception is
 * a typed object that declares its keys up front, such as a currency mapping,
 * where every key is known and worth offering.
 */
function collectSchemaPaths(field: WalkableField, prefix: string, into: Set<string>, depth = 0): void {
    if (depth > MAX_DEPTH) return;

    // The root the walk started from, so that "system" is offerable on its own and not
    // only its children. Nested calls re-add a path the parent already recorded, which
    // a set makes harmless.
    if (prefix) into.add(prefix);

    for (const key of declaredKeys(field)) {
        const path = prefix ? `${prefix}.${key}` : key;
        into.add(path);

        // Each entry is the element field, so a mapping of objects still offers
        // what is inside one of them
        if (isWalkable(field.element)) collectSchemaPaths(field.element, path, into, depth + 1);
    }

    const fields = field.fields;
    if (!fields) return;

    for (const [name, child] of Object.entries(fields)) {
        const path = prefix ? `${prefix}.${name}` : name;
        into.add(path);

        if (isWalkable(child)) collectSchemaPaths(child, path, into, depth + 1);
    }
}

/**
 * Add the paths implied by a plain data object, for systems with no data model.
 *
 * `flattenObject` only reports leaves, so the intermediate nodes have to be
 * synthesized or half of what the user types would match nothing.
 */
function collectObjectPaths(source: object, prefix: string, into: Set<string>): void {
    const flattened = foundry.utils.flattenObject(source as Record<string, unknown>);

    for (const leaf of Object.keys(flattened)) {
        const path = prefix ? `${prefix}.${leaf}` : leaf;
        into.add(path);

        // "a.b.c" also contributes "a" and "a.b"
        const segments = path.split(".");
        for (let index = 1; index < segments.length; index += 1) {
            into.add(segments.slice(0, index).join("."));
        }
    }
}

/** The embedded collections of a document type, which are not worth descending into. */
function hierarchyFieldNames(documentClass: unknown): string[] {
    const hierarchy = (documentClass as { hierarchy?: Record<string, unknown> } | undefined)?.hierarchy;
    return hierarchy ? Object.keys(hierarchy) : [];
}

function documentClassFor(documentName: string): unknown {
    // Exactly what core's getDocumentClass does, read directly so this needs no
    // import that has to resolve at runtime
    return (CONFIG as unknown as Record<string, { documentClass?: unknown } | undefined>)[documentName]?.documentClass;
}

function typeDataModels(documentName: string): Record<string, unknown> {
    return (
        (CONFIG as unknown as Record<string, { dataModels?: Record<string, unknown> } | undefined>)[documentName]
            ?.dataModels ?? {}
    );
}

/** The `template.json` defaults for a document type, for systems with no data models. */
function legacyModel(documentName: string): Record<string, object> {
    return ((game as unknown as { model?: Record<string, Record<string, object>> }).model?.[documentName] ??
        {}) as Record<string, object>;
}

function subtypesFor(documentName: string, subtype?: string): string[] {
    if (subtype) return [subtype];

    const declared = new Set([...Object.keys(typeDataModels(documentName)), ...Object.keys(legacyModel(documentName))]);
    return [...declared];
}

/**
 * Every property path worth suggesting for a document type.
 *
 * Pass a subtype to narrow the `system` half to that subtype, or leave it out to
 * offer the union of all of them, which is what you want before the user has
 * committed to one.
 *
 * Built on first use and cached, because `CONFIG` data models are not fully
 * populated until systems finish initialising, and walking every subtype of every
 * document type is not free.
 */
function findPropertyPaths(documentName: string, subtype?: string): string[] {
    const key = `${documentName}:${subtype ?? "*"}`;
    const cached = cache.get(key);
    if (cached) return cached;

    const paths = new Set<string>();
    const documentClass = documentClassFor(documentName);

    // The document's own fields, minus its embedded collections
    const schema = (documentClass as { schema?: WalkableField } | undefined)?.schema;
    if (isWalkable(schema)) {
        const skip = new Set(hierarchyFieldNames(documentClass));
        const top: WalkableField = {
            fields: Object.fromEntries(Object.entries(schema.fields ?? {}).filter(([name]) => !skip.has(name))),
        };
        collectSchemaPaths(top, "", paths);
    }

    for (const type of subtypesFor(documentName, subtype)) {
        // A data model roots its own paths at "system" already, but this walker
        // builds paths itself rather than reading fieldPath, so the root is explicit
        const model = typeDataModels(documentName)[type] as { schema?: WalkableField } | undefined;
        if (isWalkable(model?.schema)) collectSchemaPaths(model.schema, "system", paths);

        // Systems that never moved off template.json have no schema to walk
        const legacy = legacyModel(documentName)[type];
        if (legacy && typeof legacy === "object") collectObjectPaths(legacy, "system", paths);
    }

    const sorted = [...paths].sort();
    cache.set(key, sorted);

    return sorted;
}

/** Every path cut down to `depth` segments, with the duplicates that creates removed. */
function segmentsAt(paths: string[], token: string, depth: number): string[] {
    const seen = new Set<string>();

    for (const path of paths) {
        if (!path.startsWith(token)) continue;

        const segments = path.split(".");
        if (segments.length < depth) continue;

        seen.add(segments.slice(0, depth).join("."));
    }

    return [...seen];
}

/**
 * The paths exactly one segment deeper than what has been typed so far.
 *
 * A segment at a time is what keeps a list short and complete at once. Offered the
 * whole flat list instead, one deep branch fills the menu before the other roots are
 * reached, which is no use to somebody working out what a document even has.
 */
function nextSegments(paths: string[], token: string): string[] {
    const depth = token ? token.split(".").length : 1;
    const narrowed = segmentsAt(paths, token, depth);

    // A complete path that has children, e.g. "system", leaves nothing at this depth
    const chosen = narrowed.length === 1 && narrowed[0] === token ? segmentsAt(paths, token, depth + 1) : narrowed;

    return chosen.filter((path) => path !== token);
}

/**
 * Whether a path is one this document type is known to have.
 *
 * Only ever used to warn, never to block: a path can legitimately point at derived
 * data that no schema declares, and being wrong about that should not stop somebody
 * saving their treasure table.
 */
function isKnownPropertyPath(documentName: string, path: string, subtype?: string): boolean {
    if (!path) return true;

    const known = findPropertyPaths(documentName, subtype);

    // Nothing to compare against, so nothing to complain about
    if (known.length === 0) return true;

    return known.includes(path);
}

/** Discard the cache. Used by tests, and after a system finishes loading. */
function clearPropertyPathCache(): void {
    cache.clear();
}

export { clearPropertyPathCache, findPropertyPaths, isKnownPropertyPath, nextSegments };
