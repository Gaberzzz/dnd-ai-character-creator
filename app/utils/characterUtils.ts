import type { CharacterData } from '~/types/character';

export const CLASS_HIT_DICE: Record<string, number> = {
  barbarian: 12,
  fighter: 10,
  paladin: 10,
  ranger: 10,
  bard: 8,
  cleric: 8,
  druid: 8,
  monk: 8,
  rogue: 8,
  warlock: 8,
  artificer: 8,
  sorcerer: 6,
  wizard: 6,
};

export const getHitDiceByClass = (character: CharacterData): string => {
  const classes = character.classes && character.classes.length > 0
    ? character.classes
    : character.class
      ? [{ name: character.class, level: parseInt(character.level ?? '') || 1 }]
      : [];

  if (classes.length === 0) return character.hitDice || '';

  const parts = classes
    .map(cls => {
      const dieSides = CLASS_HIT_DICE[cls.name.toLowerCase().trim()];
      if (!dieSides) return null;
      return `${cls.level}d${dieSides}`;
    })
    .filter(Boolean);

  if (parts.length === 0) return character.hitDice || '';
  return parts.join(' + ');
};

export interface HitDieGroup {
  dieSides: number;
  total: number;
  remaining: number;
}

export const getHitDiceGroups = (character: CharacterData): HitDieGroup[] => {
  const classes = character.classes && character.classes.length > 0
    ? character.classes
    : character.class
      ? [{ name: character.class, level: parseInt(character.level ?? '') || 1 }]
      : [];

  const totals: Record<number, number> = {};
  for (const cls of classes) {
    const sides = CLASS_HIT_DICE[cls.name.toLowerCase().trim()];
    if (!sides) continue;
    totals[sides] = (totals[sides] || 0) + cls.level;
  }

  const spent = character.spentHitDice || {};
  return Object.entries(totals).map(([sides, total]) => ({
    dieSides: parseInt(sides),
    total,
    remaining: Math.max(0, total - (spent[sides] || 0)),
  }));
};

export const calculateModifier = (abilityScore: number): number => {
  return Math.floor((abilityScore - 10) / 2);
};

export const calculateProficiencyBonusFromLevel = (level: string): number => {
  const levelNum = parseInt(level);
  if (!levelNum) return 2;
  if (levelNum <= 4) return 2;
  if (levelNum <= 8) return 3;
  if (levelNum <= 12) return 4;
  if (levelNum <= 16) return 5;
  return 6;
};

export const calculateTotalLevel = (character: CharacterData): number => {
  if (character.classes && Array.isArray(character.classes) && character.classes.length > 0) {
    return character.classes.reduce((sum, cls) => sum + cls.level, 0);
  }
  return parseInt(character.level ?? '') || 1;
};

export const normalizeCharacterData = (character: CharacterData): CharacterData => {
  if (!character.classes || character.classes.length === 0) {
    const level = parseInt(character.level ?? '') || 1;
    return {
      ...character,
      classes: character.class ? [{
        name: character.class,
        subclass: character.subclass || '',
        level: level,
        description: character.classDescription,
      }] : [],
    };
  }
  return character;
};

export const getClassDisplayText = (character: CharacterData): string => {
  if (character.classes && character.classes.length > 0) {
    const text = character.classes
      .map(cls => `${cls.name}${cls.subclass ? ` (${cls.subclass})` : ''} ${cls.level}`)
      .join(' / ');
    if (character.classes.length === 1 && !character.classes[0].name.trim()) return '';
    return text;
  }
  return `${character.class ?? ''}${character.subclass ? ` (${character.subclass})` : ''}`.trim() || '';
};

export function parseClassDisplayString(str: string): { name: string; subclass: string; level: number }[] {
  const segments = str.split(/\s*\/\s*/).map(s => s.trim()).filter(Boolean);
  if (segments.length === 0) return [];

  return segments.map(segment => {
    const levelMatch = segment.match(/\s+(\d+)$/);
    if (!levelMatch) {
      return { name: segment, subclass: '', level: 1 };
    }
    const level = Math.min(20, Math.max(1, parseInt(levelMatch[1], 10)));
    const beforeLevel = segment.slice(0, -levelMatch[0].length).trim();
    const subclassMatch = beforeLevel.match(/\s+\(([^)]+)\)$/);
    if (subclassMatch) {
      return {
        name: beforeLevel.slice(0, -subclassMatch[0].length).trim(),
        subclass: subclassMatch[1],
        level,
      };
    }
    return { name: beforeLevel, subclass: '', level };
  });
}

export const getAbilityModifier = (
  character: CharacterData,
  abilityKey: 'strength' | 'dexterity' | 'constitution' | 'intelligence' | 'wisdom' | 'charisma'
): string => {
  const scoreStr = character[abilityKey];
  const score = parseInt(scoreStr) || 0;
  const mod = calculateModifier(score);
  return mod >= 0 ? `+${mod}` : `${mod}`;
};

export const getSpellcastingAbilityScore = (character: CharacterData): number => {
  const ability = character.spellcastingAbility.toLowerCase().trim();
  switch (ability) {
    case 'str': return parseInt(character.strength) || 10;
    case 'dex': return parseInt(character.dexterity) || 10;
    case 'con': return parseInt(character.constitution) || 10;
    case 'int': return parseInt(character.intelligence) || 10;
    case 'wis': return parseInt(character.wisdom) || 10;
    case 'cha': return parseInt(character.charisma) || 10;
    default: return 10;
  }
};

// Full caster spell slots (Bard, Cleric, Druid, Sorcerer, Wizard)
// Index = caster level - 1; value = [1st, 2nd, ..., 9th] slot counts
export const FULL_CASTER_SPELL_SLOTS: number[][] = [
  [2,0,0,0,0,0,0,0,0], // level 1
  [3,0,0,0,0,0,0,0,0], // level 2
  [4,2,0,0,0,0,0,0,0], // level 3
  [4,3,0,0,0,0,0,0,0], // level 4
  [4,3,2,0,0,0,0,0,0], // level 5
  [4,3,3,0,0,0,0,0,0], // level 6
  [4,3,3,1,0,0,0,0,0], // level 7
  [4,3,3,2,0,0,0,0,0], // level 8
  [4,3,3,3,1,0,0,0,0], // level 9
  [4,3,3,3,2,0,0,0,0], // level 10
  [4,3,3,3,2,1,0,0,0], // level 11
  [4,3,3,3,2,1,0,0,0], // level 12
  [4,3,3,3,2,1,1,0,0], // level 13
  [4,3,3,3,2,1,1,0,0], // level 14
  [4,3,3,3,2,1,1,1,0], // level 15
  [4,3,3,3,2,1,1,1,0], // level 16
  [4,3,3,3,2,1,1,1,1], // level 17
  [4,3,3,3,3,1,1,1,1], // level 18
  [4,3,3,3,3,2,1,1,1], // level 19
  [4,3,3,3,3,2,2,1,1], // level 20
];

// Warlock Pact Magic: index = warlock level - 1; value = [slotCount, slotLevel]
export const WARLOCK_PACT_MAGIC: [number, number][] = [
  [1,1],[2,1],[2,2],[2,2],[2,3],[2,3],[2,4],[2,4],
  [2,5],[2,5],[3,5],[3,5],[3,5],[3,5],[3,5],[3,5],
  [4,5],[4,5],[4,5],[4,5],
];

export interface SpellSlotInfo {
  slots: number[]; // index 0 = 1st-level slots, etc.
  warlockSlots?: { count: number; level: number };
}

const FULL_CASTERS = new Set(['bard', 'cleric', 'druid', 'sorcerer', 'wizard']);
const HALF_CASTERS = new Set(['paladin', 'ranger']);
const ARTIFICER = 'artificer';
const THIRD_CASTER_SUBCLASSES = new Set(['eldritch knight', 'arcane trickster']);

function getCasterLevel(className: string, subclass: string, classLevel: number): number {
  const name = className.toLowerCase().trim();
  const sub = (subclass || '').toLowerCase().trim();
  if (FULL_CASTERS.has(name)) return classLevel;
  if (HALF_CASTERS.has(name)) return Math.floor(classLevel / 2);
  if (name === ARTIFICER) return Math.ceil(classLevel / 2);
  if (name === 'fighter' || name === 'rogue') {
    if (THIRD_CASTER_SUBCLASSES.has(sub)) return Math.floor(classLevel / 3);
  }
  return 0;
}

export const calculateSpellSlots = (character: CharacterData): SpellSlotInfo => {
  const normalized = normalizeCharacterData(character);
  const classes = normalized.classes || [];

  let combinedCasterLevel = 0;
  let warlockLevel = 0;

  for (const cls of classes) {
    const name = cls.name.toLowerCase().trim();
    if (name === 'warlock') {
      warlockLevel += cls.level;
    } else {
      combinedCasterLevel += getCasterLevel(cls.name, cls.subclass, cls.level);
    }
  }

  const slots = combinedCasterLevel >= 1
    ? [...FULL_CASTER_SPELL_SLOTS[Math.min(combinedCasterLevel, 20) - 1]]
    : [0,0,0,0,0,0,0,0,0];

  let warlockSlots: SpellSlotInfo['warlockSlots'];
  if (warlockLevel >= 1) {
    const [count, level] = WARLOCK_PACT_MAGIC[Math.min(warlockLevel, 20) - 1];
    warlockSlots = { count, level };
  }

  return { slots, warlockSlots };
};

export const SPELL_LEVEL_LABELS = ['1st','2nd','3rd','4th','5th','6th','7th','8th','9th'];

export const skillToAbility: Record<string, string> = {
  acrobatics: 'DEX',
  animalHandling: 'WIS',
  arcana: 'INT',
  athletics: 'STR',
  deception: 'CHA',
  history: 'INT',
  insight: 'WIS',
  intimidation: 'CHA',
  investigation: 'INT',
  medicine: 'WIS',
  nature: 'INT',
  perception: 'WIS',
  performance: 'CHA',
  persuasion: 'CHA',
  religion: 'INT',
  sleightOfHand: 'DEX',
  stealth: 'DEX',
  survival: 'WIS',
};

export const abilityToSkills: Record<string, string[]> = {
  Strength: ['athletics'],
  Dexterity: ['acrobatics', 'sleightOfHand', 'stealth'],
  Constitution: [],
  Intelligence: ['arcana', 'history', 'investigation', 'nature', 'religion'],
  Wisdom: ['animalHandling', 'insight', 'medicine', 'perception', 'survival'],
  Charisma: ['deception', 'intimidation', 'performance', 'persuasion'],
};
