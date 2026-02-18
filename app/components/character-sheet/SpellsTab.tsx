import { X } from 'lucide-react';
import SpellEntry from '~/components/SpellEntry';
import type { CharacterData } from '~/types/character';
import { getSpellAttackType, hasVariableDamage, detectHealingSpell, getHealingSpell, extractHealingFormulaFromDescription } from '~/utils/spellAttackConfig';
import { cardBgAlt, cardBorder, headingText, subHeadingText, labelText, inputBase, inputAccent, btnSmall, checkboxAccent } from '~/utils/theme';

interface SpellsTabProps {
  character: CharacterData;
  isEditing: boolean;
  handleSpellChange: (index: number, key: keyof CharacterData['spells'][0], value: string) => void;
  handleAddSpell: () => void;
  handleDeleteSpell: (index: number) => void;
  handleCharacterChange: (key: keyof CharacterData, value: any) => void;
  handleRollAttack: (weaponName: string, bonus: string) => void;
  handleRollDamage: (weaponName: string, damageFormula: string, diceSides?: number) => void;
  handleRollHealing: (spellName: string, healingFormula: string, applyModifier: boolean) => void;
}

export default function SpellsTab({
  character,
  isEditing,
  handleSpellChange,
  handleAddSpell,
  handleDeleteSpell,
  handleCharacterChange,
  handleRollAttack,
  handleRollDamage,
  handleRollHealing,
}: SpellsTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className={`text-lg font-bold ${headingText}`}>Spells</h3>
        <div className="flex items-center gap-4">
          {isEditing && (
            <button onClick={handleAddSpell} className={btnSmall}>+ Add Spell</button>
          )}
          <div className="flex gap-4 text-sm">
            <div>
              <span className={labelText}>Spell Save DC: </span>
              <span className={`font-bold ${subHeadingText}`}>{character.spellSaveDC}</span>
            </div>
            <div>
              <span className={labelText}>Spell Attack: </span>
              <span className={`font-bold ${subHeadingText}`}>{character.spellAttackBonus}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {character.spells.length === 0 ? (
          <p className="text-gray-500 italic">No spells known</p>
        ) : (
          character.spells.map((spell, idx) => (
            <div key={idx} className={isEditing ? `${cardBgAlt} ${cardBorder} rounded-lg p-4` : ''}>
              {isEditing ? (
                <>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={spell.name}
                        onChange={(e) => handleSpellChange(idx, 'name', e.target.value)}
                        className={`w-full font-bold mb-1 ${inputAccent}`}
                      />
                      <div className="text-xs flex gap-2">
                        <select
                          value={spell.level}
                          onChange={(e) => handleSpellChange(idx, 'level', e.target.value)}
                          className={inputBase}
                        >
                          {Array.from({ length: 10 }, (_, i) => (
                            <option key={i} value={i.toString()}>Level {i}</option>
                          ))}
                        </select>
                        <input
                          type="text"
                          value={spell.school}
                          onChange={(e) => handleSpellChange(idx, 'school', e.target.value)}
                          placeholder="School"
                          className={`flex-1 ${inputBase}`}
                        />
                      </div>
                    </div>
                    <button onClick={() => handleDeleteSpell(idx)} className="text-red-400 hover:text-red-300 ml-2"><X size={16} /></button>
                  </div>
                  <div className="space-y-1 text-xs mb-2">
                    {(['castingTime', 'range', 'duration'] as const).map(field => (
                      <input
                        key={field}
                        type="text"
                        value={spell[field]}
                        onChange={(e) => handleSpellChange(idx, field, e.target.value)}
                        placeholder={field.replace(/([A-Z])/g, ' $1').trim()}
                        className={`w-full ${inputBase}`}
                      />
                    ))}
                    {(['damage', 'saveDC', 'components'] as const).map(field => (
                      <input
                        key={field}
                        type="text"
                        value={spell[field] || ''}
                        onChange={(e) => handleSpellChange(idx, field, e.target.value)}
                        placeholder={field === 'damage' ? 'Damage (e.g., 2d6 fire)' : field === 'saveDC' ? 'Save DC (e.g., DEX 15)' : 'Components (e.g., V, S, M)'}
                        className={`w-full ${inputBase}`}
                      />
                    ))}
                    <div className="flex gap-2">
                      {(['concentration', 'ritual'] as const).map(field => (
                        <label key={field} className="flex items-center gap-1 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={spell[field] || false}
                            onChange={(e) => {
                              const newSpells = [...character.spells];
                              newSpells[idx] = { ...newSpells[idx], [field]: e.target.checked };
                              handleCharacterChange('spells', newSpells);
                            }}
                            className={checkboxAccent}
                          />
                          <span className={`text-xs capitalize ${labelText}`}>{field}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <textarea
                    value={spell.description}
                    onChange={(e) => handleSpellChange(idx, 'description', e.target.value)}
                    placeholder="Description"
                    className={`w-full text-xs min-h-20 ${inputBase}`}
                  />
                </>
              ) : (() => {
                const spellConfig = getSpellAttackType(spell.name);
                const attackType = spell.attackType || spellConfig.attackType;
                const hasVarDamage = hasVariableDamage(spell.name);
                let altDamage: string | undefined;
                if (hasVarDamage && spellConfig.variableDamage && spellConfig.variableDamage.length > 1) {
                  altDamage = spell.altDamage || `1d${spellConfig.variableDamage[1].diceSides}`;
                }
                const healingInfo = detectHealingSpell(spell.name, spell.description);
                let healingFormula: string | undefined;
                if (healingInfo.isHealing) {
                  const healConfig = getHealingSpell(spell.name);
                  healingFormula = (healConfig && healConfig.healingDice !== '0') ? healConfig.healingDice : (extractHealingFormulaFromDescription(spell.description) || undefined);
                }
                return (
                  <SpellEntry
                    name={spell.name}
                    level={spell.level}
                    school={spell.school}
                    castingTime={spell.castingTime}
                    range={spell.range}
                    duration={spell.duration}
                    description={spell.description}
                    concentration={spell.concentration}
                    ritual={spell.ritual}
                    components={spell.components}
                    attackType={attackType}
                    damage={spell.damage}
                    altDamage={altDamage}
                    spellAttackBonus={character.spellAttackBonus}
                    spellSaveDC={spell.saveDC || character.spellSaveDC}
                    onRollAttack={handleRollAttack}
                    onRollDamage={handleRollDamage}
                    isHealing={healingInfo.isHealing}
                    healingFormula={healingFormula}
                    appliesModifier={healingInfo.appliesModifier}
                    onRollHealing={handleRollHealing}
                    editable={false}
                  />
                );
              })()}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
