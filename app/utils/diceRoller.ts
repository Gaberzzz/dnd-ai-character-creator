/**
 * Dice Rolling Utility for D&D 5e Character Sheet
 * Handles all dice rolling operations with formula parsing and history tracking
 */

export interface RollResult {
  id: string; // unique identifier for the roll
  type: string; // 'ability-check', 'saving-throw', 'skill-check', 'attack', 'damage', 'healing'
  name: string; // 'Strength', 'Acrobatics', 'Longsword', etc.
  formula: string; // 'd20+3', '1d8+2', '2d6', etc.
  rolls: number[]; // individual die rolls [18, 3] for '1d20+3'
  modifier: number; // the modifier applied
  total: number; // final result
  breakdown: string; // human-readable: "18 + 3 = 21"
  timestamp: Date;
}

/**
 * Calculate ability modifier from ability score
 */
export function calculateAbilityModifier(abilityScore: number): number {
  return Math.floor((abilityScore - 10) / 2);
}

/**
 * Calculate proficiency bonus from character level
 */
export function calculateProficiencyBonus(level: number): number {
  if (level <= 4) return 2;
  if (level <= 8) return 3;
  if (level <= 12) return 4;
  if (level <= 16) return 5;
  return 6;
}

/**
 * Calculate spell save DC dynamically
 * Formula: 8 + ability modifier + proficiency bonus
 */
export function calculateSpellSaveDC(
  abilityScore: number,
  proficiencyBonus: number
): number {
  const abilityMod = calculateAbilityModifier(abilityScore);
  return 8 + abilityMod + proficiencyBonus;
}

/**
 * Calculate spell attack bonus dynamically
 * Formula: ability modifier + proficiency bonus
 */
export function calculateSpellAttackBonus(
  abilityScore: number,
  proficiencyBonus: number
): number {
  const abilityMod = calculateAbilityModifier(abilityScore);
  return abilityMod + proficiencyBonus;
}

/**
 * Format spell attack bonus for display (e.g., "+4" or "-2")
 */
export function formatSpellBonus(bonus: number): string {
  return bonus >= 0 ? `+${bonus}` : `${bonus}`;
}

/**
 * Roll a single die with a specified number of sides
 */
function rollDice(sides: number): number {
  return Math.floor(Math.random() * sides) + 1;
}

/**
 * Roll multiple dice and return individual results
 */
function rollMultipleDice(count: number, sides: number): number[] {
  return Array.from({ length: count }, () => rollDice(sides));
}

/**
 * Parse a damage formula like "1d8 + 2 piercing" or "2d6 - 1 slashing" into components
 */
export function parseDamageFormula(formula: string): {
  diceCount: number;
  diceSides: number;
  modifier: number;
} {
  // Remove all spaces first and convert to lowercase
  let normalized = formula.replace(/\s/g, '').toLowerCase();

  // Remove damage type suffix (piercing, slashing, bludgeoning, fire, cold, etc.)
  normalized = normalized.replace(/(piercing|slashing|bludgeoning|fire|cold|acid|poison|psychic|radiant|necrotic|force|thunder|lightning)$/, '');

  // Match patterns like "1d8+2", "2d6-1", "1d20+3"
  const match = normalized.match(/^(\d+)d(\d+)([\+\-])(\d+)$/);

  if (!match) {
    // Try to match without modifier (e.g., "1d8" or "2d6")
    const matchNoMod = normalized.match(/^(\d+)d(\d+)$/);
    if (matchNoMod) {
      return {
        diceCount: parseInt(matchNoMod[1], 10),
        diceSides: parseInt(matchNoMod[2], 10),
        modifier: 0,
      };
    }

    // If parsing still fails, log a warning with the original formula
    console.warn(`Could not parse damage formula: "${formula}". Using d20 as fallback.`);
    return { diceCount: 1, diceSides: 20, modifier: 0 };
  }

  const diceCount = parseInt(match[1], 10);
  const diceSides = parseInt(match[2], 10);
  const sign = match[3];
  const modifierValue = parseInt(match[4], 10);
  const modifier = sign === '+' ? modifierValue : -modifierValue;

  return { diceCount, diceSides, modifier };
}

/**
 * Roll for an ability check (d20 + modifier)
 */
export function rollAbilityCheck(
  abilityName: string,
  modifier: number
): RollResult {
  const rolls = [rollDice(20)];
  const total = rolls[0] + modifier;

  return {
    id: generateId(),
    type: 'ability-check',
    name: abilityName,
    formula: `d20+${modifier >= 0 ? '+' : ''}${modifier}`,
    rolls,
    modifier,
    total,
    breakdown: `${rolls[0]} ${modifier >= 0 ? '+' : ''} ${modifier} = ${total}`,
    timestamp: new Date(),
  };
}

/**
 * Roll for a saving throw (d20 + modifier)
 */
export function rollSavingThrow(
  throwName: string,
  modifier: number
): RollResult {
  const rolls = [rollDice(20)];
  const total = rolls[0] + modifier;

  return {
    id: generateId(),
    type: 'saving-throw',
    name: throwName,
    formula: `d20+${modifier >= 0 ? '+' : ''}${modifier}`,
    rolls,
    modifier,
    total,
    breakdown: `${rolls[0]} ${modifier >= 0 ? '+' : ''} ${modifier} = ${total}`,
    timestamp: new Date(),
  };
}

/**
 * Roll for a skill check (d20 + modifier)
 */
export function rollSkillCheck(
  skillName: string,
  modifier: number
): RollResult {
  const rolls = [rollDice(20)];
  const total = rolls[0] + modifier;

  return {
    id: generateId(),
    type: 'skill-check',
    name: skillName,
    formula: `d20+${modifier >= 0 ? '+' : ''}${modifier}`,
    rolls,
    modifier,
    total,
    breakdown: `${rolls[0]} ${modifier >= 0 ? '+' : ''} ${modifier} = ${total}`,
    timestamp: new Date(),
  };
}

/**
 * Roll for attack (d20 + attack bonus)
 */
export function rollAttack(
  weaponName: string,
  attackBonus: number
): RollResult {
  const rolls = [rollDice(20)];
  const total = rolls[0] + attackBonus;

  return {
    id: generateId(),
    type: 'attack',
    name: `${weaponName} (To Hit)`,
    formula: `d20+${attackBonus >= 0 ? '+' : ''}${attackBonus}`,
    rolls,
    modifier: attackBonus,
    total,
    breakdown: `${rolls[0]} ${attackBonus >= 0 ? '+' : ''} ${attackBonus} = ${total}`,
    timestamp: new Date(),
  };
}

/**
 * Roll for damage using a damage formula (e.g., "1d8+2")
 * Optionally override the dice sides (e.g., for Toll the Dead: d8 vs d12)
 */
export function rollDamage(
  weaponName: string,
  damageFormula: string,
  overrideDiceSides?: number
): RollResult {
  let { diceCount, diceSides, modifier } = parseDamageFormula(
    damageFormula
  );

  // Override dice sides if provided (e.g., for variable damage cantrips)
  if (overrideDiceSides !== undefined) {
    diceSides = overrideDiceSides;
  }

  const rolls = rollMultipleDice(diceCount, diceSides);
  const rollTotal = rolls.reduce((sum, roll) => sum + roll, 0);
  const total = rollTotal + modifier;

  const rollsBreakdown = rolls.join(' + ');
  const modifierPart =
    modifier > 0
      ? ` + ${modifier}`
      : modifier < 0
        ? ` - ${Math.abs(modifier)}`
        : '';

  // Update formula if dice sides were overridden
  const displayFormula =
    overrideDiceSides !== undefined
      ? damageFormula.replace(/d\d+/, `d${diceSides}`)
      : damageFormula;

  return {
    id: generateId(),
    type: 'damage',
    name: `${weaponName} (Damage)`,
    formula: displayFormula,
    rolls,
    modifier,
    total,
    breakdown: `[${rollsBreakdown}]${modifierPart} = ${total}`,
    timestamp: new Date(),
  };
}

/**
 * Roll for healing using a healing formula (e.g., "1d4", "2d8")
 * Optionally adds an ability modifier based on the healing spell type
 */
export function rollHealing(
  spellName: string,
  healingFormula: string,
  abilityModifier: number = 0
): RollResult {
  let { diceCount, diceSides, modifier } = parseDamageFormula(
    healingFormula
  );

  // For healing, the ability modifier is added to the parsed modifier
  // (or replaces it if there was no modifier in the formula)
  if (abilityModifier !== 0) {
    modifier = abilityModifier;
  }

  const rolls = rollMultipleDice(diceCount, diceSides);
  const rollTotal = rolls.reduce((sum, roll) => sum + roll, 0);
  const total = rollTotal + modifier;

  const rollsBreakdown = rolls.join(' + ');
  const modifierPart =
    modifier > 0
      ? ` + ${modifier}`
      : modifier < 0
        ? ` - ${Math.abs(modifier)}`
        : '';

  return {
    id: generateId(),
    type: 'healing',
    name: `${spellName} (Healing)`,
    formula: healingFormula,
    rolls,
    modifier,
    total,
    breakdown: `[${rollsBreakdown}]${modifierPart} = ${total}`,
    timestamp: new Date(),
  };
}

/**
 * Generate a unique ID for a roll result
 */
function generateId(): string {
  return `roll-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Format a roll result for display
 */
export function formatRollResult(roll: RollResult): string {
  return `${roll.name}: ${roll.breakdown}`;
}

/**
 * Format timestamp for display
 */
export function formatTimestamp(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  // Less than a minute
  if (diff < 60000) {
    return 'just now';
  }

  // Less than an hour
  if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000);
    return `${minutes}m ago`;
  }

  // Less than a day
  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000);
    return `${hours}h ago`;
  }

  // Format as time
  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}
