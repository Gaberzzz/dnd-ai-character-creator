import { Dice5 } from 'lucide-react';
import type { CharacterData } from '~/types/character';
import { abilityToSkills } from '~/utils/characterUtils';
import { card, headingText, subHeadingText, labelText, bodyText, inputAccent, checkboxAccent, btnDice, divider } from '~/utils/theme';

export interface AbilityDef {
  name: string;
  key: 'strength' | 'dexterity' | 'constitution' | 'intelligence' | 'wisdom' | 'charisma';
  savingThrowKey: string;
}

interface AbilityCardsPanelProps {
  abilities: AbilityDef[];
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
  handleCharacterChange: (key: keyof CharacterData, value: any) => void;
  handleRollAbilityCheck: (abilityName: string, modifier: string) => void;
  handleSkillChange: (skillName: string, proficient: boolean) => void;
  handleRollSkillCheck: (skillName: string, modifier: string) => void;
  handleSavingThrowChange: (name: string, proficient: boolean) => void;
  handleRollSavingThrow: (throwName: string, modifier: string) => void;
}

function formatSkillName(skillKey: string): string {
  return skillKey.replace(/([A-Z])/g, ' $1').trim();
}

export default function AbilityCardsPanel({
  abilities,
  character,
  isEditing,
  abilityModifiers,
  handleCharacterChange,
  handleRollAbilityCheck,
  handleSkillChange,
  handleRollSkillCheck,
  handleSavingThrowChange,
  handleRollSavingThrow,
}: AbilityCardsPanelProps) {
  return (
    <div className="space-y-3">
      {abilities.map((ability) => {
        const mod = abilityModifiers[ability.key];
        const score = character[ability.key];
        const modStr = mod >= 0 ? `+${mod}` : `${mod}`;
        const savingThrow = character.savingThrows?.[ability.savingThrowKey];
        const skills = abilityToSkills[ability.name] ?? [];

        return (
          <div key={ability.name} className={card}>
            {/* Ability header: name + score */}
            <div className="flex items-center justify-between mb-2">
              <span className={`text-xs font-bold uppercase ${headingText}`}>{ability.name}</span>
              {isEditing ? (
                <input
                  type="number"
                  value={score}
                  onChange={(e) => handleCharacterChange(ability.key, e.target.value)}
                  className={`w-14 text-center text-sm font-bold ${inputAccent}`}
                />
              ) : (
                <span className={`text-sm ${labelText}`}>{score}</span>
              )}
            </div>

            {/* Modifier + roll button */}
            <div className="flex items-center gap-1 mb-2">
              <span className={`text-2xl font-bold ${subHeadingText}`}>{modStr}</span>
              {!isEditing && (
                <button
                  onClick={() => handleRollAbilityCheck(ability.name, modStr)}
                  className={btnDice}
                  title={`Roll ${ability.name} Check`}
                >
                  <Dice5 className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Divider */}
            <div className={`border-t ${divider} mb-2`} />

            {/* Saving Throw */}
            {savingThrow && (
              <div className="flex items-center gap-2 group mb-1">
                <input
                  type="checkbox"
                  checked={savingThrow.proficient}
                  onChange={(e) => handleSavingThrowChange(ability.savingThrowKey, e.target.checked)}
                  disabled={!isEditing}
                  className={checkboxAccent}
                />
                <span className={`text-xs flex-1 font-medium ${bodyText}`}>Saving Throw</span>
                <div className="flex items-center gap-1">
                  <span className={`text-xs font-bold group-hover:text-orange-200 transition-colors ${subHeadingText}`}>
                    {savingThrow.value}
                  </span>
                  {!isEditing && (
                    <button
                      onClick={() => handleRollSavingThrow(ability.savingThrowKey, savingThrow.value)}
                      className={btnDice}
                      title={`Roll ${ability.name} Save`}
                    >
                      <Dice5 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Skills */}
            {skills.map((skillKey) => {
              const skillData = character.skills?.[skillKey];
              if (!skillData) return null;
              const displayName = formatSkillName(skillKey);
              return (
                <div key={skillKey} className="flex items-center gap-2 group">
                  <input
                    type="checkbox"
                    checked={skillData.proficient}
                    onChange={(e) => handleSkillChange(skillKey, e.target.checked)}
                    disabled={!isEditing}
                    className={checkboxAccent}
                  />
                  <span className={`text-xs flex-1 ${bodyText}`}>{displayName}</span>
                  <div className="flex items-center gap-1">
                    <span className={`text-xs font-bold group-hover:text-orange-200 transition-colors ${subHeadingText}`}>
                      {skillData.value}
                    </span>
                    {!isEditing && (
                      <button
                        onClick={() => handleRollSkillCheck(displayName, skillData.value)}
                        className={btnDice}
                        title={`Roll ${displayName} Check`}
                      >
                        <Dice5 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
