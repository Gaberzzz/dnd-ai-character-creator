import { Dice5 } from 'lucide-react';
import type { CharacterData } from '~/types/character';
import { skillToAbility } from '~/utils/characterUtils';
import { card, headingText, subHeadingText, labelText, bodyText, checkboxAccent, btnDice } from '~/utils/theme';

interface SkillsAndSavesPanelProps {
  character: CharacterData;
  isEditing: boolean;
  sortedSkills: [string, { proficient: boolean; value: string }][];
  handleSkillChange: (skillName: string, proficient: boolean) => void;
  handleRollSkillCheck: (skillName: string, modifier: string) => void;
  handleSavingThrowChange: (name: string, proficient: boolean) => void;
  handleRollSavingThrow: (throwName: string, modifier: string) => void;
}

export default function SkillsAndSavesPanel({
  character,
  isEditing,
  sortedSkills,
  handleSkillChange,
  handleRollSkillCheck,
  handleSavingThrowChange,
  handleRollSavingThrow,
}: SkillsAndSavesPanelProps) {
  return (
    <div className="space-y-4">
      {/* Skills */}
      <div className={card}>
        <h3 className={`text-sm font-bold uppercase mb-3 ${headingText}`}>Skills</h3>
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {sortedSkills.map(([skillName, skillData]) => (
            <div key={skillName} className="flex items-center gap-2 group">
              <input
                type="checkbox"
                checked={skillData.proficient}
                onChange={(e) => handleSkillChange(skillName, e.target.checked)}
                disabled={!isEditing}
                className={checkboxAccent}
              />
              <span className={`text-sm flex-1 ${bodyText}`}>
                {skillName.replace(/([A-Z])/g, ' $1').trim()}
                <span className={`text-xs ml-1 ${labelText}`}>({skillToAbility[skillName]})</span>
              </span>
              <div className="flex items-center gap-1">
                <span className={`text-sm font-bold group-hover:text-orange-200 transition-colors ${subHeadingText}`}>{skillData.value}</span>
                {!isEditing && (
                  <button
                    onClick={() => handleRollSkillCheck(skillName.replace(/([A-Z])/g, ' $1').trim(), skillData.value)}
                    className={btnDice}
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
      <div className={card}>
        <h3 className={`text-sm font-bold uppercase mb-3 ${headingText}`}>Saving Throws</h3>
        <div className="space-y-2">
          {Object.entries(character.savingThrows).map(([name, data]) => (
            <div key={name} className="flex items-center gap-2 group">
              <input
                type="checkbox"
                checked={data.proficient}
                onChange={(e) => handleSavingThrowChange(name, e.target.checked)}
                disabled={!isEditing}
                className={checkboxAccent}
              />
              <span className={`text-sm font-medium flex-1 capitalize ${bodyText}`}>{name}</span>
              <div className="flex items-center gap-1">
                <span className={`text-sm font-bold group-hover:text-orange-200 transition-colors ${subHeadingText}`}>{data.value}</span>
                {!isEditing && (
                  <button
                    onClick={() => handleRollSavingThrow(name, data.value)}
                    className={btnDice}
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
  );
}
