import { ChevronDown, X, Dice5 } from 'lucide-react';
import SpellEntry from '~/components/SpellEntry';
import type { CharacterData } from '~/types/character';
import type { BonusDamageFeature } from '~/utils/bonusDamageFeatures';
import { getSpellAttackType, hasVariableDamage, detectHealingSpell, getHealingSpell, extractHealingFormulaFromDescription } from '~/utils/spellAttackConfig';
import { cardAlt, cardBgAlt, cardBorder, headingText, subHeadingText, labelText, bodyText, inputBase, inputAccent, btnSmall, btnDice, checkboxAccent, divider } from '~/utils/theme';

interface ActionsTabProps {
  character: CharacterData;
  isEditing: boolean;
  bonusDamageFeatures: BonusDamageFeature[];
  openSmitePicker: string | null;
  setOpenSmitePicker: (key: string | null) => void;
  handleCharacterChange: (key: keyof CharacterData, value: any) => void;
  handleAttackChange: (index: number, key: 'name' | 'atkBonus' | 'damage', value: string) => void;
  handleAddAttack: () => void;
  handleDeleteAttack: (index: number) => void;
  handleAddCantrip: () => void;
  handleDeleteCantrip: (index: number) => void;
  handleRollAttack: (weaponName: string, bonus: string) => void;
  handleRollDamage: (weaponName: string, damageFormula: string, diceSides?: number) => void;
  handleRollHealing: (spellName: string, healingFormula: string, applyModifier: boolean) => void;
  handleRollBonusDamage: (featureName: string, dice: string) => void;
}

export default function ActionsTab({
  character,
  isEditing,
  bonusDamageFeatures,
  openSmitePicker,
  setOpenSmitePicker,
  handleCharacterChange,
  handleAttackChange,
  handleAddAttack,
  handleDeleteAttack,
  handleAddCantrip,
  handleDeleteCantrip,
  handleRollAttack,
  handleRollDamage,
  handleRollHealing,
  handleRollBonusDamage,
}: ActionsTabProps) {
  return (
    <div className="space-y-6">
      {/* Weapons & Attacks */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-lg font-bold ${headingText}`}>Weapons & Attacks</h3>
          {isEditing && (
            <button onClick={handleAddAttack} className={btnSmall}>+ Add Weapon</button>
          )}
        </div>
        {character.attacks.length > 0 ? (
          <div className="space-y-3">
            {character.attacks.map((attack, idx) => (
              <div key={idx} className={`${cardBgAlt} ${cardBorder} rounded-lg p-4`}>
                <div className="flex items-center justify-between mb-2">
                  {isEditing ? (
                    <input
                      type="text"
                      value={attack.name}
                      onChange={(e) => handleAttackChange(idx, 'name', e.target.value)}
                      className={`flex-1 font-bold ${inputAccent}`}
                    />
                  ) : (
                    <span className={`font-bold ${subHeadingText}`}>{attack.name}</span>
                  )}
                  {isEditing ? (
                    <>
                      <input
                        type="text"
                        value={attack.atkBonus}
                        onChange={(e) => handleAttackChange(idx, 'atkBonus', e.target.value)}
                        className={`w-20 text-sm font-medium ml-2 ${inputAccent}`}
                      />
                      <button onClick={() => handleDeleteAttack(idx)} className="text-red-400 hover:text-red-300 ml-2" title="Delete weapon">
                        <X size={16} />
                      </button>
                    </>
                  ) : (
                    <div className="flex items-center gap-1 group">
                      <span className={`text-sm font-medium group-hover:text-orange-200 transition-colors ${subHeadingText}`}>{attack.atkBonus} to hit</span>
                      <button onClick={() => handleRollAttack(attack.name, attack.atkBonus)} className={btnDice} title={`Roll ${attack.name} Attack`}>
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
                    className={`w-full text-sm ${inputBase}`}
                  />
                ) : (
                  <div className="flex items-center gap-1 group">
                    <div className={`text-sm flex-1 ${bodyText}`}>{attack.damage}</div>
                    <button onClick={() => handleRollDamage(attack.name, attack.damage)} className={btnDice} title={`Roll ${attack.name} Damage`}>
                      <Dice5 className="w-4 h-4" />
                    </button>
                  </div>
                )}
                {/* Bonus Damage Feature Buttons */}
                {!isEditing && bonusDamageFeatures.length > 0 && (
                  <div className={`flex flex-wrap gap-1.5 mt-2 pt-2 border-t ${divider}`}>
                    {bonusDamageFeatures.map((feature, fIdx) => {
                      const pickerKey = `${feature.name}-${idx}`;
                      const isPickerOpen = openSmitePicker === pickerKey;
                      if (feature.options) {
                        return (
                          <div key={fIdx} className="relative">
                            <button
                              onClick={() => setOpenSmitePicker(isPickerOpen ? null : pickerKey)}
                              className="px-2 py-1 text-xs bg-orange-700 hover:bg-orange-600 text-white rounded transition-colors flex items-center gap-1"
                              title={feature.condition}
                            >
                              <span>{feature.label}</span>
                              <ChevronDown className={`w-3 h-3 transition-transform ${isPickerOpen ? 'rotate-180' : ''}`} />
                            </button>
                            {isPickerOpen && (
                              <div className={`absolute left-0 top-full mt-1 ${cardBgAlt} border border-orange-500 rounded-lg shadow-lg z-10 min-w-[160px]`}>
                                {feature.options.map((opt, oIdx) => (
                                  <button
                                    key={oIdx}
                                    onClick={() => handleRollBonusDamage(feature.name, opt.dice)}
                                    className={`w-full text-left px-3 py-1.5 text-xs hover:bg-gray-600 ${bodyText} hover:text-orange-300 transition-colors first:rounded-t-lg last:rounded-b-lg flex items-center justify-between gap-2`}
                                  >
                                    <span>{opt.label}</span>
                                    <Dice5 className={`w-3 h-3 ${headingText}`} />
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      }
                      return (
                        <button
                          key={fIdx}
                          onClick={() => handleRollBonusDamage(feature.name, feature.dice!)}
                          className={`px-2 py-1 text-xs text-white rounded transition-colors flex items-center gap-1 ${feature.critOnly ? 'bg-red-800 hover:bg-red-700' : 'bg-orange-700 hover:bg-orange-600'}`}
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
          <p className="text-gray-500 text-sm italic">No weapons listed</p>
        )}
      </div>

      {/* Cantrips */}
      {(character.cantrips && character.cantrips.length > 0) || isEditing ? (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-lg font-bold ${headingText}`}>Cantrips</h3>
            {isEditing && (
              <button onClick={handleAddCantrip} className={btnSmall}>+ Add Cantrip</button>
            )}
          </div>
          {isEditing ? (
            <div className="space-y-3">
              {character.cantrips.map((cantrip, idx) => (
                <div key={idx} className={`${cardBgAlt} ${cardBorder} rounded-lg p-4`}>
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
                        className={`w-full font-bold mb-1 ${inputAccent}`}
                      />
                      <input
                        type="text"
                        value={cantrip.school}
                        onChange={(e) => {
                          const newCantrips = [...character.cantrips];
                          newCantrips[idx] = { ...newCantrips[idx], school: e.target.value };
                          handleCharacterChange('cantrips', newCantrips);
                        }}
                        placeholder="School"
                        className={`w-full mt-1 text-xs ${inputBase}`}
                      />
                    </div>
                    <button onClick={() => handleDeleteCantrip(idx)} className="text-red-400 hover:text-red-300 ml-2"><X size={16} /></button>
                  </div>
                  <div className="space-y-1 text-xs mb-2">
                    {(['castingTime', 'range', 'duration'] as const).map(field => (
                      <input
                        key={field}
                        type="text"
                        value={cantrip[field]}
                        onChange={(e) => {
                          const newCantrips = [...character.cantrips];
                          newCantrips[idx] = { ...newCantrips[idx], [field]: e.target.value };
                          handleCharacterChange('cantrips', newCantrips);
                        }}
                        placeholder={field.replace(/([A-Z])/g, ' $1').trim()}
                        className={`w-full ${inputBase}`}
                      />
                    ))}
                    {(['damage', 'saveDC', 'components'] as const).map(field => (
                      <input
                        key={field}
                        type="text"
                        value={cantrip[field] || ''}
                        onChange={(e) => {
                          const newCantrips = [...character.cantrips];
                          newCantrips[idx] = { ...newCantrips[idx], [field]: e.target.value };
                          handleCharacterChange('cantrips', newCantrips);
                        }}
                        placeholder={field === 'damage' ? 'Damage (e.g., 1d8 fire)' : field === 'saveDC' ? 'Save DC (e.g., DEX 15)' : 'Components (e.g., V, S, M)'}
                        className={`w-full ${inputBase}`}
                      />
                    ))}
                    <div className="flex gap-2">
                      {(['concentration', 'ritual'] as const).map(field => (
                        <label key={field} className="flex items-center gap-1 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={cantrip[field] || false}
                            onChange={(e) => {
                              const newCantrips = [...character.cantrips];
                              newCantrips[idx] = { ...newCantrips[idx], [field]: e.target.checked };
                              handleCharacterChange('cantrips', newCantrips);
                            }}
                            className={checkboxAccent}
                          />
                          <span className={`text-xs capitalize ${labelText}`}>{field}</span>
                        </label>
                      ))}
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
                    className={`w-full text-xs min-h-20 ${inputBase}`}
                  />
                  <textarea
                    value={cantrip.higherLevels || ''}
                    onChange={(e) => {
                      const newCantrips = [...character.cantrips];
                      newCantrips[idx] = { ...newCantrips[idx], higherLevels: e.target.value };
                      handleCharacterChange('cantrips', newCantrips);
                    }}
                    placeholder="Cantrip Scaling (damage at 5th, 11th, 17th level)"
                    className={`w-full text-xs min-h-12 ${inputBase}`}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {character.cantrips.map((cantrip, idx) => {
                const attackConfig = getSpellAttackType(cantrip.name);
                const hasVarDamage = hasVariableDamage(cantrip.name);
                let altDamage: string | undefined;
                if (hasVarDamage && attackConfig.variableDamage && attackConfig.variableDamage.length > 1) {
                  altDamage = cantrip.altDamage || `1d${attackConfig.variableDamage[1].diceSides}`;
                }
                const healingInfo = detectHealingSpell(cantrip.name, cantrip.description);
                let healingFormula: string | undefined;
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
                    higherLevels={cantrip.higherLevels}
                    editable={false}
                  />
                );
              })}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
