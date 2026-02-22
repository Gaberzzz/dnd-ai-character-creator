export interface Feature {
  name: string;
  description: string;
  category?: string;
}

export interface CharacterClass {
  name: string;
  subclass: string;
  level: number;
  description?: string;
}

export interface CharacterData {
  characterName: string;
  playerName: string;
  race: string;
  raceDescription: string;
  classes?: CharacterClass[];
  class?: string;
  classDescription?: string;
  level?: string;
  subclass?: string;
  subclassDescription?: string;
  background: string;
  alignment: string;
  experiencePoints: string;
  strength: string;
  strengthMod: string;
  dexterity: string;
  dexterityMod: string;
  constitution: string;
  constitutionMod: string;
  intelligence: string;
  intelligenceMod: string;
  wisdom: string;
  wisdomMod: string;
  charisma: string;
  charismaMod: string;
  armorClass: string;
  initiative: string;
  speed: string;
  hitPointMaximum: string;
  currentHitPoints: string;
  temporaryHitPoints: string;
  hitDice: string;
  spentHitDice?: { [dieSides: string]: number };
  proficiencyBonus: string;
  personalityTraits: string;
  ideals: string;
  bonds: string;
  flaws: string;
  features: Feature[];
  featuresAndTraits: string;
  equipment: string;
  attacks: Array<{
    name: string;
    atkBonus: string;
    damage: string;
  }>;
  skills: { [key: string]: { proficient: boolean; value: string } };
  savingThrows: { [key: string]: { proficient: boolean; value: string } };
  cantrips: Array<{
    name: string;
    level: string;
    school: string;
    castingTime: string;
    range: string;
    duration: string;
    description: string;
    damage?: string;
    saveDC?: string;
    concentration?: boolean;
    ritual?: boolean;
    components?: string;
    attackType?: 'attack' | 'save' | 'auto-hit' | 'none';
    altDamage?: string;
    higherLevels?: string;
  }>;
  spells: Array<{
    name: string;
    level: string;
    school: string;
    castingTime: string;
    range: string;
    duration: string;
    description: string;
    damage?: string;
    saveDC?: string;
    concentration?: boolean;
    ritual?: boolean;
    components?: string;
    attackType?: 'attack' | 'save' | 'auto-hit' | 'none';
    altDamage?: string;
    higherLevels?: string;
  }>;
  spellcastingAbility: string;
  spellSaveDC: string;
  spellAttackBonus: string;
  usedSpellSlots?: { [level: string]: number };
  cp: string;
  sp: string;
  ep: string;
  gp: string;
  pp: string;
}
