import { useState, useMemo, useRef } from 'react';
import { Download, Edit2, Save, X, Heart, Shield, Sword, ChevronDown, Upload, Dice5 } from 'lucide-react';
import SpellEntry from '../components/SpellEntry';
import { RollHistoryPanel } from '../components/RollHistoryPanel';
import type { RollResult, SharedRollResult } from '../utils/diceRoller';
import { useSharedRolls } from '../hooks/useSharedRolls';
import {
  rollAbilityCheck,
  rollSavingThrow,
  rollSkillCheck,
  rollAttack,
  rollDamage,
  rollHealing,
  calculateAbilityModifier,
  calculateProficiencyBonus,
  calculateSpellSaveDC,
  calculateSpellAttackBonus,
  formatSpellBonus,
} from '../utils/diceRoller';
import { getSpellAttackType, hasVariableDamage, detectHealingSpell, getHealingSpell, extractHealingFormulaFromDescription } from '../utils/spellAttackConfig';
import { getBonusDamageFeatures, type BonusDamageFeature } from '../utils/bonusDamageFeatures';

// D&D 5e Calculation Utilities
const calculateModifier = (abilityScore: number): number => {
  return Math.floor((abilityScore - 10) / 2);
};

const calculateProficiencyBonusFromLevel = (level: string): number => {
  const levelNum = parseInt(level);
  if (!levelNum) return 2;
  if (levelNum <= 4) return 2;
  if (levelNum <= 8) return 3;
  if (levelNum <= 12) return 4;
  if (levelNum <= 16) return 5;
  return 6;
};

const calculateTotalLevel = (character: CharacterData): number => {
  if (character.classes && Array.isArray(character.classes) && character.classes.length > 0) {
    return character.classes.reduce((sum, cls) => sum + cls.level, 0);
  }
  // Fallback for old single-class format
  return parseInt(character.level) || 1;
};

const normalizeCharacterData = (character: CharacterData): CharacterData => {
  // If we don't have classes array yet, create it from old fields
  if (!character.classes || character.classes.length === 0) {
    const level = parseInt(character.level) || 1;
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

const getClassDisplayText = (character: CharacterData): string => {
  if (character.classes && character.classes.length > 0) {
    const text = character.classes
      .map(cls => `${cls.name}${cls.subclass ? ` (${cls.subclass})` : ''} ${cls.level}`)
      .join(' / ');
    // Allow empty display when user cleared the field (single class with empty name)
    if (character.classes.length === 1 && !character.classes[0].name.trim()) return '';
    return text;
  }
  // Fallback for old format
  return `${character.class ?? ''}${character.subclass ? ` (${character.subclass})` : ''}`.trim() || '';
};

/**
 * Parse a full class display string into an array of class entries.
 * e.g. "Sorcerer (Divine Soul) 2 / Cleric (Order Domain) 1" -> [{ name, subclass, level }, ...]
 */
function parseClassDisplayString(str: string): { name: string; subclass: string; level: number }[] {
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



const getAbilityModifier = (character: CharacterData, abilityKey: 'strength' | 'dexterity' | 'constitution' | 'intelligence' | 'wisdom' | 'charisma'): string => {
  const scoreStr = character[abilityKey];
  const score = parseInt(scoreStr) || 0;
  const mod = calculateModifier(score);
  return mod >= 0 ? `+${mod}` : `${mod}`;
};

/**
 * Get the ability score for spellcasting based on spellcastingAbility
 */
const getSpellcastingAbilityScore = (character: CharacterData): number => {
  const ability = character.spellcastingAbility.toLowerCase().trim();
  switch (ability) {
    case 'str':
      return parseInt(character.strength) || 10;
    case 'dex':
      return parseInt(character.dexterity) || 10;
    case 'con':
      return parseInt(character.constitution) || 10;
    case 'int':
      return parseInt(character.intelligence) || 10;
    case 'wis':
      return parseInt(character.wisdom) || 10;
    case 'cha':
      return parseInt(character.charisma) || 10;
    default:
      return 10;
  }
};

interface Feature {
  name: string;
  description: string;
  category?: string; // 'racial', 'class', 'background', 'feat', etc.
}

interface CharacterClass {
  name: string;
  subclass: string;
  level: number;
  description?: string;
}

interface CharacterData {
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
  proficiencyBonus: string;
  personalityTraits: string;
  ideals: string;
  bonds: string;
  flaws: string;
  features: Feature[];
  featuresAndTraits: string; // Legacy field for backward compatibility
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
    level: string; // "0"
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
    attackType?: 'attack' | 'save' | 'auto-hit' | 'none'; // How the spell is resolved
    altDamage?: string; // Alternative damage for variable dice (e.g., for Toll the Dead)
  }>;
  spells: Array<{
    name: string;
    level: string; // "1"-"9"
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
    attackType?: 'attack' | 'save' | 'auto-hit' | 'none'; // How the spell is resolved
    altDamage?: string; // Alternative damage for variable dice
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

interface CharacterSheetProps {
  character: CharacterData;
  onBack?: () => void;
}

const skillToAbility: Record<string, string> = {
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

export default function CharacterSheet({ character: initialCharacter, onBack }: CharacterSheetProps) {
  const [character, setCharacter] = useState<CharacterData>(normalizeCharacterData(initialCharacter));
  const [isEditing, setIsEditing] = useState(false);
  const [hpAdjustAmount, setHpAdjustAmount] = useState<string>('');
  const [editingTempHp, setEditingTempHp] = useState(false);
  const [activeTab, setActiveTab] = useState<'actions' | 'spells' | 'inventory' | 'features' | 'background'>('actions');
  const [expandedFeatures, setExpandedFeatures] = useState<{ [key: string | number]: boolean }>({});
  const [pdfVersion, setPdfVersion] = useState<'2024' | 'original'>('2024');
  const [rollHistory, setRollHistory] = useState<RollResult[]>([]);
  const [historyMinimized, setHistoryMinimized] = useState(true);
  const { sharedRolls, submitRoll } = useSharedRolls();

  // Combine local rolls with shared rolls from other users
  const combinedRolls = useMemo(() => {
    const localIds = new Set(rollHistory.map(r => r.id));
    const remoteRolls = sharedRolls
      .filter(r => !localIds.has(r.id))
      .map(r => ({
        ...r,
        timestamp: new Date(r.timestamp),
        isRemote: true as const,
      }));
    const localRolls = rollHistory.map(r => ({
      ...r,
      characterName: character.characterName || 'Unknown',
      isRemote: false as const,
    }));
    return [...localRolls, ...remoteRolls]
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 100);
  }, [rollHistory, sharedRolls, character.characterName]);
  const [openSmitePicker, setOpenSmitePicker] = useState<string | null>(null); // tracks which picker is open: "featureName-weaponIdx"

  // Bonus damage features for weapon cards
  const bonusDamageFeatures = useMemo(() => {
    const primaryClassName = character.classes && character.classes.length > 0
      ? character.classes[0].name
      : character.class || '';
    const totalLevel = calculateTotalLevel(character);
    return getBonusDamageFeatures(primaryClassName, totalLevel.toString(), character.features, character.race);
  }, [character.classes, character.class, character.features, character.race]);

  // Calculate derived values
  const proficiencyBonus = useMemo(() => {
    const totalLevel = calculateTotalLevel(character);
    return calculateProficiencyBonus(totalLevel);
  }, [character.classes, character.level]);

  const abilityModifiers = useMemo(() => ({
    strength: calculateModifier(parseInt(character.strength) || 0),
    dexterity: calculateModifier(parseInt(character.dexterity) || 0),
    constitution: calculateModifier(parseInt(character.constitution) || 0),
    intelligence: calculateModifier(parseInt(character.intelligence) || 0),
    wisdom: calculateModifier(parseInt(character.wisdom) || 0),
    charisma: calculateModifier(parseInt(character.charisma) || 0),
  }), [character.strength, character.dexterity, character.constitution, character.intelligence, character.wisdom, character.charisma]);

  // Calculate initiative from DEX modifier
  const calculatedInitiative = useMemo(() => {
    const dexMod = abilityModifiers.dexterity;
    return dexMod >= 0 ? `+${dexMod}` : `${dexMod}`;
  }, [abilityModifiers.dexterity]);

  const handleCharacterChange = (key: keyof CharacterData, value: any) => {
    setCharacter((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSkillChange = (skillName: string, proficient: boolean) => {
    setCharacter((prev) => ({
      ...prev,
      skills: {
        ...prev.skills,
        [skillName]: {
          ...prev.skills[skillName],
          proficient,
        },
      },
    }));
  };

  const handleSkillValueChange = (skillName: string, value: string) => {
    setCharacter((prev) => ({
      ...prev,
      skills: {
        ...prev.skills,
        [skillName]: {
          ...prev.skills[skillName],
          value,
        },
      },
    }));
  };

  const handleSavingThrowChange = (name: string, proficient: boolean) => {
    setCharacter((prev) => ({
      ...prev,
      savingThrows: {
        ...prev.savingThrows,
        [name]: {
          ...prev.savingThrows[name],
          proficient,
        },
      },
    }));
  };

  const handleSavingThrowValueChange = (name: string, value: string) => {
    setCharacter((prev) => ({
      ...prev,
      savingThrows: {
        ...prev.savingThrows,
        [name]: {
          ...prev.savingThrows[name],
          value,
        },
      },
    }));
  };

  const handleAttackChange = (index: number, key: 'name' | 'atkBonus' | 'damage', value: string) => {
    const newAttacks = [...character.attacks];
    newAttacks[index] = {
      ...newAttacks[index],
      [key]: value,
    };
    handleCharacterChange('attacks', newAttacks);
  };

  const handleSpellChange = (index: number, key: keyof CharacterData['spells'][0], value: string) => {
    const newSpells = [...character.spells];
    newSpells[index] = {
      ...newSpells[index],
      [key]: value,
    };
    handleCharacterChange('spells', newSpells);
  };

  const handleAddSpell = () => {
    const newSpell = {
      name: 'New Spell',
      level: '0',
      school: '',
      castingTime: '1 action',
      range: 'Self',
      duration: 'Instantaneous',
      description: '',
      concentration: false,
      ritual: false,
      components: '',
    };
    handleCharacterChange('spells', [...character.spells, newSpell]);
  };

  const handleDeleteSpell = (index: number) => {
    handleCharacterChange('spells', character.spells.filter((_, i) => i !== index));
  };

  const handleFeatureChange = (index: number, key: 'name' | 'description' | 'category', value: string) => {
    const newFeatures = [...character.features];
    newFeatures[index] = {
      ...newFeatures[index],
      [key]: value,
    };
    handleCharacterChange('features', newFeatures);
  };

  const handleAddFeature = () => {
    const newFeature: Feature = {
      name: 'New Feature',
      description: '',
      category: 'custom',
    };
    handleCharacterChange('features', [...character.features, newFeature]);
  };

  const handleDeleteFeature = (index: number) => {
    handleCharacterChange('features', character.features.filter((_, i) => i !== index));
  };

  const toggleFeatureExpanded = (index: number) => {
    setExpandedFeatures(prev => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  // Cantrip handlers
  const handleAddCantrip = () => {
    const newCantrip = {
      name: 'New Cantrip',
      level: '0',
      school: '',
      castingTime: '1 action',
      range: 'Self',
      duration: 'Instantaneous',
      description: '',
      concentration: false,
      ritual: false,
      components: '',
    };
    handleCharacterChange('cantrips', [...character.cantrips, newCantrip]);
  };

  const handleDeleteCantrip = (index: number) => {
    handleCharacterChange('cantrips', character.cantrips.filter((_, i) => i !== index));
  };

  // Weapon/Attack handlers
  const handleAddAttack = () => {
    const newAttack = {
      name: 'New Weapon',
      atkBonus: '+0',
      damage: '1d4',
    };
    handleCharacterChange('attacks', [...character.attacks, newAttack]);
  };

  const handleDeleteAttack = (index: number) => {
    handleCharacterChange('attacks', character.attacks.filter((_, i) => i !== index));
  };

  // Roll handlers
  const parseModifier = (modString: string): number => {
    const match = modString.match(/([+-]?\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  };

  const handleRollAbilityCheck = (abilityName: string, modifier: string) => {
    const mod = parseModifier(modifier);
    const result = rollAbilityCheck(abilityName, mod);
    addRoll(result);
  };

  const handleRollSavingThrow = (throwName: string, modifier: string) => {
    const mod = parseModifier(modifier);
    const result = rollSavingThrow(throwName, mod);
    addRoll(result);
  };

  const handleRollSkillCheck = (skillName: string, modifier: string) => {
    const mod = parseModifier(modifier);
    const result = rollSkillCheck(skillName, mod);
    addRoll(result);
  };

  const handleRollAttack = (weaponName: string, bonus: string) => {
    const bonus_num = parseModifier(bonus);
    const result = rollAttack(weaponName, bonus_num);
    addRoll(result);
  };

  const handleRollDamage = (weaponName: string, damageFormula: string, diceSides?: number) => {
    const result = rollDamage(weaponName, damageFormula, diceSides);
    addRoll(result);
  };

  const handleRollHealing = (spellName: string, healingFormula: string, applyModifier: boolean) => {
    const abilityMod = applyModifier
      ? calculateModifier(getSpellcastingAbilityScore(character))
      : 0;
    const result = rollHealing(spellName, healingFormula, abilityMod);
    addRoll(result);
  };

  const handleRollBonusDamage = (featureName: string, dice: string) => {
    const result = rollDamage(featureName, dice);
    addRoll(result);
    setOpenSmitePicker(null);
  };

  // HP adjustment handlers
  const handleApplyHealing = () => {
    const amount = parseInt(hpAdjustAmount) || 0;
    if (amount <= 0) return;

    const currentHP = parseInt(character.currentHitPoints) || 0;
    const maxHP = parseInt(character.hitPointMaximum) || 0;

    // Healing cannot exceed max HP
    const newHP = Math.min(currentHP + amount, maxHP);

    handleCharacterChange('currentHitPoints', newHP.toString());
    setHpAdjustAmount(''); // Clear input after applying
  };

  const handleApplyDamage = () => {
    const amount = parseInt(hpAdjustAmount) || 0;
    if (amount <= 0) return;

    let currentHP = parseInt(character.currentHitPoints) || 0;
    let tempHP = parseInt(character.temporaryHitPoints) || 0;

    // DAMAGE LOGIC: Subtract from temp HP first
    if (tempHP > 0) {
      if (tempHP >= amount) {
        // Temp HP absorbs all damage
        tempHP -= amount;
      } else {
        // Temp HP absorbs some, rest goes to current HP
        const overflow = amount - tempHP;
        tempHP = 0;
        currentHP = Math.max(0, currentHP - overflow);
      }
    } else {
      // No temp HP, damage goes to current HP
      currentHP = Math.max(0, currentHP - amount);
    }

    handleCharacterChange('currentHitPoints', currentHP.toString());
    handleCharacterChange('temporaryHitPoints', tempHP.toString());
    setHpAdjustAmount(''); // Clear input after applying
  };

  const addRoll = (roll: RollResult) => {
    setRollHistory(prev => {
      const updated = [roll, ...prev];
      // Keep only last 50 rolls
      return updated.slice(0, 50);
    });
    // Auto-expand history panel when a roll is made
    setHistoryMinimized(false);
    // Post to shared roll store
    submitRoll({
      ...roll,
      characterName: character.characterName || 'Unknown',
      timestamp: roll.timestamp.toISOString(),
    });
  };

  const handleClearHistory = () => {
    setRollHistory([]);
  };

  const exportToPDF = async () => {
    try {
      const { PDFDocument } = await import('pdf-lib');
      const { mapCharacterToPDF, mapCharacterToPDF2024 } = await import('../utils/pdfFieldMapping');

      // Select PDF file and mapping function based on version
      const pdfPath = pdfVersion === '2024'
        ? '/DnD_2024_Character-Sheet - fillable - V2.pdf'
        : '/dnd_character_sheet_fillable.pdf';
      const mappingFunction = pdfVersion === '2024' ? mapCharacterToPDF2024 : mapCharacterToPDF;

      // Load the PDF template
      const pdfResponse = await fetch(pdfPath);
      if (!pdfResponse.ok) {
        throw new Error(`Failed to load PDF template: ${pdfResponse.statusText}`);
      }
      const pdfBytes = await pdfResponse.arrayBuffer();

      // Load PDF document
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const form = pdfDoc.getForm();

      // Map character data to PDF fields
      const pdfData = mappingFunction({ ...character, class: character.class || '' });

      // Define fields that should have smaller font sizes
      const smallFontFields = pdfVersion === '2024'
        ? ['CLASS FEATURES 1', 'CLASS FEATURES 2', 'SPECIES TRAITS', 'FEATS', 'EQUIPMENT', 'PERSONALITY', 'IDEALS', 'BONDS', 'FLAWS']
        : ['Features and Traits', 'Equipment', 'AttacksSpellcasting', 'Backstory'];

      // Fill form fields
      Object.entries(pdfData).forEach(([fieldName, value]) => {
        try {
          if (value === undefined || value === null) return;

          // Try to get the field from the form
          const field = form.getFields().find((f) => f.getName() === fieldName);
          if (!field) return;

          // Handle different field types
          if (typeof value === 'boolean') {
            // Checkbox field
            const checkBox = form.getCheckBox(fieldName);
            if (value) {
              checkBox.check();
            } else {
              checkBox.uncheck();
            }
          } else {
            // Text field
            try {
              const textField = form.getTextField(fieldName);
              textField.setText(String(value));

              // Reduce font size for large text fields to fit more content
              if (smallFontFields.includes(fieldName)) {
                textField.setFontSize(8);
              }
            } catch {
              // Field might be a dropdown or other type, skip
            }
          }
        } catch (error) {
          // Field doesn't exist or wrong type, continue
        }
      });

      // Flatten the form to prevent further editing
      // form.flatten();

      // Save and download
      const pdfBytes2 = await pdfDoc.save();
      const blob = new Blob([new Uint8Array(pdfBytes2)], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      // Create download link
      const link = document.createElement('a');
      link.href = url;
      const versionSuffix = pdfVersion === '2024' ? '_2024' : '';
      link.download = `${character.characterName}_D&D_Sheet${versionSuffix}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert(`Failed to export PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const sortedSkills = useMemo(() => {
    return Object.entries(character.skills).sort(([a], [b]) => a.localeCompare(b));
  }, [character.skills]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const exportToJSON = () => {
    try {
      const dataStr = JSON.stringify(character, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `${character.characterName}_character_data.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting JSON:', error);
      alert(`Failed to export character data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const importFromJSON = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonData = JSON.parse(e.target?.result as string);

        // Validate that it's a valid character data object
        if (!jsonData.characterName) {
          throw new Error('Invalid character data: missing characterName field');
        }

        // Set the character data
        setCharacter(jsonData as CharacterData);
        alert(`Successfully imported character: ${jsonData.characterName}`);
      } catch (error) {
        console.error('Error importing JSON:', error);
        alert(`Failed to import character data: ${error instanceof Error ? error.message : 'Invalid JSON file'}`);
      }
    };
    reader.readAsText(file);

    // Reset file input so the same file can be imported again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b shadow-sm top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-start justify-between mb-0">
            <div>
              {isEditing ? (
                <input
                  type="text"
                  value={character.characterName}
                  onChange={(e) => handleCharacterChange('characterName', e.target.value)}
                  className="text-3xl font-bold text-gray-900 mb-1 bg-white border-2 border-blue-400 rounded px-2 py-1 w-full"
                  placeholder="Character Name"
                />
              ) : (
                <h1 className="text-3xl font-bold text-gray-900 mb-1">{character.characterName}</h1>
              )}
              {isEditing ? (
                <div className="space-y-2">
                  <div className="flex gap-2 flex-wrap text-sm">
                    <div className="flex-1 min-w-48">
                      <label className="text-xs text-gray-600 block mb-1">Race</label>
                      <input
                        type="text"
                        value={character.race}
                        onChange={(e) => handleCharacterChange('race', e.target.value)}
                        className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-sm font-medium"
                        placeholder="Race"
                      />
                    </div>
                    <div className="flex-1 min-w-48">
                      <label className="text-xs text-gray-600 block mb-1">Class</label>
                      <input
                        type="text"
                        value={getClassDisplayText(character)}
                        onChange={(e) => {
                          const raw = e.target.value;
                          const parsed = parseClassDisplayString(raw);
                          if (parsed.length === 0) {
                            setCharacter({
                              ...character,
                              classes: [{ name: '', subclass: '', level: 1, description: character.classes?.[0]?.description ?? '' }],
                            });
                            return;
                          }
                          const newClasses = parsed.map((p, i) => ({
                            ...p,
                            description: character.classes?.[i]?.description ?? '',
                          }));
                          setCharacter({ ...character, classes: newClasses });
                        }}
                        className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-sm font-medium"
                        placeholder="e.g. Fighter 3 or Wizard (Evocation) 2 / Fighter 1"
                      />
                    </div>
                    <div className="flex-1 min-w-48">
                      <label className="text-xs text-gray-600 block mb-1">Background</label>
                      <input
                        type="text"
                        value={character.background}
                        onChange={(e) => handleCharacterChange('background', e.target.value)}
                        className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-sm font-medium"
                        placeholder="Background"
                      />
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">Level {calculateTotalLevel(character)}</div>
                </div>
              ) : (
                <div className="text-sm text-gray-600">
                  <span className="font-medium">{character.race}</span>
                  {' • '}
                  <span className="font-medium">{getClassDisplayText(character)}</span>
                  {' • '}
                  <span>Level {calculateTotalLevel(character)}</span>
                  {' • '}
                  <span>{character.background}</span>
                </div>
              )}
              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                {isEditing ? (
                  <>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium transition-colors"
                    >
                      <Save size={16} className="inline mr-1" />
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setCharacter(initialCharacter);
                        setIsEditing(false);
                      }}
                      className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-md text-sm font-medium transition-colors"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors"
                    >
                      <Edit2 size={16} className="inline mr-1" />
                      Edit Character
                    </button>
                    <div className="flex items-center gap-2">
                      <select
                        value={pdfVersion}
                        onChange={(e) => setPdfVersion(e.target.value as '2024' | 'original')}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium bg-white text-gray-700"
                      >
                        <option value="2024">2024 Edition (Default)</option>
                        <option value="original">Original Edition</option>
                      </select>
                      <button onClick={exportToPDF} className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md text-sm font-medium transition-colors">
                        <Download size={16} className="inline mr-1" />
                        PDF
                      </button>
                      <button onClick={exportToJSON} className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md text-sm font-medium transition-colors">
                        <Download size={16} className="inline mr-1" />
                        JSON
                      </button>
                      <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md text-sm font-medium transition-colors">
                        <Upload size={16} className="inline mr-1" />
                        JSON
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".json"
                        onChange={importFromJSON}
                        className="hidden"
                      />
                    </div>
                    {onBack && (
                      <button
                        onClick={onBack}
                        className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-md text-sm font-medium transition-colors ml-auto"
                      >
                        <X size={16} className="inline mr-1" />
                        Back
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Top Right Stats - HP, AC, Initiative */}
            <div className="flex items-center gap-3">
              {/* HP */}
              <div className="bg-red-50 border-2 border-red-400 rounded-lg px-3 py-2">
                {isEditing ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 mb-1">
                      <Heart className="text-red-500" size={16} />
                      <span className="text-xs font-bold text-red-700 uppercase">Hit Points</span>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <input
                        type="text"
                        value={character.currentHitPoints}
                        onChange={(e) => handleCharacterChange('currentHitPoints', e.target.value)}
                        className="w-12 text-2xl font-bold text-red-600 bg-white border border-red-300 rounded px-1 text-center"
                      />
                      <span className="text-gray-400">/</span>
                      <input
                        type="text"
                        value={character.hitPointMaximum}
                        onChange={(e) => handleCharacterChange('hitPointMaximum', e.target.value)}
                        className="w-12 text-lg text-gray-600 bg-white border border-red-300 rounded px-1 text-center"
                      />
                    </div>
                    <div className="flex items-center justify-center gap-1 text-xs">
                      <Shield className="text-blue-500" size={12} />
                      <input
                        type="text"
                        value={character.temporaryHitPoints}
                        onChange={(e) => handleCharacterChange('temporaryHitPoints', e.target.value)}
                        className="w-12 text-xs text-blue-600 bg-white border border-blue-300 rounded px-1 text-center"
                        placeholder="0"
                      />
                      <span className="text-gray-500">temp HP</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    {/* Column 1: Heal / Amount / Damage stacked vertically */}
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={handleApplyHealing}
                        disabled={!hpAdjustAmount || parseInt(hpAdjustAmount) <= 0}
                        className="px-3 py-1 text-xs bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded transition-colors font-medium uppercase"
                        title="Apply healing"
                      >
                        Heal
                      </button>
                      <input
                        type="number"
                        value={hpAdjustAmount}
                        onChange={(e) => setHpAdjustAmount(e.target.value)}
                        placeholder=""
                        min="0"
                        className="w-16 text-xs text-center bg-white border border-red-300 rounded px-1 py-1"
                      />
                      <button
                        onClick={handleApplyDamage}
                        disabled={!hpAdjustAmount || parseInt(hpAdjustAmount) <= 0}
                        className="px-3 py-1 text-xs bg-red-500 hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded transition-colors font-medium uppercase"
                        title="Apply damage"
                      >
                        Damage
                      </button>
                    </div>

                    {/* Column 2: Current / Max + HIT POINTS label */}
                    <div className="flex-1 text-center">
                      <div className="flex items-baseline justify-center gap-3">
                        <div className="text-center">
                          <div className="text-[10px] uppercase text-gray-400 font-semibold tracking-wide">Current</div>
                          <span className="text-3xl font-bold text-red-600">{character.currentHitPoints}</span>
                        </div>
                        <span className="text-gray-400 text-xl font-light">/</span>
                        <div className="text-center">
                          <div className="text-[10px] uppercase text-gray-400 font-semibold tracking-wide">Max</div>
                          <span className="text-2xl font-bold text-gray-600">{character.hitPointMaximum}</span>
                        </div>
                      </div>
                      <div className="text-xs font-bold text-red-700 uppercase tracking-wide mt-0.5">Hit Points</div>
                    </div>

                    {/* Column 3: Temp HP (click to edit) */}
                    <div className="text-center px-2">
                      <div className="text-[10px] uppercase text-gray-400 font-semibold tracking-wide">Temp</div>
                      {editingTempHp ? (
                        <input
                          type="number"
                          value={character.temporaryHitPoints}
                          onChange={(e) => handleCharacterChange('temporaryHitPoints', e.target.value)}
                          onBlur={() => setEditingTempHp(false)}
                          onKeyDown={(e) => { if (e.key === 'Enter') setEditingTempHp(false); }}
                          autoFocus
                          min="0"
                          className="w-12 text-lg text-blue-600 font-medium bg-white border border-blue-300 rounded px-1 text-center"
                        />
                      ) : (
                        <div
                          onClick={() => setEditingTempHp(true)}
                          className="text-lg text-blue-600 font-medium cursor-pointer hover:bg-blue-100 rounded px-1 transition-colors"
                          title="Click to set temp HP"
                        >
                          {parseInt(character.temporaryHitPoints || '0') > 0 ? (
                            <>{character.temporaryHitPoints}</>
                          ) : (
                            <span className="text-gray-400">--</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* AC */}
              <div className="bg-blue-50 border-2 border-blue-400 rounded-lg px-4 py-2 text-center min-w-24">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Shield className="text-blue-600" size={14} />
                  <span className="text-xs font-bold text-blue-700 uppercase">AC</span>
                </div>
                {isEditing ? (
                  <input
                    type="text"
                    value={character.armorClass}
                    onChange={(e) => handleCharacterChange('armorClass', e.target.value)}
                    className="w-full text-2xl font-bold text-blue-600 bg-white border border-blue-300 rounded px-1 text-center"
                  />
                ) : (
                  <div className="text-3xl font-bold text-blue-600">{character.armorClass}</div>
                )}
              </div>

              {/* Initiative */}
              <div className="bg-green-50 border-2 border-green-400 rounded-lg px-4 py-2 text-center min-w-24 group">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Sword className="text-green-600" size={14} />
                  <span className="text-xs font-bold text-green-700 uppercase">Init</span>
                </div>
                {isEditing ? (
                  <input
                    type="text"
                    value={character.initiative}
                    onChange={(e) => handleCharacterChange('initiative', e.target.value)}
                    className="w-full text-2xl font-bold text-green-600 bg-white border border-green-300 rounded px-1 text-center"
                    placeholder={calculatedInitiative}
                  />
                ) : (
                  <div className="relative">
                    <div className="flex items-center justify-center gap-2">
                      <div className="text-3xl font-bold text-green-600">
                        {calculatedInitiative}
                      </div>
                      <button
                        onClick={() => {
                          const mod = abilityModifiers.dexterity;
                          const result = rollAbilityCheck("Initiative", mod);
                          addRoll(result);
                        }}
                        className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-green-100 text-green-600 hover:text-green-700 transition-all flex-shrink-0"
                        title="Roll Initiative"
                      >
                        <Dice5 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Left Column - Ability Scores & Stats */}
          <div className="col-span-3 space-y-4">
            {/* Ability Scores */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h3 className="text-sm font-bold text-gray-700 uppercase mb-3">Ability Scores</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { name: 'STR', score: character.strength, mod: abilityModifiers.strength, key: 'strength' },
                  { name: 'DEX', score: character.dexterity, mod: abilityModifiers.dexterity, key: 'dexterity' },
                  { name: 'CON', score: character.constitution, mod: abilityModifiers.constitution, key: 'constitution' },
                  { name: 'INT', score: character.intelligence, mod: abilityModifiers.intelligence, key: 'intelligence' },
                  { name: 'WIS', score: character.wisdom, mod: abilityModifiers.wisdom, key: 'wisdom' },
                  { name: 'CHA', score: character.charisma, mod: abilityModifiers.charisma, key: 'charisma' }
                ].map((ability) => (
                  <div key={ability.name} className="bg-gray-50 rounded-lg p-3 text-center border border-gray-200 group">
                    <div className="text-xs font-bold text-gray-600 mb-1">{ability.name}</div>
                    {isEditing ? (
                      <>
                        <div className="text-sm text-gray-600 mb-1">Mod: {ability.mod >= 0 ? '+' : ''}{ability.mod}</div>
                        <input
                          type="number"
                          value={ability.score}
                          onChange={(e) => handleCharacterChange(ability.key as keyof CharacterData, e.target.value)}
                          className="w-full text-2xl font-bold text-gray-900 bg-white border border-gray-300 rounded px-1 text-center"
                        />
                      </>
                    ) : (
                      <>
                        <div className="flex items-center justify-center gap-1">
                          <div className="text-2xl font-bold text-gray-900">{ability.mod >= 0 ? '+' : ''}{ability.mod}</div>
                          <button
                            onClick={() => handleRollAbilityCheck(ability.name, `${ability.mod >= 0 ? '+' : ''}${ability.mod}`)}
                            className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-blue-100 text-blue-600 hover:text-blue-700 transition-all flex-shrink-0"
                            title={`Roll ${ability.name} Check`}
                          >
                            <Dice5 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="text-sm text-gray-500">{ability.score}</div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Proficiency & Speed */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">Proficiency Bonus</span>
                  <span className="text-lg font-bold text-gray-900">+{proficiencyBonus}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">Speed</span>
                  <span className="text-lg font-bold text-gray-900">{character.speed}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">Hit Dice</span>
                  <span className="text-lg font-bold text-gray-900">{character.hitDice}</span>
                </div>
                <div className="border-t border-gray-200 pt-3">
                  <div className="text-xs font-bold text-gray-600 uppercase mb-2">Passive Senses</div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Perception</span>
                      <span className="text-sm font-bold text-gray-900">
                        {10 + parseModifier(character.skills?.perception?.value || '+0')}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Investigation</span>
                      <span className="text-sm font-bold text-gray-900">
                        {10 + parseModifier(character.skills?.investigation?.value || '+0')}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Insight</span>
                      <span className="text-sm font-bold text-gray-900">
                        {10 + parseModifier(character.skills?.insight?.value || '+0')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>


          </div>
          {/*Center Column - Skills*/}
          <div className="col-span-3 space-y-4">

            {/* Skills */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h3 className="text-sm font-bold text-gray-700 uppercase mb-3">Skills</h3>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {sortedSkills.map(([skillName, skillData]) => (
                  <div key={skillName} className="flex items-center gap-2 group">
                    <input
                      type="checkbox"
                      checked={skillData.proficient}
                      onChange={(e) => handleSkillChange(skillName, e.target.checked)}
                      disabled={!isEditing}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="text-sm flex-1 text-gray-700">
                      {skillName.replace(/([A-Z])/g, ' $1').trim()}
                      <span className="text-xs text-gray-500 ml-1">({skillToAbility[skillName]})</span>
                    </span>
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{skillData.value}</span>
                      {!isEditing && (
                        <button
                          onClick={() => handleRollSkillCheck(skillName.replace(/([A-Z])/g, ' $1').trim(), skillData.value)}
                          className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-blue-100 text-blue-600 hover:text-blue-700 transition-all flex-shrink-0"
                          title={`Roll ${skillName.replace(/([A-Z])/g, ' $1').trim()} Check`}
                        >
                          <Dice5 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Saving Throws */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h3 className="text-sm font-bold text-gray-700 uppercase mb-3">Saving Throws</h3>
              <div className="space-y-2">
                {Object.entries(character.savingThrows).map(([name, data]) => (
                  <div key={name} className="flex items-center gap-2 group">
                    <input
                      type="checkbox"
                      checked={data.proficient}
                      onChange={(e) => handleSavingThrowChange(name, e.target.checked)}
                      disabled={!isEditing}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="text-sm font-medium text-gray-900 flex-1 capitalize">
                      {name}
                    </span>
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{data.value}</span>
                      {!isEditing && (
                        <button
                          onClick={() => handleRollSavingThrow(name, data.value)}
                          className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-blue-100 text-blue-600 hover:text-blue-700 transition-all flex-shrink-0"
                          title={`Roll ${name.charAt(0).toUpperCase() + name.slice(1)} Save`}
                        >
                          <Dice5 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {/* Right Column - Actions & Content */}
          <div className="col-span-6 space-y-4">
            {/* Tabs */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="border-b border-gray-200">
                <div className="flex">
                  {(['actions', 'spells', 'inventory', 'features', 'background'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-6 py-3 text-sm font-medium capitalize transition-colors ${activeTab === tab
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-6">
                {/* Actions Tab */}
                {activeTab === 'actions' && (
                  <div className="space-y-6">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-gray-900">Weapons & Attacks</h3>
                        {isEditing && (
                          <button
                            onClick={handleAddAttack}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium transition-colors"
                          >
                            + Add Weapon
                          </button>
                        )}
                      </div>
                      {character.attacks.length > 0 ? (
                        <div className="space-y-3">
                          {character.attacks.map((attack, idx) => (
                            <div key={idx} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                              <div className="flex items-center justify-between mb-2">
                                {isEditing ? (
                                  <input
                                    type="text"
                                    value={attack.name}
                                    onChange={(e) => handleAttackChange(idx, 'name', e.target.value)}
                                    className="flex-1 font-bold text-gray-900 bg-white border border-gray-300 rounded px-2 py-1"
                                  />
                                ) : (
                                  <span className="font-bold text-gray-900">{attack.name}</span>
                                )}
                                {isEditing ? (
                                  <>
                                    <input
                                      type="text"
                                      value={attack.atkBonus}
                                      onChange={(e) => handleAttackChange(idx, 'atkBonus', e.target.value)}
                                      className="w-20 text-sm font-medium text-blue-600 bg-white border border-gray-300 rounded px-2 py-1 ml-2"
                                    />
                                    <button
                                      onClick={() => handleDeleteAttack(idx)}
                                      className="text-red-600 hover:text-red-700 ml-2"
                                      title="Delete weapon"
                                    >
                                      <X size={16} />
                                    </button>
                                  </>
                                ) : (
                                  <div className="flex items-center gap-1 group">
                                    <span className="text-sm font-medium text-blue-600 group-hover:text-blue-700 transition-colors">{attack.atkBonus} to hit</span>
                                    <button
                                      onClick={() => handleRollAttack(attack.name, attack.atkBonus)}
                                      className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-blue-100 text-blue-600 hover:text-blue-700 transition-all flex-shrink-0"
                                      title={`Roll ${attack.name} Attack`}
                                    >
                                      <Dice5 className="w-4 h-4" />
                                    </button>
                                  </div>
                                )}
                              </div>
                              {isEditing ? (
                                <input
                                  type="text"
                                  value={attack.damage}
                                  onChange={(e) => handleAttackChange(idx, 'damage', e.target.value)}
                                  className="w-full text-sm text-gray-600 bg-white border border-gray-300 rounded px-2 py-1"
                                />
                              ) : (
                                <div className="flex items-center gap-1 group">
                                  <div className="text-sm text-gray-600 group-hover:text-gray-700 transition-colors flex-1">{attack.damage}</div>
                                  <button
                                    onClick={() => handleRollDamage(attack.name, attack.damage)}
                                    className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-blue-100 text-blue-600 hover:text-blue-700 transition-all flex-shrink-0"
                                    title={`Roll ${attack.name} Damage`}
                                  >
                                    <Dice5 className="w-4 h-4" />
                                  </button>
                                </div>
                              )}
                              {/* Bonus Damage Feature Buttons */}
                              {!isEditing && bonusDamageFeatures.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mt-2 pt-2 border-t border-gray-200">
                                  {bonusDamageFeatures.map((feature, fIdx) => {
                                    const pickerKey = `${feature.name}-${idx}`;
                                    const isPickerOpen = openSmitePicker === pickerKey;

                                    // Picker-style feature (Divine Smite, Eldritch Smite)
                                    if (feature.options) {
                                      return (
                                        <div key={fIdx} className="relative">
                                          <button
                                            onClick={() => setOpenSmitePicker(isPickerOpen ? null : pickerKey)}
                                            className="px-2 py-1 text-xs bg-purple-600 hover:bg-purple-700 text-white rounded transition-colors flex items-center gap-1"
                                            title={feature.condition}
                                          >
                                            <span>{feature.label}</span>
                                            <ChevronDown className={`w-3 h-3 transition-transform ${isPickerOpen ? 'rotate-180' : ''}`} />
                                          </button>
                                          {isPickerOpen && (
                                            <div className="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[160px]">
                                              {feature.options.map((opt, oIdx) => (
                                                <button
                                                  key={oIdx}
                                                  onClick={() => handleRollBonusDamage(feature.name, opt.dice)}
                                                  className="w-full text-left px-3 py-1.5 text-xs hover:bg-purple-50 text-gray-700 hover:text-purple-700 transition-colors first:rounded-t-lg last:rounded-b-lg flex items-center justify-between gap-2"
                                                >
                                                  <span>{opt.label}</span>
                                                  <Dice5 className="w-3 h-3 text-purple-500" />
                                                </button>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                      );
                                    }

                                    // Simple feature (Sneak Attack, Colossus Slayer, etc.)
                                    return (
                                      <button
                                        key={fIdx}
                                        onClick={() => handleRollBonusDamage(feature.name, feature.dice!)}
                                        className={`px-2 py-1 text-xs text-white rounded transition-colors flex items-center gap-1 ${feature.critOnly
                                          ? 'bg-red-600 hover:bg-red-700'
                                          : 'bg-purple-600 hover:bg-purple-700'
                                          }`}
                                        title={feature.condition}
                                      >
                                        <span>{feature.label}</span>
                                        <Dice5 className="w-3 h-3" />
                                      </button>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-sm">No weapons listed</p>
                      )}
                    </div>

                    {(character.cantrips && character.cantrips.length > 0) || isEditing ? (
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-bold text-gray-900">Cantrips</h3>
                          {isEditing && (
                            <button
                              onClick={handleAddCantrip}
                              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium transition-colors"
                            >
                              + Add Cantrip
                            </button>
                          )}
                        </div>
                        {isEditing ? (
                          <div className="space-y-3">
                            {character.cantrips.map((cantrip, idx) => (
                              <div key={idx} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex-1">
                                    <input
                                      type="text"
                                      value={cantrip.name}
                                      onChange={(e) => {
                                        const newCantrips = [...character.cantrips];
                                        newCantrips[idx] = { ...newCantrips[idx], name: e.target.value };
                                        handleCharacterChange('cantrips', newCantrips);
                                      }}
                                      className="w-full font-bold text-gray-900 bg-white border border-gray-300 rounded px-2 py-1 mb-1"
                                    />
                                    <div className="text-xs text-gray-500">
                                      <input
                                        type="text"
                                        value={cantrip.school}
                                        onChange={(e) => {
                                          const newCantrips = [...character.cantrips];
                                          newCantrips[idx] = { ...newCantrips[idx], school: e.target.value };
                                          handleCharacterChange('cantrips', newCantrips);
                                        }}
                                        placeholder="School"
                                        className="w-full bg-white border border-gray-300 rounded px-1 py-0.5 mt-1"
                                      />
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => handleDeleteCantrip(idx)}
                                    className="text-red-600 hover:text-red-700 ml-2"
                                  >
                                    <X size={16} />
                                  </button>
                                </div>
                                <div className="space-y-1 text-xs mb-2">
                                  <input
                                    type="text"
                                    value={cantrip.castingTime}
                                    onChange={(e) => {
                                      const newCantrips = [...character.cantrips];
                                      newCantrips[idx] = { ...newCantrips[idx], castingTime: e.target.value };
                                      handleCharacterChange('cantrips', newCantrips);
                                    }}
                                    placeholder="Casting Time"
                                    className="w-full bg-white border border-gray-300 rounded px-1 py-0.5"
                                  />
                                  <input
                                    type="text"
                                    value={cantrip.range}
                                    onChange={(e) => {
                                      const newCantrips = [...character.cantrips];
                                      newCantrips[idx] = { ...newCantrips[idx], range: e.target.value };
                                      handleCharacterChange('cantrips', newCantrips);
                                    }}
                                    placeholder="Range"
                                    className="w-full bg-white border border-gray-300 rounded px-1 py-0.5"
                                  />
                                  <input
                                    type="text"
                                    value={cantrip.duration}
                                    onChange={(e) => {
                                      const newCantrips = [...character.cantrips];
                                      newCantrips[idx] = { ...newCantrips[idx], duration: e.target.value };
                                      handleCharacterChange('cantrips', newCantrips);
                                    }}
                                    placeholder="Duration"
                                    className="w-full bg-white border border-gray-300 rounded px-1 py-0.5"
                                  />
                                  <input
                                    type="text"
                                    value={cantrip.damage || ''}
                                    onChange={(e) => {
                                      const newCantrips = [...character.cantrips];
                                      newCantrips[idx] = { ...newCantrips[idx], damage: e.target.value };
                                      handleCharacterChange('cantrips', newCantrips);
                                    }}
                                    placeholder="Damage (e.g., 1d8 fire)"
                                    className="w-full bg-white border border-gray-300 rounded px-1 py-0.5"
                                  />
                                  <input
                                    type="text"
                                    value={cantrip.saveDC || ''}
                                    onChange={(e) => {
                                      const newCantrips = [...character.cantrips];
                                      newCantrips[idx] = { ...newCantrips[idx], saveDC: e.target.value };
                                      handleCharacterChange('cantrips', newCantrips);
                                    }}
                                    placeholder="Save DC (e.g., DEX 15)"
                                    className="w-full bg-white border border-gray-300 rounded px-1 py-0.5"
                                  />
                                  <input
                                    type="text"
                                    value={cantrip.components || ''}
                                    onChange={(e) => {
                                      const newCantrips = [...character.cantrips];
                                      newCantrips[idx] = { ...newCantrips[idx], components: e.target.value };
                                      handleCharacterChange('cantrips', newCantrips);
                                    }}
                                    placeholder="Components (e.g., V, S, M)"
                                    className="w-full bg-white border border-gray-300 rounded px-1 py-0.5"
                                  />
                                  <div className="flex gap-2">
                                    <label className="flex items-center gap-1 cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={cantrip.concentration || false}
                                        onChange={(e) => {
                                          const newCantrips = [...character.cantrips];
                                          newCantrips[idx] = {
                                            ...newCantrips[idx],
                                            concentration: e.target.checked,
                                          };
                                          handleCharacterChange('cantrips', newCantrips);
                                        }}
                                        className="w-4 h-4"
                                      />
                                      <span className="text-xs">Concentration</span>
                                    </label>
                                    <label className="flex items-center gap-1 cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={cantrip.ritual || false}
                                        onChange={(e) => {
                                          const newCantrips = [...character.cantrips];
                                          newCantrips[idx] = {
                                            ...newCantrips[idx],
                                            ritual: e.target.checked,
                                          };
                                          handleCharacterChange('cantrips', newCantrips);
                                        }}
                                        className="w-4 h-4"
                                      />
                                      <span className="text-xs">Ritual</span>
                                    </label>
                                  </div>
                                </div>
                                <textarea
                                  value={cantrip.description}
                                  onChange={(e) => {
                                    const newCantrips = [...character.cantrips];
                                    newCantrips[idx] = { ...newCantrips[idx], description: e.target.value };
                                    handleCharacterChange('cantrips', newCantrips);
                                  }}
                                  placeholder="Description"
                                  className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-xs min-h-20"
                                />
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {character.cantrips.map((cantrip, idx) => {
                              const attackConfig = getSpellAttackType(cantrip.name);
                              const hasVarDamage = hasVariableDamage(cantrip.name);
                              // Compute altDamage from config if not already set
                              let altDamage: string | undefined = undefined;
                              if (hasVarDamage && attackConfig.variableDamage && attackConfig.variableDamage.length > 1) {
                                altDamage = cantrip.altDamage || `1d${attackConfig.variableDamage[1].diceSides}`;
                              }

                              // Detect healing
                              const healingInfo = detectHealingSpell(cantrip.name, cantrip.description);
                              let healingFormula: string | undefined = undefined;
                              if (healingInfo.isHealing) {
                                const healConfig = getHealingSpell(cantrip.name);
                                healingFormula = (healConfig && healConfig.healingDice !== '0') ? healConfig.healingDice : (extractHealingFormulaFromDescription(cantrip.description) || undefined);
                              }

                              return (
                                <SpellEntry
                                  key={idx}
                                  name={cantrip.name}
                                  level={cantrip.level}
                                  school={cantrip.school}
                                  castingTime={cantrip.castingTime}
                                  range={cantrip.range}
                                  duration={cantrip.duration}
                                  description={cantrip.description}
                                  concentration={cantrip.concentration}
                                  ritual={cantrip.ritual}
                                  components={cantrip.components}
                                  attackType={cantrip.attackType || attackConfig.attackType}
                                  damage={cantrip.damage}
                                  altDamage={altDamage}
                                  spellAttackBonus={character.spellAttackBonus}
                                  spellSaveDC={cantrip.saveDC || character.spellSaveDC}
                                  onRollAttack={handleRollAttack}
                                  onRollDamage={handleRollDamage}
                                  isHealing={healingInfo.isHealing}
                                  healingFormula={healingFormula}
                                  appliesModifier={healingInfo.appliesModifier}
                                  onRollHealing={handleRollHealing}
                                  editable={false}
                                />
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>
                )}

                {/* Spells Tab */}
                {activeTab === 'spells' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold text-gray-900">Spells</h3>
                      <div className="flex items-center gap-4">
                        {isEditing && (
                          <button
                            onClick={handleAddSpell}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium transition-colors"
                          >
                            + Add Spell
                          </button>
                        )}
                        <div className="flex gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Spell Save DC: </span>
                            <span className="font-bold text-gray-900">{character.spellSaveDC}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Spell Attack: </span>
                            <span className="font-bold text-gray-900">{character.spellAttackBonus}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {character.spells.length === 0 ? (
                        <p className="text-gray-500 italic">No spells known</p>
                      ) : (
                        character.spells.map((spell, idx) => (
                          <div key={idx} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                            {isEditing ? (
                              <>
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex-1">
                                    <input
                                      type="text"
                                      value={spell.name}
                                      onChange={(e) => handleSpellChange(idx, 'name', e.target.value)}
                                      className="w-full font-bold text-gray-900 bg-white border border-gray-300 rounded px-2 py-1 mb-1"
                                    />
                                    <div className="text-xs text-gray-500 flex gap-2">
                                      <select
                                        value={spell.level}
                                        onChange={(e) => handleSpellChange(idx, 'level', e.target.value)}
                                        className="bg-white border border-gray-300 rounded px-1"
                                      >
                                        {Array.from({ length: 10 }, (_, i) => (
                                          <option key={i} value={i.toString()}>
                                            Level {i}
                                          </option>
                                        ))}
                                      </select>
                                      <input
                                        type="text"
                                        value={spell.school}
                                        onChange={(e) => handleSpellChange(idx, 'school', e.target.value)}
                                        placeholder="School"
                                        className="flex-1 bg-white border border-gray-300 rounded px-1"
                                      />
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => handleDeleteSpell(idx)}
                                    className="text-red-600 hover:text-red-700 ml-2"
                                  >
                                    <X size={16} />
                                  </button>
                                </div>
                                <div className="space-y-1 text-xs mb-2">
                                  <input
                                    type="text"
                                    value={spell.castingTime}
                                    onChange={(e) => handleSpellChange(idx, 'castingTime', e.target.value)}
                                    placeholder="Casting Time"
                                    className="w-full bg-white border border-gray-300 rounded px-1 py-0.5"
                                  />
                                  <input
                                    type="text"
                                    value={spell.range}
                                    onChange={(e) => handleSpellChange(idx, 'range', e.target.value)}
                                    placeholder="Range"
                                    className="w-full bg-white border border-gray-300 rounded px-1 py-0.5"
                                  />
                                  <input
                                    type="text"
                                    value={spell.duration}
                                    onChange={(e) => handleSpellChange(idx, 'duration', e.target.value)}
                                    placeholder="Duration"
                                    className="w-full bg-white border border-gray-300 rounded px-1 py-0.5"
                                  />
                                  <input
                                    type="text"
                                    value={spell.damage || ''}
                                    onChange={(e) => handleSpellChange(idx, 'damage', e.target.value)}
                                    placeholder="Damage (e.g., 2d6 fire)"
                                    className="w-full bg-white border border-gray-300 rounded px-1 py-0.5"
                                  />
                                  <input
                                    type="text"
                                    value={spell.saveDC || ''}
                                    onChange={(e) => handleSpellChange(idx, 'saveDC', e.target.value)}
                                    placeholder="Save DC (e.g., DEX 15)"
                                    className="w-full bg-white border border-gray-300 rounded px-1 py-0.5"
                                  />
                                  <input
                                    type="text"
                                    value={spell.components || ''}
                                    onChange={(e) => handleSpellChange(idx, 'components', e.target.value)}
                                    placeholder="Components (e.g., V, S, M)"
                                    className="w-full bg-white border border-gray-300 rounded px-1 py-0.5"
                                  />
                                  <div className="flex gap-2">
                                    <label className="flex items-center gap-1 cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={spell.concentration || false}
                                        onChange={(e) => {
                                          const newSpells = [...character.spells];
                                          newSpells[idx] = {
                                            ...newSpells[idx],
                                            concentration: e.target.checked,
                                          };
                                          handleCharacterChange('spells', newSpells);
                                        }}
                                        className="w-4 h-4"
                                      />
                                      <span className="text-xs">Concentration</span>
                                    </label>
                                    <label className="flex items-center gap-1 cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={spell.ritual || false}
                                        onChange={(e) => {
                                          const newSpells = [...character.spells];
                                          newSpells[idx] = {
                                            ...newSpells[idx],
                                            ritual: e.target.checked,
                                          };
                                          handleCharacterChange('spells', newSpells);
                                        }}
                                        className="w-4 h-4"
                                      />
                                      <span className="text-xs">Ritual</span>
                                    </label>
                                  </div>
                                </div>
                                <textarea
                                  value={spell.description}
                                  onChange={(e) => handleSpellChange(idx, 'description', e.target.value)}
                                  placeholder="Description"
                                  className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-xs min-h-20"
                                />
                              </>
                            ) : (
                              <>
                                <div className="flex items-start justify-between mb-2">
                                  <div>
                                    <div className="font-bold text-gray-900">{spell.name}</div>
                                    <div className="text-xs text-gray-500">
                                      Level {spell.level} • {spell.school}
                                    </div>
                                  </div>
                                </div>

                                {/* Attack/Save/Healing Info */}
                                {(() => {
                                  const spellConfig = getSpellAttackType(spell.name);
                                  const attackType = spell.attackType || spellConfig.attackType;
                                  const hasVarDamage = hasVariableDamage(spell.name);
                                  let altDamage: string | undefined = undefined;
                                  if (hasVarDamage && spellConfig.variableDamage && spellConfig.variableDamage.length > 1) {
                                    altDamage = spell.altDamage || `1d${spellConfig.variableDamage[1].diceSides}`;
                                  }

                                  // Detect healing
                                  const healingInfo = detectHealingSpell(spell.name, spell.description);
                                  let healingFormula: string | undefined = undefined;
                                  if (healingInfo.isHealing) {
                                    const healConfig = getHealingSpell(spell.name);
                                    healingFormula = (healConfig && healConfig.healingDice !== '0') ? healConfig.healingDice : (extractHealingFormulaFromDescription(spell.description) || undefined);
                                  }

                                  // Show if spell has damage/saveDC OR is offensive in config
                                  const shouldShow = spell.damage || spell.saveDC || (attackType && attackType !== 'none');

                                  return (
                                    <>
                                      {shouldShow && (
                                        <div className="bg-blue-50 border border-blue-200 rounded p-2 mb-3 space-y-2">
                                          {attackType === 'attack' && character.spellAttackBonus && (
                                            <div className="flex items-center gap-2">
                                              <span className="text-xs font-medium text-blue-700">Spell Attack:</span>
                                              <span className="text-xs font-bold text-blue-900">{character.spellAttackBonus} to hit</span>
                                              <button
                                                onClick={() => handleRollAttack(spell.name, character.spellAttackBonus)}
                                                className="ml-auto p-1 rounded hover:bg-blue-200 text-blue-600 hover:text-blue-700 transition-all flex-shrink-0"
                                                title={`Roll ${spell.name} Attack`}
                                              >
                                                <Dice5 className="w-3 h-3" />
                                              </button>
                                            </div>
                                          )}

                                          {attackType === 'save' && spell.saveDC && (
                                            <div className="text-xs font-medium text-purple-700">
                                              <span>{spell.saveDC}</span>
                                              <span className="text-purple-900 font-bold"> Saving Throw</span>
                                            </div>
                                          )}

                                          {attackType === 'auto-hit' && (
                                            <div className="text-xs font-medium text-green-700">Auto-hit (no roll needed)</div>
                                          )}

                                          {/* Damage Roll Options */}
                                          {spell.damage && (
                                            <div className="pt-1 border-t border-blue-200 space-y-1">
                                              {altDamage && hasVarDamage ? (
                                                <div className="flex flex-wrap gap-1">
                                                  <span className="text-xs text-gray-600 w-full">Damage:</span>
                                                  <button
                                                    onClick={() => handleRollDamage(spell.name, spell.damage!, 8)}
                                                    className="px-2 py-0.5 text-xs bg-orange-500 hover:bg-orange-600 text-white rounded transition-colors flex items-center gap-1"
                                                    title={`Roll ${spell.name} Damage (d8)`}
                                                  >
                                                    <span>d8</span>
                                                    <Dice5 className="w-3 h-3" />
                                                  </button>
                                                  <button
                                                    onClick={() => handleRollDamage(spell.name, altDamage, 12)}
                                                    className="px-2 py-0.5 text-xs bg-orange-500 hover:bg-orange-600 text-white rounded transition-colors flex items-center gap-1"
                                                    title={`Roll ${spell.name} Damage (d12)`}
                                                  >
                                                    <span>d12</span>
                                                    <Dice5 className="w-3 h-3" />
                                                  </button>
                                                </div>
                                              ) : (
                                                <div className="flex items-center gap-2">
                                                  <span className="text-xs text-gray-600">Damage:</span>
                                                  <span className="text-xs text-gray-700 font-medium">{spell.damage}</span>
                                                  <button
                                                    onClick={() => handleRollDamage(spell.name, spell.damage!)}
                                                    className="ml-auto p-1 rounded hover:bg-blue-200 text-orange-600 hover:text-orange-700 transition-all flex-shrink-0"
                                                    title={`Roll ${spell.name} Damage`}
                                                  >
                                                    <Dice5 className="w-3 h-3" />
                                                  </button>
                                                </div>
                                              )}
                                            </div>
                                          )}
                                        </div>
                                      )}

                                      {/* Healing Roll */}
                                      {healingInfo.isHealing && healingFormula && (
                                        <div className="bg-green-50 border border-green-300 rounded p-2 mb-3">
                                          <div className="flex items-center gap-2">
                                            <span className="text-xs text-green-700">Healing:</span>
                                            <span className="text-xs text-green-800 font-medium">
                                              {healingFormula}{healingInfo.appliesModifier ? ' + modifier' : ''}
                                            </span>
                                            <button
                                              onClick={() => handleRollHealing(spell.name, healingFormula!, healingInfo.appliesModifier)}
                                              className="ml-auto px-2 py-0.5 text-xs bg-green-500 hover:bg-green-600 text-white rounded transition-colors flex items-center gap-1"
                                              title={`Roll ${spell.name} Healing`}
                                            >
                                              <span>Roll Healing</span>
                                              <Dice5 className="w-3 h-3" />
                                            </button>
                                          </div>
                                        </div>
                                      )}
                                    </>
                                  );
                                })()}

                                <div className="text-sm text-gray-600 space-y-1">
                                  <div><span className="font-medium">Casting Time:</span> {spell.castingTime}</div>
                                  <div><span className="font-medium">Range:</span> {spell.range}</div>
                                  <div><span className="font-medium">Duration:</span> {spell.duration}</div>
                                  {spell.components && (
                                    <div><span className="font-medium">Components:</span> {spell.components}</div>
                                  )}
                                  <div className="flex gap-3 text-xs">
                                    {spell.concentration && (
                                      <span className="bg-orange-100 text-orange-800 px-2 py-0.5 rounded">Concentration</span>
                                    )}
                                    {spell.ritual && (
                                      <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded">Ritual</span>
                                    )}
                                  </div>
                                  <p className="mt-2">{spell.description}</p>
                                </div>
                              </>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* Inventory Tab */}
                {activeTab === 'inventory' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-gray-900">Inventory & Currency</h3>
                    <div className="grid grid-cols-5 gap-3">
                      {[
                        { label: 'CP', key: 'cp' as const },
                        { label: 'SP', key: 'sp' as const },
                        { label: 'EP', key: 'ep' as const },
                        { label: 'GP', key: 'gp' as const },
                        { label: 'PP', key: 'pp' as const }
                      ].map((coin) => (
                        <div key={coin.label} className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
                          <div className="text-xs text-gray-600 font-medium mb-1">{coin.label}</div>
                          {isEditing ? (
                            <input
                              type="text"
                              value={character[coin.key]}
                              onChange={(e) => handleCharacterChange(coin.key, e.target.value)}
                              className="w-full text-lg font-bold text-gray-900 bg-white border border-gray-300 rounded px-1 text-center"
                            />
                          ) : (
                            <div className="text-lg font-bold text-gray-900">{character[coin.key]}</div>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <h4 className="font-bold text-gray-900 mb-2">Equipment</h4>
                      {isEditing ? (
                        <textarea
                          value={character.equipment}
                          onChange={(e) => handleCharacterChange('equipment', e.target.value)}
                          className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-sm min-h-20"
                        />
                      ) : (
                        <p className="text-sm text-gray-700">{character.equipment}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Features Tab */}
                {activeTab === 'features' && (
                  <div className="space-y-6">
                    {/* Race/Class Overview Section */}
                    <div className="space-y-3">
                      <h3 className="text-lg font-bold text-gray-900">Overview</h3>

                      {/* Race */}
                      <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                        <button
                          onClick={() => toggleFeatureExpanded(-1)}
                          className="w-full px-4 py-3 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-gray-200 flex items-center justify-between hover:bg-gradient-to-r hover:from-amber-100 hover:to-orange-100 transition-colors"
                        >
                          <div className="text-left">
                            <div className="font-bold text-gray-900">{character.race}</div>
                            <div className="text-xs text-gray-600">Race</div>
                          </div>
                          <span className="text-gray-500">{expandedFeatures[-1] ? '−' : '+'}</span>
                        </button>
                        {expandedFeatures[-1] && (
                          <div className="px-4 py-3 text-sm text-gray-700 bg-gray-50 space-y-3">
                            {isEditing && (
                              <div>
                                <label className="text-sm font-semibold text-gray-600">Race Name</label>
                                <input
                                  type="text"
                                  value={character.race}
                                  onChange={(e) => handleCharacterChange('race', e.target.value)}
                                  className="w-full mt-1 bg-white border border-gray-300 rounded px-2 py-1 text-sm"
                                  placeholder="Race name"
                                />
                              </div>
                            )}
                            <div>
                              <label className="text-sm font-semibold text-gray-600">Description</label>
                              {isEditing ? (
                                <textarea
                                  value={character.raceDescription}
                                  onChange={(e) => handleCharacterChange('raceDescription', e.target.value)}
                                  className="w-full mt-1 bg-white border border-gray-300 rounded px-2 py-1 text-sm min-h-24"
                                />
                              ) : (
                                <p>{character.raceDescription || 'No description provided'}</p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Classes */}
                      {character.classes && character.classes.length > 0 ? (
                        <div className="space-y-3">
                          {character.classes.map((cls, classIdx) => (
                            <div key={classIdx} className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                              <button
                                onClick={() => toggleFeatureExpanded(`class-${classIdx}`)}
                                className="w-full px-4 py-3 bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-gray-200 flex items-center justify-between hover:bg-gradient-to-r hover:from-blue-100 hover:to-cyan-100 transition-colors"
                              >
                                <div className="text-left">
                                  <div className="font-bold text-gray-900">{cls.name} (Level {cls.level})</div>
                                  {cls.subclass && <div className="text-xs text-gray-600">{cls.subclass}</div>}
                                </div>
                                <span className="text-gray-500">{expandedFeatures[`class-${classIdx}`] ? '−' : '+'}</span>
                              </button>
                              {expandedFeatures[`class-${classIdx}`] && (
                                <div className="px-4 py-3 text-sm text-gray-700 bg-gray-50 space-y-3">
                                  {isEditing ? (
                                    <>
                                      <div>
                                        <label className="text-sm font-semibold text-gray-600">Class Name</label>
                                        <input
                                          type="text"
                                          value={cls.name}
                                          onChange={(e) => {
                                            const newClasses = [...character.classes!];
                                            newClasses[classIdx].name = e.target.value;
                                            setCharacter({ ...character, classes: newClasses });
                                          }}
                                          className="w-full mt-1 bg-white border border-gray-300 rounded px-2 py-1 text-sm"
                                        />
                                      </div>
                                      <div>
                                        <label className="text-sm font-semibold text-gray-600">Level</label>
                                        <input
                                          type="number"
                                          value={cls.level}
                                          min="1"
                                          max="20"
                                          onChange={(e) => {
                                            const newClasses = [...character.classes!];
                                            newClasses[classIdx].level = parseInt(e.target.value) || 1;
                                            setCharacter({ ...character, classes: newClasses });
                                          }}
                                          className="w-full mt-1 bg-white border border-gray-300 rounded px-2 py-1 text-sm"
                                        />
                                      </div>
                                      <div>
                                        <label className="text-sm font-semibold text-gray-600">Subclass (optional)</label>
                                        <input
                                          type="text"
                                          value={cls.subclass}
                                          onChange={(e) => {
                                            const newClasses = [...character.classes!];
                                            newClasses[classIdx].subclass = e.target.value;
                                            setCharacter({ ...character, classes: newClasses });
                                          }}
                                          className="w-full mt-1 bg-white border border-gray-300 rounded px-2 py-1 text-sm"
                                        />
                                      </div>
                                      <div>
                                        <label className="text-sm font-semibold text-gray-600">Description</label>
                                        <textarea
                                          value={cls.description || ''}
                                          onChange={(e) => {
                                            const newClasses = [...character.classes!];
                                            newClasses[classIdx].description = e.target.value;
                                            setCharacter({ ...character, classes: newClasses });
                                          }}
                                          className="w-full mt-1 bg-white border border-gray-300 rounded px-2 py-1 text-sm min-h-20"
                                        />
                                      </div>
                                      {character.classes!.length > 1 && (
                                        <button
                                          onClick={() => {
                                            const newClasses = character.classes!.filter((_, i) => i !== classIdx);
                                            setCharacter({ ...character, classes: newClasses });
                                          }}
                                          className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-medium transition-colors"
                                        >
                                          Remove Class
                                        </button>
                                      )}
                                    </>
                                  ) : (
                                    <p>{cls.description || 'No description provided'}</p>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                          <button
                            onClick={() => toggleFeatureExpanded(-2)}
                            className="w-full px-4 py-3 bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-gray-200 flex items-center justify-between hover:bg-gradient-to-r hover:from-blue-100 hover:to-cyan-100 transition-colors"
                          >
                            <div className="text-left">
                              <div className="font-bold text-gray-900">{character.class}</div>
                              <div className="text-xs text-gray-600">Class</div>
                            </div>
                            <span className="text-gray-500">{expandedFeatures[-2] ? '−' : '+'}</span>
                          </button>
                          {expandedFeatures[-2] && (
                            <div className="px-4 py-3 text-sm text-gray-700 bg-gray-50">
                              {isEditing ? (
                                <textarea
                                  value={character.classDescription}
                                  onChange={(e) => handleCharacterChange('classDescription', e.target.value)}
                                  className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-sm min-h-24"
                                />
                              ) : (
                                <p>{character.classDescription || 'No description provided'}</p>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Add Class Button in Edit Mode */}
                      {isEditing && character.classes && character.classes.length < 3 && (
                        <button
                          onClick={() => {
                            const newClasses = [
                              ...(character.classes || []),
                              { name: 'Class', subclass: '', level: 1, description: '' }
                            ];
                            setCharacter({ ...character, classes: newClasses });
                          }}
                          className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium transition-colors"
                        >
                          + Add Class
                        </button>
                      )}

                      {/* Subclass (legacy, for old single-class characters) */}
                      {!character.classes || character.classes.length === 0 && character.subclass && (
                        <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                          <button
                            onClick={() => toggleFeatureExpanded(-3)}
                            className="w-full px-4 py-3 bg-gradient-to-r from-purple-50 to-pink-50 border-b border-gray-200 flex items-center justify-between hover:bg-gradient-to-r hover:from-purple-100 hover:to-pink-100 transition-colors"
                          >
                            <div className="text-left">
                              <div className="font-bold text-gray-900">{character.subclass}</div>
                              <div className="text-xs text-gray-600">Subclass</div>
                            </div>
                            <span className="text-gray-500">{expandedFeatures[-3] ? '−' : '+'}</span>
                          </button>
                          {expandedFeatures[-3] && (
                            <div className="px-4 py-3 text-sm text-gray-700 bg-gray-50">
                              {isEditing ? (
                                <textarea
                                  value={character.subclassDescription}
                                  onChange={(e) => handleCharacterChange('subclassDescription', e.target.value)}
                                  className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-sm min-h-24"
                                />
                              ) : (
                                <p>{character.subclassDescription || 'No description provided'}</p>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Features & Traits Section */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-gray-900">Features & Traits</h3>
                        {isEditing && (
                          <button
                            onClick={handleAddFeature}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium transition-colors"
                          >
                            + Add Feature
                          </button>
                        )}
                      </div>

                      {character.features && character.features.length > 0 ? (
                        <div className="space-y-2">
                          {character.features.map((feature, idx) => (
                            <div key={idx} className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                              <button
                                onClick={() => toggleFeatureExpanded(idx)}
                                className="w-full px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between hover:bg-gray-100 transition-colors"
                              >
                                <div className="text-left flex-1">
                                  {isEditing ? (
                                    <input
                                      type="text"
                                      value={feature.name}
                                      onChange={(e) => handleFeatureChange(idx, 'name', e.target.value)}
                                      className="w-full font-bold text-gray-900 bg-white border border-gray-300 rounded px-2 py-1 mb-1"
                                    />
                                  ) : (
                                    <div className="font-bold text-gray-900">{feature.name}</div>
                                  )}
                                  {feature.category && (
                                    <div className="text-xs text-gray-500 capitalize">{feature.category}</div>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-gray-500 text-lg">{expandedFeatures[idx] ? '−' : '+'}</span>
                                  {isEditing && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteFeature(idx);
                                      }}
                                      className="text-red-600 hover:text-red-700"
                                    >
                                      <X size={16} />
                                    </button>
                                  )}
                                </div>
                              </button>
                              {expandedFeatures[idx] && (
                                <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
                                  {isEditing ? (
                                    <>
                                      <div className="mb-3">
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
                                        <input
                                          type="text"
                                          value={feature.category || ''}
                                          onChange={(e) => handleFeatureChange(idx, 'category', e.target.value)}
                                          placeholder="e.g., racial, class, background"
                                          className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-sm"
                                        />
                                      </div>
                                      <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                                      <textarea
                                        value={feature.description}
                                        onChange={(e) => handleFeatureChange(idx, 'description', e.target.value)}
                                        className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-sm min-h-20"
                                        placeholder="Enter feature description..."
                                      />
                                    </>
                                  ) : (
                                    <div className="text-sm text-gray-700 space-y-2">
                                      <p>{feature.description || 'No description provided'}</p>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 italic">No features added yet</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Background Tab */}
                {activeTab === 'background' && (
                  <div className="space-y-6">
                    <div className="col-span-3 space-y-4">
                      {/* Character Info */}
                      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                        <h3 className="text-sm font-bold text-gray-700 uppercase mb-3">Character Info</h3>
                        <div className="space-y-3 text-sm">
                          <div>
                            <div className="text-gray-600 font-medium mb-1">Background</div>
                            {isEditing ? (
                              <textarea
                                value={character.background}
                                onChange={(e) => handleCharacterChange('background', e.target.value)}
                                className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-gray-900 min-h-20"
                                placeholder="Character background"
                              />
                            ) : (
                              <div className="text-gray-900">{character.background}</div>
                            )}
                          </div>
                          <div>
                            <div className="text-gray-600 font-medium mb-1">Alignment</div>
                            {isEditing ? (
                              <input
                                type="text"
                                value={character.alignment}
                                onChange={(e) => handleCharacterChange('alignment', e.target.value)}
                                className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-gray-900"
                              />
                            ) : (
                              <div className="text-gray-900">{character.alignment}</div>
                            )}
                          </div>
                          <div>
                            <div className="text-gray-600 font-medium mb-1">Experience Points</div>
                            {isEditing ? (
                              <input
                                type="text"
                                value={character.experiencePoints}
                                onChange={(e) => handleCharacterChange('experiencePoints', e.target.value)}
                                className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-gray-900"
                              />
                            ) : (
                              <div className="text-gray-900">{character.experiencePoints}</div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Personality Traits */}
                      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                        <h3 className="text-sm font-bold text-gray-700 uppercase mb-3">Personality</h3>
                        <div className="space-y-3 text-sm">
                          <div>
                            <div className="text-gray-600 font-medium mb-1">Traits</div>
                            {isEditing ? (
                              <textarea
                                value={character.personalityTraits}
                                onChange={(e) => handleCharacterChange('personalityTraits', e.target.value)}
                                className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-gray-900 min-h-16"
                              />
                            ) : (
                              <div className="text-gray-900">{character.personalityTraits}</div>
                            )}
                          </div>
                          <div>
                            <div className="text-gray-600 font-medium mb-1">Ideals</div>
                            {isEditing ? (
                              <textarea
                                value={character.ideals}
                                onChange={(e) => handleCharacterChange('ideals', e.target.value)}
                                className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-gray-900 min-h-16"
                              />
                            ) : (
                              <div className="text-gray-900">{character.ideals}</div>
                            )}
                          </div>
                          <div>
                            <div className="text-gray-600 font-medium mb-1">Bonds</div>
                            {isEditing ? (
                              <textarea
                                value={character.bonds}
                                onChange={(e) => handleCharacterChange('bonds', e.target.value)}
                                className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-gray-900 min-h-16"
                              />
                            ) : (
                              <div className="text-gray-900">{character.bonds}</div>
                            )}
                          </div>
                          <div>
                            <div className="text-gray-600 font-medium mb-1">Flaws</div>
                            {isEditing ? (
                              <textarea
                                value={character.flaws}
                                onChange={(e) => handleCharacterChange('flaws', e.target.value)}
                                className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-gray-900 min-h-16"
                              />
                            ) : (
                              <div className="text-gray-900">{character.flaws}</div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>


        </div>
      </div>

      {/* Roll History Panel */}
      <RollHistoryPanel
        rolls={combinedRolls}
        minimized={historyMinimized}
        onToggleMinimize={() => setHistoryMinimized(!historyMinimized)}
        onClearHistory={handleClearHistory}
      />
    </div>
  );
}
