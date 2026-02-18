import { useState, useMemo, useRef } from 'react';
import type { CharacterData, Feature } from '~/types/character';
import {
  calculateModifier,
  calculateTotalLevel,
  normalizeCharacterData,
  getSpellcastingAbilityScore,
} from '~/utils/characterUtils';
import {
  rollAbilityCheck,
  rollSavingThrow,
  rollSkillCheck,
  rollAttack,
  rollDamage,
  rollHealing,
  calculateProficiencyBonus,
} from '~/utils/diceRoller';
import type { RollResult } from '~/utils/diceRoller';
import { getBonusDamageFeatures } from '~/utils/bonusDamageFeatures';
import { useSharedRolls } from '~/hooks/useSharedRolls';

export function useCharacterSheet(initialCharacter: CharacterData) {
  const [character, setCharacter] = useState<CharacterData>(normalizeCharacterData(initialCharacter));
  const [isEditing, setIsEditing] = useState(false);
  const [hpAdjustAmount, setHpAdjustAmount] = useState<string>('');
  const [editingTempHp, setEditingTempHp] = useState(false);
  const [activeTab, setActiveTab] = useState<'actions' | 'spells' | 'inventory' | 'features' | 'background'>('actions');
  const [expandedFeatures, setExpandedFeatures] = useState<{ [key: string | number]: boolean }>({});
  const [pdfVersion, setPdfVersion] = useState<'2024' | 'original'>('2024');
  const [rollHistory, setRollHistory] = useState<RollResult[]>([]);
  const [historyMinimized, setHistoryMinimized] = useState(true);
  const [openSmitePicker, setOpenSmitePicker] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const { sharedRolls, submitRoll } = useSharedRolls();

  // Derived values
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

  const bonusDamageFeatures = useMemo(() => {
    const primaryClassName = character.classes && character.classes.length > 0
      ? character.classes[0].name
      : character.class || '';
    const totalLevel = calculateTotalLevel(character);
    return getBonusDamageFeatures(primaryClassName, totalLevel.toString(), character.features, character.race);
  }, [character.classes, character.class, character.features, character.race]);

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

  const calculatedInitiative = useMemo(() => {
    const dexMod = abilityModifiers.dexterity;
    return dexMod >= 0 ? `+${dexMod}` : `${dexMod}`;
  }, [abilityModifiers.dexterity]);

  const sortedSkills = useMemo(() => {
    return Object.entries(character.skills).sort(([a], [b]) => a.localeCompare(b));
  }, [character.skills]);

  // Character change handlers
  const handleCharacterChange = (key: keyof CharacterData, value: any) => {
    setCharacter(prev => ({ ...prev, [key]: value }));
  };

  const handleSkillChange = (skillName: string, proficient: boolean) => {
    setCharacter(prev => ({
      ...prev,
      skills: { ...prev.skills, [skillName]: { ...prev.skills[skillName], proficient } },
    }));
  };

  const handleSkillValueChange = (skillName: string, value: string) => {
    setCharacter(prev => ({
      ...prev,
      skills: { ...prev.skills, [skillName]: { ...prev.skills[skillName], value } },
    }));
  };

  const handleSavingThrowChange = (name: string, proficient: boolean) => {
    setCharacter(prev => ({
      ...prev,
      savingThrows: { ...prev.savingThrows, [name]: { ...prev.savingThrows[name], proficient } },
    }));
  };

  const handleSavingThrowValueChange = (name: string, value: string) => {
    setCharacter(prev => ({
      ...prev,
      savingThrows: { ...prev.savingThrows, [name]: { ...prev.savingThrows[name], value } },
    }));
  };

  const handleAttackChange = (index: number, key: 'name' | 'atkBonus' | 'damage', value: string) => {
    const newAttacks = [...character.attacks];
    newAttacks[index] = { ...newAttacks[index], [key]: value };
    handleCharacterChange('attacks', newAttacks);
  };

  const handleSpellChange = (index: number, key: keyof CharacterData['spells'][0], value: string) => {
    const newSpells = [...character.spells];
    newSpells[index] = { ...newSpells[index], [key]: value };
    handleCharacterChange('spells', newSpells);
  };

  const handleAddSpell = () => {
    handleCharacterChange('spells', [...character.spells, {
      name: 'New Spell', level: '0', school: '', castingTime: '1 action',
      range: 'Self', duration: 'Instantaneous', description: '', concentration: false, ritual: false, components: '',
    }]);
  };

  const handleDeleteSpell = (index: number) => {
    handleCharacterChange('spells', character.spells.filter((_, i) => i !== index));
  };

  const handleFeatureChange = (index: number, key: 'name' | 'description' | 'category', value: string) => {
    const newFeatures = [...character.features];
    newFeatures[index] = { ...newFeatures[index], [key]: value };
    handleCharacterChange('features', newFeatures);
  };

  const handleAddFeature = () => {
    const newFeature: Feature = { name: 'New Feature', description: '', category: 'custom' };
    handleCharacterChange('features', [...character.features, newFeature]);
  };

  const handleDeleteFeature = (index: number) => {
    handleCharacterChange('features', character.features.filter((_, i) => i !== index));
  };

  const toggleFeatureExpanded = (index: number | string) => {
    setExpandedFeatures(prev => ({ ...prev, [index]: !prev[index as any] }));
  };

  const handleAddCantrip = () => {
    handleCharacterChange('cantrips', [...character.cantrips, {
      name: 'New Cantrip', level: '0', school: '', castingTime: '1 action',
      range: 'Self', duration: 'Instantaneous', description: '', concentration: false, ritual: false, components: '',
    }]);
  };

  const handleDeleteCantrip = (index: number) => {
    handleCharacterChange('cantrips', character.cantrips.filter((_, i) => i !== index));
  };

  const handleAddAttack = () => {
    handleCharacterChange('attacks', [...character.attacks, { name: 'New Weapon', atkBonus: '+0', damage: '1d4' }]);
  };

  const handleDeleteAttack = (index: number) => {
    handleCharacterChange('attacks', character.attacks.filter((_, i) => i !== index));
  };

  // Roll helpers
  const parseModifier = (modString: string): number => {
    const match = modString.match(/([+-]?\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  };

  const addRoll = (roll: RollResult) => {
    setRollHistory(prev => [roll, ...prev].slice(0, 50));
    setHistoryMinimized(false);
    submitRoll({
      ...roll,
      characterName: character.characterName || 'Unknown',
      timestamp: roll.timestamp.toISOString(),
    });
  };

  const handleRollAbilityCheck = (abilityName: string, modifier: string) => {
    addRoll(rollAbilityCheck(abilityName, parseModifier(modifier)));
  };

  const handleRollSavingThrow = (throwName: string, modifier: string) => {
    addRoll(rollSavingThrow(throwName, parseModifier(modifier)));
  };

  const handleRollSkillCheck = (skillName: string, modifier: string) => {
    addRoll(rollSkillCheck(skillName, parseModifier(modifier)));
  };

  const handleRollAttack = (weaponName: string, bonus: string) => {
    addRoll(rollAttack(weaponName, parseModifier(bonus)));
  };

  const handleRollDamage = (weaponName: string, damageFormula: string, diceSides?: number) => {
    addRoll(rollDamage(weaponName, damageFormula, diceSides));
  };

  const handleRollHealing = (spellName: string, healingFormula: string, applyModifier: boolean) => {
    const abilityMod = applyModifier ? calculateModifier(getSpellcastingAbilityScore(character)) : 0;
    addRoll(rollHealing(spellName, healingFormula, abilityMod));
  };

  const handleRollBonusDamage = (featureName: string, dice: string) => {
    addRoll(rollDamage(featureName, dice));
    setOpenSmitePicker(null);
  };

  const handleClearHistory = () => setRollHistory([]);

  // HP handlers
  const handleApplyHealing = () => {
    const amount = parseInt(hpAdjustAmount) || 0;
    if (amount <= 0) return;
    const currentHP = parseInt(character.currentHitPoints) || 0;
    const maxHP = parseInt(character.hitPointMaximum) || 0;
    handleCharacterChange('currentHitPoints', Math.min(currentHP + amount, maxHP).toString());
    setHpAdjustAmount('');
  };

  const handleApplyDamage = () => {
    const amount = parseInt(hpAdjustAmount) || 0;
    if (amount <= 0) return;
    let currentHP = parseInt(character.currentHitPoints) || 0;
    let tempHP = parseInt(character.temporaryHitPoints) || 0;
    if (tempHP > 0) {
      if (tempHP >= amount) {
        tempHP -= amount;
      } else {
        currentHP = Math.max(0, currentHP - (amount - tempHP));
        tempHP = 0;
      }
    } else {
      currentHP = Math.max(0, currentHP - amount);
    }
    handleCharacterChange('currentHitPoints', currentHP.toString());
    handleCharacterChange('temporaryHitPoints', tempHP.toString());
    setHpAdjustAmount('');
  };

  // Export / import
  const exportToPDF = async () => {
    try {
      const { PDFDocument } = await import('pdf-lib');
      const { mapCharacterToPDF, mapCharacterToPDF2024 } = await import('~/utils/pdfFieldMapping');
      const pdfPath = pdfVersion === '2024'
        ? '/DnD_2024_Character-Sheet - fillable - V2.pdf'
        : '/dnd_character_sheet_fillable.pdf';
      const mappingFunction = pdfVersion === '2024' ? mapCharacterToPDF2024 : mapCharacterToPDF;
      const pdfResponse = await fetch(pdfPath);
      if (!pdfResponse.ok) throw new Error(`Failed to load PDF template: ${pdfResponse.statusText}`);
      const pdfBytes = await pdfResponse.arrayBuffer();
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const form = pdfDoc.getForm();
      const pdfData = mappingFunction({ ...character, class: character.class || '' });
      const smallFontFields = pdfVersion === '2024'
        ? ['CLASS FEATURES 1', 'CLASS FEATURES 2', 'SPECIES TRAITS', 'FEATS', 'EQUIPMENT', 'PERSONALITY', 'IDEALS', 'BONDS', 'FLAWS']
        : ['Features and Traits', 'Equipment', 'AttacksSpellcasting', 'Backstory'];
      Object.entries(pdfData).forEach(([fieldName, value]) => {
        try {
          if (value === undefined || value === null) return;
          const field = form.getFields().find(f => f.getName() === fieldName);
          if (!field) return;
          if (typeof value === 'boolean') {
            const checkBox = form.getCheckBox(fieldName);
            value ? checkBox.check() : checkBox.uncheck();
          } else {
            try {
              const textField = form.getTextField(fieldName);
              textField.setText(String(value));
              if (smallFontFields.includes(fieldName)) textField.setFontSize(8);
            } catch { /* skip non-text fields */ }
          }
        } catch { /* field missing, continue */ }
      });
      const pdfBytes2 = await pdfDoc.save();
      const blob = new Blob([new Uint8Array(pdfBytes2)], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${character.characterName}_D&D_Sheet${pdfVersion === '2024' ? '_2024' : ''}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert(`Failed to export PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const exportToJSON = () => {
    try {
      const blob = new Blob([JSON.stringify(character, null, 2)], { type: 'application/json' });
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
        if (!jsonData.characterName) throw new Error('Invalid character data: missing characterName field');
        setCharacter(jsonData as CharacterData);
        alert(`Successfully imported character: ${jsonData.characterName}`);
      } catch (error) {
        console.error('Error importing JSON:', error);
        alert(`Failed to import character data: ${error instanceof Error ? error.message : 'Invalid JSON file'}`);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return {
    // State
    character,
    setCharacter,
    isEditing,
    setIsEditing,
    hpAdjustAmount,
    setHpAdjustAmount,
    editingTempHp,
    setEditingTempHp,
    activeTab,
    setActiveTab,
    expandedFeatures,
    pdfVersion,
    setPdfVersion,
    historyMinimized,
    setHistoryMinimized,
    openSmitePicker,
    setOpenSmitePicker,
    fileInputRef,
    // Derived
    combinedRolls,
    bonusDamageFeatures,
    proficiencyBonus,
    abilityModifiers,
    calculatedInitiative,
    sortedSkills,
    // Handlers
    handleCharacterChange,
    handleSkillChange,
    handleSkillValueChange,
    handleSavingThrowChange,
    handleSavingThrowValueChange,
    handleAttackChange,
    handleSpellChange,
    handleAddSpell,
    handleDeleteSpell,
    handleFeatureChange,
    handleAddFeature,
    handleDeleteFeature,
    toggleFeatureExpanded,
    handleAddCantrip,
    handleDeleteCantrip,
    handleAddAttack,
    handleDeleteAttack,
    parseModifier,
    addRoll,
    handleRollAbilityCheck,
    handleRollSavingThrow,
    handleRollSkillCheck,
    handleRollAttack,
    handleRollDamage,
    handleRollHealing,
    handleRollBonusDamage,
    handleClearHistory,
    handleApplyHealing,
    handleApplyDamage,
    exportToPDF,
    exportToJSON,
    importFromJSON,
  };
}
