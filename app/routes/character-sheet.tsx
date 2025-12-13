import { useState, useMemo } from 'react';
import { Download, Edit2, Save, X, Heart, Shield, Sword, ChevronDown } from 'lucide-react';
import SpellEntry from '../components/SpellEntry';

// D&D 5e Calculation Utilities
const calculateModifier = (abilityScore: number): number => {
  return Math.floor((abilityScore - 10) / 2);
};

const calculateProficiencyBonus = (level: string): number => {
  const levelNum = parseInt(level);
  if (!levelNum) return 2;
  if (levelNum <= 4) return 2;
  if (levelNum <= 8) return 3;
  if (levelNum <= 12) return 4;
  if (levelNum <= 16) return 5;
  return 6;
};

const getAbilityModifier = (character: CharacterData, abilityKey: 'strength' | 'dexterity' | 'constitution' | 'intelligence' | 'wisdom' | 'charisma'): string => {
  const scoreStr = character[abilityKey];
  const score = parseInt(scoreStr) || 0;
  const mod = calculateModifier(score);
  return mod >= 0 ? `+${mod}` : `${mod}`;
};

interface Feature {
  name: string;
  description: string;
  category?: string; // 'racial', 'class', 'background', 'feat', etc.
}

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
  const [character, setCharacter] = useState<CharacterData>(initialCharacter);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<'actions' | 'spells' | 'inventory' | 'features'>('actions');
  const [expandedFeatures, setExpandedFeatures] = useState<{ [key: number]: boolean }>({});

  // Calculate derived values
  const proficiencyBonus = useMemo(() => calculateProficiencyBonus(character.level), [character.level]);
  
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

  const exportToPDF = async () => {
    try {
      const { PDFDocument } = await import('pdf-lib');
      const { mapCharacterToPDF } = await import('../utils/pdfFieldMapping');

      // Load the PDF template
      const pdfPath = '/dnd_character_sheet_fillable.pdf';
      const pdfResponse = await fetch(pdfPath);
      if (!pdfResponse.ok) {
        throw new Error(`Failed to load PDF template: ${pdfResponse.statusText}`);
      }
      const pdfBytes = await pdfResponse.arrayBuffer();

      // Load PDF document
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const form = pdfDoc.getForm();

      // Map character data to PDF fields
      const pdfData = mapCharacterToPDF(character);

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
            } catch {
              // Field might be a dropdown or other type, skip
            }
          }
        } catch (error) {
          // Field doesn't exist or wrong type, continue
        }
      });

      // Flatten the form to prevent further editing
      form.flatten();

      // Save and download
      const pdfBytes2 = await pdfDoc.save();
      const blob = new Blob([new Uint8Array(pdfBytes2)], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      // Create download link
      const link = document.createElement('a');
      link.href = url;
      link.download = `${character.characterName}_D&D_Sheet.pdf`;
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

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">{character.characterName}</h1>
              <div className="text-sm text-gray-600">
                <span className="font-medium">{character.race}</span>
                {' • '}
                <span className="font-medium">{character.class}{character.subclass ? ` (${character.subclass})` : ''}</span>
                {' • '}
                <span>Level {character.level}</span>
                {' • '}
                <span>{character.background}</span>
              </div>
            </div>

            {/* Top Right Stats - HP, AC, Initiative */}
            <div className="flex items-center gap-3">
              {/* HP */}
              <div className="bg-red-50 border-2 border-red-400 rounded-lg px-4 py-2 min-w-32">
                <div className="flex items-center gap-2 mb-1">
                  <Heart className="text-red-500" size={16} />
                  <span className="text-xs font-bold text-red-700 uppercase">Hit Points</span>
                </div>
                <div className="flex items-baseline gap-1">
                  {isEditing ? (
                    <>
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
                    </>
                  ) : (
                    <>
                      <span className="text-3xl font-bold text-red-600">{character.currentHitPoints}</span>
                      <span className="text-gray-400 text-lg">/</span>
                      <span className="text-lg text-gray-600">{character.hitPointMaximum}</span>
                    </>
                  )}
                </div>
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
              <div className="bg-green-50 border-2 border-green-400 rounded-lg px-4 py-2 text-center min-w-24">
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
                  <div className="text-3xl font-bold text-green-600">{calculatedInitiative}</div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium transition-colors"
                >
                  <Save size={16} className="inline mr-1" />
                  Save Changes
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
                <button onClick={exportToPDF} className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md text-sm font-medium transition-colors">
                  <Download size={16} className="inline mr-1" />
                  Export PDF
                </button>
              </>
            )}
            {onBack && (
              <button
                onClick={onBack}
                className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-md text-sm font-medium transition-colors ml-auto"
              >
                <X size={16} className="inline mr-1" />
                Back
              </button>
            )}
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
                  <div key={ability.name} className="bg-gray-50 rounded-lg p-3 text-center border border-gray-200">
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
                        <div className="text-2xl font-bold text-gray-900 mb-1">{ability.mod >= 0 ? '+' : ''}{ability.mod}</div>
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
              </div>
            </div>

            {/* Saving Throws */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h3 className="text-sm font-bold text-gray-700 uppercase mb-3">Saving Throws</h3>
              <div className="space-y-2">
                {Object.entries(character.savingThrows).map(([name, data]) => (
                  <div key={name} className="flex items-center gap-2">
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
                    <span className="text-sm font-bold text-gray-900">{data.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Skills */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h3 className="text-sm font-bold text-gray-700 uppercase mb-3">Skills</h3>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {sortedSkills.map(([skillName, skillData]) => (
                  <div key={skillName} className="flex items-center gap-2">
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
                    <span className="text-sm font-bold text-gray-900">{skillData.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Center Column - Actions & Content */}
          <div className="col-span-6 space-y-4">
            {/* Tabs */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="border-b border-gray-200">
                <div className="flex">
                  {(['actions', 'spells', 'inventory', 'features'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-6 py-3 text-sm font-medium capitalize transition-colors ${
                        activeTab === tab
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
                      <h3 className="text-lg font-bold text-gray-900 mb-4">Weapons & Attacks</h3>
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
                                  <input
                                    type="text"
                                    value={attack.atkBonus}
                                    onChange={(e) => handleAttackChange(idx, 'atkBonus', e.target.value)}
                                    className="w-20 text-sm font-medium text-blue-600 bg-white border border-gray-300 rounded px-2 py-1 ml-2"
                                  />
                                ) : (
                                  <span className="text-sm font-medium text-blue-600">{attack.atkBonus} to hit</span>
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
                                <div className="text-sm text-gray-600">{attack.damage}</div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-sm">No weapons listed</p>
                      )}
                    </div>

                    {character.cantrips && character.cantrips.length > 0 && (
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Cantrips</h3>
                        <div className="space-y-3">
                          {character.cantrips.map((cantrip, idx) => (
                            <div key={idx} className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <div className="font-bold text-gray-900">{cantrip.name}</div>
                                  <div className="text-xs text-gray-500">
                                    {cantrip.school} • {cantrip.castingTime}
                                  </div>
                                </div>
                              </div>
                              <div className="text-sm text-gray-600 space-y-1">
                                <div><span className="font-medium">Range:</span> {cantrip.range}</div>
                                {cantrip.damage && (
                                  <div><span className="font-medium">Damage:</span> {cantrip.damage}</div>
                                )}
                                {cantrip.saveDC && (
                                  <div><span className="font-medium">Save DC:</span> {cantrip.saveDC}</div>
                                )}
                                <p className="mt-2 text-xs">{cantrip.description}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Spells Tab */}
                {activeTab === 'spells' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold text-gray-900">Spells</h3>
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
                                <div className="text-sm text-gray-600 space-y-1">
                                  <div><span className="font-medium">Casting Time:</span> {spell.castingTime}</div>
                                  <div><span className="font-medium">Range:</span> {spell.range}</div>
                                  <div><span className="font-medium">Duration:</span> {spell.duration}</div>
                                  {spell.damage && (
                                    <div><span className="font-medium">Damage:</span> <span className="text-red-600 font-semibold">{spell.damage}</span></div>
                                  )}
                                  {spell.saveDC && (
                                    <div><span className="font-medium">Save DC:</span> <span className="text-blue-600 font-semibold">{spell.saveDC}</span></div>
                                  )}
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
                          <div className="px-4 py-3 text-sm text-gray-700 bg-gray-50">
                            {isEditing ? (
                              <textarea
                                value={character.raceDescription}
                                onChange={(e) => handleCharacterChange('raceDescription', e.target.value)}
                                className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-sm min-h-24"
                              />
                            ) : (
                              <p>{character.raceDescription || 'No description provided'}</p>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Class */}
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

                      {/* Subclass */}
                      {character.subclass && (
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
              </div>
            </div>
          </div>

          {/* Right Column - Character Details */}
          <div className="col-span-3 space-y-4">
            {/* Character Info */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h3 className="text-sm font-bold text-gray-700 uppercase mb-3">Character Info</h3>
              <div className="space-y-3 text-sm">
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
      </div>
    </div>
  );
}
