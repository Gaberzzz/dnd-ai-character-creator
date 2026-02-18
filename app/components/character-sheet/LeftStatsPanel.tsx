import { Dice5 } from 'lucide-react';
import type { CharacterData } from '~/types/character';
import { card, headingText, subHeadingText, labelText, inputAccent, btnDice, divider } from '~/utils/theme';

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
  parseModifier: (modString: string) => number;
}

const ABILITIES = [
  { name: 'STR', key: 'strength' as const },
  { name: 'DEX', key: 'dexterity' as const },
  { name: 'CON', key: 'constitution' as const },
  { name: 'INT', key: 'intelligence' as const },
  { name: 'WIS', key: 'wisdom' as const },
  { name: 'CHA', key: 'charisma' as const },
];

export default function LeftStatsPanel({
  character,
  isEditing,
  abilityModifiers,
  proficiencyBonus,
  handleCharacterChange,
  handleRollAbilityCheck,
  parseModifier,
}: LeftStatsPanelProps) {
  return (
    <div className="space-y-4">
      {/* Ability Scores */}
      <div className={card}>
        <h3 className={`text-sm font-bold uppercase mb-3 ${headingText}`}>Ability Scores</h3>
        <div className="grid grid-cols-2 gap-3">
          {ABILITIES.map((ability) => {
            const mod = abilityModifiers[ability.key];
            const score = character[ability.key];
            const modStr = mod >= 0 ? `+${mod}` : `${mod}`;
            return (
              <div key={ability.name} className="bg-gray-700 rounded-lg p-3 text-center border border-gray-600 group">
                <div className={`text-xs font-bold mb-1 ${headingText}`}>{ability.name}</div>
                {isEditing ? (
                  <>
                    <div className={`text-sm mb-1 ${labelText}`}>Mod: {modStr}</div>
                    <input
                      type="number"
                      value={score}
                      onChange={(e) => handleCharacterChange(ability.key, e.target.value)}
                      className={`w-full text-2xl font-bold text-center ${inputAccent}`}
                    />
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-center gap-1">
                      <div className={`text-2xl font-bold ${subHeadingText}`}>{modStr}</div>
                      <button
                        onClick={() => handleRollAbilityCheck(ability.name, modStr)}
                        className={btnDice}
                        title={`Roll ${ability.name} Check`}
                      >
                        <Dice5 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className={`text-sm ${labelText}`}>{score}</div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Proficiency, Speed, Hit Dice, Passive Senses */}
      <div className={card}>
        <div className="space-y-3">
          {[
            { label: 'Proficiency Bonus', value: `+${proficiencyBonus}` },
            { label: 'Speed', value: character.speed },
            { label: 'Hit Dice', value: character.hitDice },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between items-center">
              <span className={`text-sm font-medium ${labelText}`}>{label}</span>
              <span className={`text-lg font-bold ${subHeadingText}`}>{value}</span>
            </div>
          ))}
          <div className={`border-t ${divider} pt-3`}>
            <div className={`text-xs font-bold uppercase mb-2 ${headingText}`}>Passive Senses</div>
            <div className="space-y-2">
              {[
                { label: 'Perception', key: 'perception' },
                { label: 'Investigation', key: 'investigation' },
                { label: 'Insight', key: 'insight' },
              ].map(({ label, key }) => (
                <div key={key} className="flex justify-between items-center">
                  <span className={`text-sm ${labelText}`}>{label}</span>
                  <span className={`text-sm font-bold ${subHeadingText}`}>
                    {10 + parseModifier(character.skills?.[key]?.value || '+0')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
