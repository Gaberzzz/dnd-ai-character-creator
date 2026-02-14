/**
 * Spell Attack Configuration
 * Defines offensive spells with their attack types and properties
 */

export type AttackType = 'attack' | 'save' | 'auto-hit' | 'none';

export interface VariableDamageOption {
  label: string;
  diceSides: number;
  condition: string;
}

export interface SpellAttackConfig {
  name: string;
  attackType: AttackType;
  damageDice?: string; // e.g., "1d8" or "2d6"
  variableDamage?: VariableDamageOption[]; // e.g., d8 vs d12 for Toll the Dead
  saveType?: string; // e.g., "DEX", "STR", etc.
}

/**
 * Configuration for known offensive spells and cantrips
 * Covers most common offensive spells in D&D 5e
 */
export const OFFENSIVE_SPELLS: Record<string, SpellAttackConfig> = {
  // Cantrips - Attack Roll
  'fire bolt': {
    name: 'Fire Bolt',
    attackType: 'attack',
    damageDice: '1d10',
  },
  'eldritch blast': {
    name: 'Eldritch Blast',
    attackType: 'attack',
    damageDice: '1d10',
  },
  'ray of frost': {
    name: 'Ray of Frost',
    attackType: 'attack',
    damageDice: '1d8',
  },
  'shocking grasp': {
    name: 'Shocking Grasp',
    attackType: 'attack',
    damageDice: '1d8',
  },
  'frost bolt': {
    name: 'Frost Bolt',
    attackType: 'attack',
    damageDice: '1d8',
  },
  'booming blade': {
    name: 'Booming Blade',
    attackType: 'attack',
    damageDice: '1d8',
  },
  'green-flame blade': {
    name: 'Green-Flame Blade',
    attackType: 'attack',
    damageDice: '1d8',
  },
  'sword burst': {
    name: 'Sword Burst',
    attackType: 'save',
    damageDice: '1d6',
    saveType: 'DEX',
  },
  'thunderwave': {
    name: 'Thunderwave',
    attackType: 'save',
    damageDice: '2d8',
    saveType: 'STR',
  },

  // Cantrips - Saving Throw
  'toll the dead': {
    name: 'Toll the Dead',
    attackType: 'save',
    damageDice: '1d8',
    variableDamage: [
      { label: 'd8', diceSides: 8, condition: 'Target has max HP' },
      { label: 'd12', diceSides: 12, condition: 'Target missing HP' },
    ],
    saveType: 'WIS',
  },
  'sacred flame': {
    name: 'Sacred Flame',
    attackType: 'save',
    damageDice: '1d8',
    saveType: 'DEX',
  },
  'scorching ray': {
    name: 'Scorching Ray',
    attackType: 'attack',
    damageDice: '2d6',
  },

  // Cantrips - Auto-hit
  'magic missile': {
    name: 'Magic Missile',
    attackType: 'auto-hit',
    damageDice: '1d4+1',
  },
  'true strike': {
    name: 'True Strike',
    attackType: 'auto-hit',
    damageDice: '0', // No damage
  },

  // 1st Level - Attack Roll
  'guiding bolt': {
    name: 'Guiding Bolt',
    attackType: 'attack',
    damageDice: '4d6',
  },
  'chromatic orb': {
    name: 'Chromatic Orb',
    attackType: 'attack',
    damageDice: '3d8',
  },

  // 1st Level - Saving Throw
  'burning hands': {
    name: 'Burning Hands',
    attackType: 'save',
    damageDice: '3d6',
    saveType: 'DEX',
  },

  // 2nd Level - Saving Throw
  'fireball': {
    name: 'Fireball',
    attackType: 'save',
    damageDice: '8d6',
    saveType: 'DEX',
  },
  'shatter': {
    name: 'Shatter',
    attackType: 'save',
    damageDice: '3d8',
    saveType: 'CON',
  },

  // 3rd Level
  'fireball (3rd)': {
    name: 'Fireball',
    attackType: 'save',
    damageDice: '8d6',
    saveType: 'DEX',
  },
  'lightning bolt': {
    name: 'Lightning Bolt',
    attackType: 'save',
    damageDice: '8d6',
    saveType: 'DEX',
  },

  // Higher Level Spells
  'meteor swarm': {
    name: 'Meteor Swarm',
    attackType: 'save',
    damageDice: '40d6',
    saveType: 'DEX',
  },
  'prismatic spray': {
    name: 'Prismatic Spray',
    attackType: 'save',
    damageDice: '10d6',
    saveType: 'DEX',
  },
};

/**
 * Determine the attack type for a spell by name
 * Returns the configuration if found, otherwise returns 'none' type
 */
export function getSpellAttackType(spellName: string): SpellAttackConfig {
  const normalizedName = spellName.toLowerCase().trim();
  const config = OFFENSIVE_SPELLS[normalizedName];

  if (config) {
    return config;
  }

  // Return default non-offensive spell
  return {
    name: spellName,
    attackType: 'none',
  };
}

/**
 * Check if a spell has variable damage options (like Toll the Dead)
 */
export function hasVariableDamage(spellName: string): boolean {
  const config = getSpellAttackType(spellName);
  return config.variableDamage !== undefined && config.variableDamage.length > 0;
}

/**
 * Get variable damage options for a spell
 */
export function getVariableDamageOptions(
  spellName: string
): VariableDamageOption[] {
  const config = getSpellAttackType(spellName);
  return config.variableDamage || [];
}

/**
 * Healing Spell Configuration
 * Defines healing spells and their properties
 */
export interface HealingSpellConfig {
  name: string;
  healingDice: string; // e.g., "1d4", "1d8", "3d8"
  appliesAbilityModifier: boolean; // Whether to add spellcasting ability modifier
}

/**
 * Configuration for known healing spells in D&D 5e
 */
export const HEALING_SPELLS: Record<string, HealingSpellConfig> = {
  'healing word': {
    name: 'Healing Word',
    healingDice: '1d4',
    appliesAbilityModifier: true,
  },
  'cure wounds': {
    name: 'Cure Wounds',
    healingDice: '1d8',
    appliesAbilityModifier: true,
  },
  'prayer of healing': {
    name: 'Prayer of Healing',
    healingDice: '1d4',
    appliesAbilityModifier: true,
  },
  'mass cure wounds': {
    name: 'Mass Cure Wounds',
    healingDice: '3d8',
    appliesAbilityModifier: true,
  },
  'cure disease': {
    name: 'Cure Disease',
    healingDice: '0',
    appliesAbilityModifier: false, // No dice roll
  },
  'lesser restoration': {
    name: 'Lesser Restoration',
    healingDice: '0',
    appliesAbilityModifier: false, // No dice roll
  },
  'greater restoration': {
    name: 'Greater Restoration',
    healingDice: '0',
    appliesAbilityModifier: false, // No dice roll
  },
  'regenerate': {
    name: 'Regenerate',
    healingDice: '4',
    appliesAbilityModifier: false, // Fixed 4 HP at start of turn
  },
  'mass healing word': {
    name: 'Mass Healing Word',
    healingDice: '1d4',
    appliesAbilityModifier: true,
  },
  'heal': {
    name: 'Heal',
    healingDice: '70',
    appliesAbilityModifier: false, // Fixed amount
  },
};

/**
 * Detect if a spell is a healing spell by parsing the description
 * Looks for common healing keywords and patterns
 */
export function detectHealingSpell(
  spellName: string,
  description?: string
): { isHealing: boolean; appliesModifier: boolean } {
  const normalizedName = spellName.toLowerCase().trim();
  
  // Check hardcoded healing spells first
  const healingConfig = HEALING_SPELLS[normalizedName];
  if (healingConfig) {
    return {
      isHealing: true,
      appliesModifier: healingConfig.appliesAbilityModifier,
    };
  }

  // Auto-detect from description with keywords
  if (description) {
    const lowerDesc = description.toLowerCase();
    
    // Keywords that indicate healing without ability modifier
    const noModifierKeywords = ['regenerate', 'restore', 'cure disease', 'lesser restoration', 'greater restoration', 'remove', 'cleanse'];
    if (noModifierKeywords.some(keyword => lowerDesc.includes(keyword))) {
      return { isHealing: true, appliesModifier: false };
    }

    // Keywords that indicate healing WITH ability modifier
    const modifierKeywords = ['gain.*hit points', 'restore.*hit points', 'heal', 'regain.*hit points', 'recover.*hit point'];
    if (modifierKeywords.some(keyword => new RegExp(keyword, 'i').test(lowerDesc))) {
      return { isHealing: true, appliesModifier: true };
    }
  }

  return { isHealing: false, appliesModifier: false };
}

/**
 * Get healing configuration for a spell
 */
export function getHealingSpell(spellName: string): HealingSpellConfig | null {
  const normalizedName = spellName.toLowerCase().trim();
  return HEALING_SPELLS[normalizedName] || null;
}

/**
 * Extract healing formula from spell description using pattern matching
 * Looks for patterns like "1d4", "2d8+WIS", etc.
 */
export function extractHealingFormulaFromDescription(description?: string): string | null {
  if (!description) return null;
  
  // Match patterns like "1d4", "2d8+3", "1d4+WIS modifier", etc.
  const match = description.match(/(\d+)d(\d+)(?:\s*\+\s*(?:your\s+)?(\w+(?:\s+modifier)?|Wisdom(?:\s+modifier)?|Intelligence(?:\s+modifier)?|Charisma(?:\s+modifier)?))?/i);
  
  if (match) {
    const diceCount = match[1];
    const diceSides = match[2];
    return `${diceCount}d${diceSides}`;
  }
  
  return null;
}
