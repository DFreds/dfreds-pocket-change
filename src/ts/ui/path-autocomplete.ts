import { findPropertyPaths, isKnownPropertyPath, nextSegments } from "./property-paths.ts";

/**
 * Suggestions and gentle validation for the inputs where a user types an actor
 * attribute path.
 *
 * The dropdown itself is core's, `foundry.applications.ux.Autocomplete`, which
 * brings its own styling, positioning and keyboard handling -- the arrow keys,
 * Enter, Tab and Escape are wired globally by core at startup, so none of that
 * is repeated here.
 *
 * Every path here names a property of an Actor.
 */

/** A ceiling against an unusually wide schema, not a display limit. The menu scrolls. */
const SUGGESTION_LIMIT = 50;

/** Marks the menu as ours, so the stylesheet can make it scroll. */
const MENU_CLASS = "dfreds-pocket-change-paths";

const TOKEN_PATTERN = /[\w.-]*$/;

/** The same characters running forwards, for the part of a path past the caret. */
const TOKEN_TAIL_PATTERN = /^[\w.-]*/;

interface AutocompleteEntry {
    identifier: string;
    label: string;
}

/**
 * The slice of core's Autocomplete this uses.
 *
 * Declared locally because the vendored Foundry types do not include it yet.
 */
interface AutocompleteWidget {
    /** The menu currently on screen, or null when nothing is showing */
    readonly element: HTMLElement | null;
    activate(target: HTMLElement, entries: AutocompleteEntry[], options?: { prefix?: string; position?: object }): void;
    dismiss(): void;
}

interface AutocompleteConstructor {
    new (options?: {
        onSelect?: (identifier: string, label: string, options?: { prefix?: string }) => void;
    }): AutocompleteWidget;
}

function autocompleteClass(): AutocompleteConstructor | undefined {
    return (foundry.applications as unknown as { ux?: { Autocomplete?: AutocompleteConstructor } }).ux?.Autocomplete;
}

/**
 * The path the caret is in: what to complete from, and what a choice replaces.
 *
 * `token` stops at the caret, so editing the middle of a path completes from
 * where the cursor is. `start` and `end` cover the whole path around it,
 * because replacing only as far as the caret would leave the tail of the old
 * path stranded behind the new one. Semicolons are not path characters, so an
 * input holding a semicolon-separated list completes one path at a time.
 */
function tokenAroundCaret(input: HTMLInputElement): { token: string; start: number; end: number } {
    // The far edge of a selection, so tabbing into a filled field completes the
    // whole of what is there rather than treating a select-all as an empty box
    const caret = input.selectionEnd ?? input.value.length;
    const token = TOKEN_PATTERN.exec(input.value.slice(0, caret))?.[0] ?? "";
    const tail = TOKEN_TAIL_PATTERN.exec(input.value.slice(caret))?.[0] ?? "";

    return { token, start: caret - token.length, end: caret + tail.length };
}

function pathEntries(token: string): AutocompleteEntry[] {
    return nextSegments(findPropertyPaths("Actor"), token).map((path) => ({
        identifier: path,
        label: path,
    }));
}

/**
 * Mark an input holding a path the Actor document does not appear to have.
 *
 * A warning only. Derived data that no schema declares is a legitimate thing to
 * write here, so this never prevents saving. Inputs holding a
 * semicolon-separated list are checked one path at a time.
 */
function markValidity(input: HTMLInputElement): void {
    const paths = input.value
        .split(";")
        .map((path) => path.trim())
        .filter((path) => path);

    // A trailing dot means the path is part written, which is not the same as wrong
    const unknown = paths.some((path) => !path.endsWith(".") && !isKnownPropertyPath("Actor", path));

    input.classList.toggle("unknown-path", unknown);
    if (unknown) {
        input.dataset.tooltip = game.i18n.localize("PocketChange.TreasureConfig.UnknownPathWarning");
    } else {
        input.removeAttribute("data-tooltip");
    }
}

/** Core marks its selection with a class and never scrolls, so the arrows walk out of view. */
function followSelection(menu: HTMLElement): MutationObserver {
    const observer = new MutationObserver(() => {
        menu.querySelector("li.active")?.scrollIntoView({ block: "nearest" });
    });

    observer.observe(menu, { attributeFilter: ["class"], subtree: true });

    return observer;
}

/** Without this the input blurs on mouse down and the menu goes before the click lands. */
function keepFocus(event: Event): void {
    event.preventDefault();
}

/**
 * The one widget the whole menu shares.
 *
 * There is only ever one `#autocomplete` element, and core binds that element's
 * click handling to whichever widget created it. A widget per input would
 * commit every click into whichever input opened a menu first. Core keeps a
 * singleton for the same reason.
 */
let widget: AutocompleteWidget | undefined;

let openInput: HTMLInputElement | undefined;

let selection: MutationObserver | undefined;

/** Set while a choice is being written back, so refocusing does not reopen the menu. */
let committing = false;

function commitSelection(identifier: string): void {
    if (!openInput) return;

    const input = openInput;

    // A path with more inside it earns its separator now, so the next step can
    // be picked without typing anything
    const hasMore = pathEntries(identifier).length > 0;
    const completion = hasMore && !identifier.endsWith(".") ? `${identifier}.` : identifier;

    committing = true;

    try {
        const { start, end } = tokenAroundCaret(input);

        input.value = `${input.value.slice(0, start)}${completion}${input.value.slice(end)}`;
        const caret = start + completion.length;
        input.setSelectionRange(caret, caret);
        input.focus();

        markValidity(input);

        // So the menu's own change handlers see the new value
        input.dispatchEvent(new Event("change", { bubbles: true }));
    } finally {
        committing = false;
    }

    // Core dismisses the moment this returns, so the next menu has to wait its turn
    if (hasMore) queueMicrotask(() => refreshMenu(input));
}

function sharedWidget(): AutocompleteWidget | undefined {
    if (widget) return widget;

    const Autocomplete = autocompleteClass();
    if (!Autocomplete) return undefined;

    widget = new Autocomplete({ onSelect: commitSelection });

    return widget;
}

function showMenu(input: HTMLInputElement, entries: AutocompleteEntry[], token: string): void {
    const shared = sharedWidget();
    if (!shared) return;

    openInput = input;
    shared.activate(input, entries, { prefix: token });

    const menu = shared.element;
    if (!menu) return;

    menu.classList.add(MENU_CLASS);
    menu.addEventListener("mousedown", keepFocus);

    selection?.disconnect();
    selection = followSelection(menu);
}

/** Only closes a menu this input still owns, so a late blur cannot take another's away. */
function hideMenu(input: HTMLInputElement): void {
    if (openInput && openInput !== input) return;

    openInput = undefined;
    selection?.disconnect();
    selection = undefined;
    widget?.dismiss();
}

function refreshMenu(input: HTMLInputElement): void {
    if (committing) return;

    // Reopening runs a moment late, by which time the caret may have moved on
    if (input.ownerDocument.activeElement !== input) return;

    const { token } = tokenAroundCaret(input);
    const entries = pathEntries(token).slice(0, SUGGESTION_LIMIT);

    // activate() ignores an empty list rather than closing, so closing is explicit
    if (entries.length === 0) hideMenu(input);
    else showMenu(input, entries, token);
}

/** Safe to call again on a re-render: the element is marked so listeners attach once. */
function bindPathInput(input: HTMLInputElement): void {
    markValidity(input);

    if (input.dataset.pathBound) return;
    input.dataset.pathBound = "true";

    const refresh = (): void => refreshMenu(input);

    // Focusing counts as asking what is available, otherwise an empty field
    // shows nothing until a first letter is guessed. Waiting a turn is what
    // makes it work on a filled field: the caret is only put where the click
    // landed once focusing is done, and an element focused for the first time
    // reports it sitting at the front
    input.addEventListener("focus", () => setTimeout(refresh, 0));
    input.addEventListener("input", refresh);
    input.addEventListener("blur", () => hideMenu(input));
    input.addEventListener("change", () => markValidity(input));
}

export { bindPathInput };
