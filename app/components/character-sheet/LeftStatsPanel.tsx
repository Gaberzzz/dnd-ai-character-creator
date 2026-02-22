import { useState } from 'react';
import type { CharacterData } from '~/types/character';
import AbilityCardsPanel, { type AbilityDef } from './AbilityCardsPanel';
import { card, headingText, subHeadingText, labelText, divider } from '~/utils/theme';
import { getHitDiceByClass, getHitDiceGroups } from '~/utils/characterUtils';

interface LeftStatsPanelProps {
  character: CharacterData;
  isEditing: boolean;
  abilityModifiers: {
    strength: number;
    dexterity: number;
    constitution: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
  };
  proficiencyBonus: number;
  handleCharacterChange: (key: keyof CharacterData, value: any) => void;
  handleRollAbilityCheck: (abilityName: string, modifier: string) => void;
  handleSkillChange: (skillName: string, proficient: boolean) => void;
  handleRollSkillCheck: (skillName: string, modifier: string) => void;
  handleSavingThrowChange: (name: string, proficient: boolean) => void;
  handleRollSavingThrow: (throwName: string, modifier: string) => void;
  parseModifier: (modString: string) => number;
  handleSpendHitDie: (dieSides: number) => void;
}

const PHYSICAL_ABILITIES: AbilityDef[] = [
  { name: 'Strength', key: 'strength', savingThrowKey: 'strength' },
  { name: 'Dexterity', key: 'dexterity', savingThrowKey: 'dexterity' },
  { name: 'Constitution', key: 'constitution', savingThrowKey: 'constitution' },
];

export default function LeftStatsPanel({
  character,
  isEditing,
  abilityModifiers,
  proficiencyBonus,
  handleCharacterChange,
  handleRollAbilityCheck,
  handleSkillChange,
  handleRollSkillCheck,
  handleSavingThrowChange,
  handleRollSavingThrow,
  parseModifier,
  handleSpendHitDie,
}: LeftStatsPanelProps) {
  const [showPicker, setShowPicker] = useState(false);

  const hitDiceGroups = getHitDiceGroups(character);
  const hasMultipleTypes = hitDiceGroups.length > 1;
  const allSpent = hitDiceGroups.length > 0 && hitDiceGroups.every(g => g.remaining === 0);
  const remainingDisplay = hitDiceGroups.length > 0
    ? hitDiceGroups.map(g => `${g.remaining}d${g.dieSides}`).join(' + ')
    : getHitDiceByClass(character);

  const handleDieButtonClick = () => {
    if (hasMultipleTypes) {
      setShowPicker(prev => !prev);
    } else if (hitDiceGroups.length === 1 && !allSpent) {
      handleSpendHitDie(hitDiceGroups[0].dieSides);
    }
  };

  const handlePickerSelect = (dieSides: number) => {
    handleSpendHitDie(dieSides);
    setShowPicker(false);
  };

  return (
    <div className="space-y-3">
      {/* Proficiency, Speed, Hit Dice, Passive Senses */}
      <div className={card}>
        <div className="space-y-2">
          {[
            { label: 'Proficiency Bonus', value: `+${proficiencyBonus}` },
            { label: 'Speed', value: character.speed },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between items-center">
              <span className={`text-xs font-medium ${labelText}`}>{label}</span>
              <span className={`text-sm font-bold ${subHeadingText}`}>{value}</span>
            </div>
          ))}
          <div className="relative">
            <div className="flex justify-between items-center">
              <span className={`text-xs font-medium ${labelText}`}>Hit Dice</span>
              <div className="flex items-center gap-1">
                <span className={`text-sm font-bold ${allSpent ? 'text-gray-500' : subHeadingText}`}>
                  {remainingDisplay}
                </span>
                <button
                  onClick={handleDieButtonClick}
                  disabled={allSpent}
                  title={allSpent ? 'No hit dice remaining' : 'Spend a hit die to heal (roll + CON)'}
                  className={`text-xs px-1 py-0.5 rounded font-bold transition-colors leading-none ${
                    allSpent
                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  }`}
                >
                  ⚄
                </button>
              </div>
            </div>
            {showPicker && (
              <div className="absolute right-0 top-full mt-1 z-10 bg-gray-800 border border-gray-600 rounded shadow-lg p-2 min-w-[100px]">
                <div className="text-xs text-gray-400 mb-1 font-medium">Choose die:</div>
                {hitDiceGroups.map(group => (
                  <button
                    key={group.dieSides}
                    onClick={() => handlePickerSelect(group.dieSides)}
                    disabled={group.remaining === 0}
                    className={`block w-full text-left text-sm px-2 py-1 rounded mb-0.5 font-bold transition-colors ${
                      group.remaining === 0
                        ? 'text-gray-500 cursor-not-allowed'
                        : 'text-white hover:bg-emerald-600'
                    }`}
                  >
                    {group.remaining}d{group.dieSides}
                    <span className="text-xs font-normal text-gray-400 ml-1">/ {group.total}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className={`border-t ${divider} pt-2`}>
            <div className={`text-xs font-bold uppercase mb-1 ${headingText}`}>Passive Senses</div>
            <div className="space-y-1">
              {[
                { label: 'Perception', key: 'perception' },
                { label: 'Investigation', key: 'investigation' },
                { label: 'Insight', key: 'insight' },
              ].map(({ label, key }) => (
                <div key={key} className="flex justify-between items-center">
                  <span className={`text-xs ${labelText}`}>{label}</span>
                  <span className={`text-xs font-bold ${subHeadingText}`}>
                    {10 + parseModifier(character.skills?.[key]?.value || '+0')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* STR / DEX / CON ability cards */}
      <AbilityCardsPanel
        abilities={PHYSICAL_ABILITIES}
        character={character}
        isEditing={isEditing}
        abilityModifiers={abilityModifiers}
        handleCharacterChange={handleCharacterChange}
        handleRollAbilityCheck={handleRollAbilityCheck}
        handleSkillChange={handleSkillChange}
        handleRollSkillCheck={handleRollSkillCheck}
        handleSavingThrowChange={handleSavingThrowChange}
        handleRollSavingThrow={handleRollSavingThrow}
      />
    </div>
  );
}
