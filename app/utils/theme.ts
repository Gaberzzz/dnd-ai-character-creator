/**
 * Central theme constants for the character sheet UI.
 * Edit values here to restyle the entire application.
 *
 * IMPORTANT: Values must be complete Tailwind class strings (e.g. "bg-gray-800"),
 * never fragments (e.g. "gray-800"), so Tailwind JIT can detect them.
 */

// ─── Backgrounds ────────────────────────────────────────────────────────────
export const pageBg = "bg-gray-900";
export const cardBg = "bg-gray-800";
export const cardBgAlt = "bg-gray-700";   // secondary cards, accordion bodies
export const headerBg = "bg-gray-600";    // expandable/accordion header rows
export const inputBg = "bg-gray-800";

// ─── Borders ────────────────────────────────────────────────────────────────
export const cardBorder = "border border-orange-500";
export const inputBorder = "border border-gray-600";
export const inputBorderAccent = "border border-orange-500";
export const divider = "border-gray-600";
export const dividerSubtle = "border-gray-500";

// ─── Text — headings ────────────────────────────────────────────────────────
export const headingText = "text-orange-400";
export const subHeadingText = "text-orange-300";

// ─── Text — body ────────────────────────────────────────────────────────────
export const labelText = "text-gray-400";
export const bodyText = "text-gray-300";
export const mutedText = "text-gray-500";

// ─── Input fields ───────────────────────────────────────────────────────────
/** Standard input — gray border, gray text */
export const inputBase = "bg-gray-800 border border-gray-600 text-gray-300 rounded px-2 py-1";
/** Accent input — orange border, orange text (names, key values) */
export const inputAccent = "bg-gray-800 border border-orange-500 text-orange-300 rounded px-2 py-1";
/** Textarea — gray border, gray text */
export const textareaBase = "bg-gray-800 border border-gray-600 text-gray-300 rounded px-2 py-1";

// ─── Buttons ────────────────────────────────────────────────────────────────
/** Large primary action (Save, Edit) */
export const btnPrimary = "px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-md text-sm font-medium transition-colors";
/** Large secondary action (PDF, JSON, Cancel, Back) */
export const btnSecondary = "px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-md text-sm font-medium transition-colors";
/** Small primary action (+ Add Spell, + Add Weapon, etc.) */
export const btnSmall = "px-3 py-1 bg-orange-600 hover:bg-orange-500 text-white rounded text-sm font-medium transition-colors";
/** Small destructive action (Remove, Delete) */
export const btnDanger = "px-3 py-1 bg-red-800 hover:bg-red-700 text-white rounded text-sm font-medium transition-colors";
/** Inline dice roll button (hidden until group hover) */
export const btnDice = "p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-gray-600 text-orange-400 hover:text-orange-300 transition-all flex-shrink-0";

// ─── Tab navigation ─────────────────────────────────────────────────────────
export const tabActive = "text-orange-400 border-b-2 border-orange-400";
export const tabInactive = "text-gray-400 hover:text-orange-300";

// ─── Composite layout helpers ───────────────────────────────────────────────
/** Standard card panel */
export const card = "bg-gray-800 rounded-lg border border-orange-500 p-4";
/** Alternate card panel (slightly lighter) */
export const cardAlt = "bg-gray-700 border border-orange-500 rounded-lg p-4";
/** Expandable/accordion header row */
export const accordionHeader = "w-full px-4 py-3 bg-gray-600 border-b border-gray-500 flex items-center justify-between hover:bg-gray-500 transition-colors";
/** Expandable/accordion body */
export const accordionBody = "px-4 py-3 bg-gray-700";

// ─── Form controls ──────────────────────────────────────────────────────────
export const checkboxAccent = "w-4 h-4 accent-orange-500 rounded";
