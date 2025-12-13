// app/utils/pdfFieldMapping.ts
interface CharacterData {
  characterName: string;
  playerName: string;
  race: string;
  raceDescription: string;
  class: string;
  classDescription: string;
  level: string;
  subclass: string;
  subclassDescription: string;
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
  proficiencyBonus: string;
  personalityTraits: string;
  ideals: string;
  bonds: string;
  flaws: string;
  features: Array<{
    name: string;
    description: string;
    category?: string;
  }>;
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
  }>;
  spellcastingAbility: string;
  spellSaveDC: string;
  spellAttackBonus: string;
  cp: string;
  sp: string;
  ep: string;
  gp: string;
  pp: string;
}

interface CharacterSheetData {
  [key: string]: string | boolean | undefined;
  ClassLevel?: string;
  Background?: string;
  PlayerName?: string;
  CharacterName?: string;
  Race?: string;
  Alignment?: string;
  XP?: string;
  Inspiration?: string;
  STR?: string;
  ProfBonus?: string;
  AC?: string;
  Initiative?: string;
  Speed?: string;
  PersonalityTraits?: string;
  STRmod?: string;
  HPMax?: string;
  'ST Strength'?: string;
  DEX?: string;
  HPCurrent?: string;
  Ideals?: string;
  'DEXmod '?: string;
  HPTemp?: string;
  Bonds?: string;
  CON?: string;
  HDTotal?: string;
  'Check Box 12'?: boolean;
  'Check Box 13'?: boolean;
  'Check Box 14'?: boolean;
  CONmod?: string;
  'Check Box 15'?: boolean;
  'Check Box 16'?: boolean;
  'Check Box 17'?: boolean;
  HD?: string;
  Flaws?: string;
  INT?: string;
  'ST Dexterity'?: string;
  'ST Constitution'?: string;
  'ST Intelligence'?: string;
  'ST Wisdom'?: string;
  'ST Charisma'?: string;
  Acrobatics?: string;
  Animal?: string;
  Athletics?: string;
  'Deception '?: string;
  'History '?: string;
  Insight?: string;
  Intimidation?: string;
  'Check Box 11'?: boolean;
  'Check Box 18'?: boolean;
  'Check Box 19'?: boolean;
  'Check Box 20'?: boolean;
  'Check Box 21'?: boolean;
  'Check Box 22'?: boolean;
  'Wpn Name'?: string;
  'Wpn1 AtkBonus'?: string;
  'Wpn1 Damage'?: string;
  INTmod?: string;
  'Wpn Name 2'?: string;
  'Wpn2 AtkBonus '?: string;
  'Wpn2 Damage '?: string;
  'Investigation '?: string;
  WIS?: string;
  'Wpn Name 3'?: string;
  'Wpn3 AtkBonus  '?: string;
  Arcana?: string;
  'Wpn3 Damage '?: string;
  'Perception '?: string;
  WISmod?: string;
  CHA?: string;
  Nature?: string;
  Performance?: string;
  Medicine?: string;
  Religion?: string;
  'Stealth '?: string;
  'Check Box 23'?: boolean;
  'Check Box 24'?: boolean;
  'Check Box 25'?: boolean;
  'Check Box 26'?: boolean;
  'Check Box 27'?: boolean;
  'Check Box 28'?: boolean;
  'Check Box 29'?: boolean;
  'Check Box 30'?: boolean;
  'Check Box 31'?: boolean;
  'Check Box 32'?: boolean;
  'Check Box 33'?: boolean;
  'Check Box 34'?: boolean;
  'Check Box 35'?: boolean;
  'Check Box 36'?: boolean;
  'Check Box 37'?: boolean;
  'Check Box 38'?: boolean;
  'Check Box 39'?: boolean;
  'Check Box 40'?: boolean;
  Persuasion?: string;
  SleightofHand?: string;
  'CHamod'?: string;
  Survival?: string;
  AttacksSpellcasting?: string;
  Passive?: string;
  CP?: string;
  ProficienciesLang?: string;
  SP?: string;
  EP?: string;
  GP?: string;
  PP?: string;
  Equipment?: string;
  'Features and Traits'?: string;
  'CharacterName 2'?: string;
  Age?: string;
  Height?: string;
  Weight?: string;
  Eyes?: string;
  Skin?: string;
  Hair?: string;
  'Faction Symbol Image'?: string;
  Allies?: string;
  FactionName?: string;
  Backstory?: string;
  'Feat+Traits'?: string;
  Treasure?: string;
  'CHARACTER IMAGE'?: string;
  'Spellcasting Class 2'?: string;
  'SpellcastingAbility 2'?: string;
  'SpellSaveDC  2'?: string;
  'SpellAtkBonus 2'?: string;
}

// Helper function to truncate text to max length
const truncate = (text: string, maxLength: number): string => {
  if (!text) return '';
  return text.length > maxLength ? text.substring(0, maxLength) : text;
};

// Skill to checkbox mapping (indices 11-40 based on PDF layout)
// Checkboxes 11-22: Acrobatics, Animal Handling, Arcana, Athletics, Deception, History, Insight, Intimidation, Investigation, Medicine, Nature, Perception
// Checkboxes 23-40: Performance, Persuasion, Religion, Sleight of Hand, Stealth, Survival, + Saving throw checkboxes
const skillCheckboxMap: Record<string, number> = {
  acrobatics: 18,
  animalHandling: 19,
  arcana: 22,
  athletics: 20,
  deception: 21,
  history: 23,
  insight: 24,
  intimidation: 25,
  investigation: 26,
  medicine: 27,
  nature: 28,
  perception: 29,
  performance: 30,
  persuasion: 31,
  religion: 32,
  sleightOfHand: 33,
  stealth: 34,
  survival: 35,
};

const savingThrowCheckboxMap: Record<string, number> = {
  strength: 12,
  dexterity: 13,
  constitution: 14,
  intelligence: 15,
  wisdom: 16,
  charisma: 17,
};

export function mapCharacterToPDF(character: CharacterData): CharacterSheetData {
  const data: CharacterSheetData = {};

  // Basic Information
  data.CharacterName = truncate(character.characterName, 255);
  data.PlayerName = truncate(character.playerName, 255);
  data.ClassLevel = truncate(`${character.class} ${character.level}`, 255);
  data.Background = truncate(character.background, 255);
  data.Race = truncate(character.race, 255);
  data.Alignment = truncate(character.alignment, 255);
  data.XP = truncate(character.experiencePoints, 100);
  data.Inspiration = ''; // Not typically in generated character data

  // Ability Scores
  data.STR = truncate(character.strength, 3);
  data.DEX = truncate(character.dexterity, 3);
  data.CON = truncate(character.constitution, 3);
  data.INT = truncate(character.intelligence, 3);
  data.WIS = truncate(character.wisdom, 3);
  data.CHA = truncate(character.charisma, 3);

  // Ability Modifiers
  data.STRmod = truncate(character.strengthMod, 3);
  data['DEXmod '] = truncate(character.dexterityMod, 3);
  data.CONmod = truncate(character.constitutionMod, 3);
  data.INTmod = truncate(character.intelligenceMod, 3);
  data.WISmod = truncate(character.wisdomMod, 3);
  data['CHamod'] = truncate(character.charismaMod, 3);

  // Combat Stats
  data.AC = truncate(character.armorClass, 3);
  data.Initiative = truncate(character.initiative, 3);
  data.Speed = truncate(character.speed, 50);
  data.HPMax = truncate(character.hitPointMaximum, 3);
  data.HPCurrent = truncate(character.currentHitPoints, 3);
  data.HPTemp = truncate(character.temporaryHitPoints, 3);
  data.HDTotal = truncate(character.hitDice, 50);
  data.ProfBonus = truncate(character.proficiencyBonus, 3);

  // Saving Throws (value fields)
  data['ST Strength'] = truncate(character.savingThrows.strength?.value || '', 3);
  data['ST Dexterity'] = truncate(character.savingThrows.dexterity?.value || '', 3);
  data['ST Constitution'] = truncate(character.savingThrows.constitution?.value || '', 3);
  data['ST Intelligence'] = truncate(character.savingThrows.intelligence?.value || '', 3);
  data['ST Wisdom'] = truncate(character.savingThrows.wisdom?.value || '', 3);
  data['ST Charisma'] = truncate(character.savingThrows.charisma?.value || '', 3);

  // Saving Throw Checkboxes (proficiency)
  Object.entries(savingThrowCheckboxMap).forEach(([ability, checkboxNum]) => {
    const proficient = character.savingThrows[ability]?.proficient || false;
    (data as any)[`Check Box ${checkboxNum}`] = proficient;
  });

  // Skills
  data.Acrobatics = truncate(character.skills.acrobatics?.value || '', 3);
  data.Animal = truncate(character.skills.animalHandling?.value || '', 3);
  data.Arcana = truncate(character.skills.arcana?.value || '', 3);
  data.Athletics = truncate(character.skills.athletics?.value || '', 3);
  data['Deception '] = truncate(character.skills.deception?.value || '', 3);
  data['History '] = truncate(character.skills.history?.value || '', 3);
  data.Insight = truncate(character.skills.insight?.value || '', 3);
  data.Intimidation = truncate(character.skills.intimidation?.value || '', 3);
  data['Investigation '] = truncate(character.skills.investigation?.value || '', 3);
  data.Medicine = truncate(character.skills.medicine?.value || '', 3);
  data.Nature = truncate(character.skills.nature?.value || '', 3);
  data['Perception '] = truncate(character.skills.perception?.value || '', 3);
  data.Performance = truncate(character.skills.performance?.value || '', 3);
  data.Persuasion = truncate(character.skills.persuasion?.value || '', 3);
  data.Religion = truncate(character.skills.religion?.value || '', 3);
  data.SleightofHand = truncate(character.skills.sleightOfHand?.value || '', 3);
  data['Stealth '] = truncate(character.skills.stealth?.value || '', 3);
  data.Survival = truncate(character.skills.survival?.value || '', 3);

  // Skill Checkboxes (proficiency)
  Object.entries(skillCheckboxMap).forEach(([skill, checkboxNum]) => {
    const proficient = character.skills[skill]?.proficient || false;
    (data as any)[`Check Box ${checkboxNum}`] = proficient;
  });

  // Attacks/Weapons
  if (character.attacks.length > 0) {
    data['Wpn Name'] = truncate(character.attacks[0].name, 255);
    data['Wpn1 AtkBonus'] = truncate(character.attacks[0].atkBonus, 10);
    data['Wpn1 Damage'] = truncate(character.attacks[0].damage, 50);
  }
  if (character.attacks.length > 1) {
    data['Wpn Name 2'] = truncate(character.attacks[1].name, 255);
    data['Wpn2 AtkBonus '] = truncate(character.attacks[1].atkBonus, 10);
    data['Wpn2 Damage '] = truncate(character.attacks[1].damage, 50);
  }
  if (character.attacks.length > 2) {
    data['Wpn Name 3'] = truncate(character.attacks[2].name, 255);
    data['Wpn3 AtkBonus  '] = truncate(character.attacks[2].atkBonus, 10);
    data['Wpn3 Damage '] = truncate(character.attacks[2].damage, 50);
  }

  // Personality & Traits
  data.PersonalityTraits = truncate(character.personalityTraits, 500);
  data.Ideals = truncate(character.ideals, 500);
  data.Bonds = truncate(character.bonds, 500);
  data.Flaws = truncate(character.flaws, 500);

  // Features & Equipment
  data['Features and Traits'] = truncate(character.featuresAndTraits, 1000);
  data.Equipment = truncate(character.equipment, 1000);

  // Spellcasting Info
  data['Spellcasting Class 2'] = truncate(character.class, 50);
  data['SpellcastingAbility 2'] = truncate(character.spellcastingAbility, 10);
  data['SpellSaveDC  2'] = truncate(character.spellSaveDC, 3);
  data['SpellAtkBonus 2'] = truncate(character.spellAttackBonus, 10);

  // Currency
  data.CP = truncate(character.cp, 10);
  data.SP = truncate(character.sp, 10);
  data.EP = truncate(character.ep, 10);
  data.GP = truncate(character.gp, 10);
  data.PP = truncate(character.pp, 10);

  // Spells: Combine cantrips and leveled spells in order
  // PDF has slots for cantrips (1014-1023) and leveled spells (1024-101013)
  const allSpells = [
    ...character.cantrips,
    ...character.spells.sort((a, b) => parseInt(a.level) - parseInt(b.level)),
  ];

  // Cantrips and spells by level (9 levels total)
  // Level 0 (Cantrips): fields 1014-1023 (10 slots)
  // Level 1: fields 1024-1033 (10 slots)
  // Level 2: fields 1034-1043 (10 slots)
  // Level 3: fields 1044-1053 (10 slots)
  // Level 4: fields 1054-1063 (10 slots)
  // Level 5: fields 1064-1073 (10 slots)
  // Level 6: fields 1074-1083 (10 slots)
  // Level 7: fields 1084-1093 (10 slots)
  // Level 8: fields 1094-1103 (10 slots)
  // Level 9: fields 10104-10113 (10 slots)

  const spellsByLevel: Record<string, string[]> = {
    '0': [],
    '1': [],
    '2': [],
    '3': [],
    '4': [],
    '5': [],
    '6': [],
    '7': [],
    '8': [],
    '9': [],
  };

  allSpells.forEach((spell) => {
    const level = spell.level || '0';
    if (spellsByLevel[level] && spellsByLevel[level].length < 10) {
      spellsByLevel[level].push(spell.name);
    }
  });

  // Fill spell fields
  let fieldIndex = 1014;
  for (let level = 0; level <= 9; level++) {
    const levelSpells = spellsByLevel[level.toString()];
    for (let i = 0; i < 10; i++) {
      const fieldName = `Spells ${fieldIndex}`;
      data[fieldName] = levelSpells[i] ? truncate(levelSpells[i], 255) : '';
      fieldIndex++;
    }
  }

  return data;
}
