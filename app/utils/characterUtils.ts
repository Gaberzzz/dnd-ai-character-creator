import type { CharacterData } from '~/types/character';

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
