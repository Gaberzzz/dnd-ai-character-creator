import { X } from 'lucide-react';
import SpellEntry from '~/components/SpellEntry';
import type { CharacterData } from '~/types/character';
import { getSpellAttackType, hasVariableDamage, detectHealingSpell, getHealingSpell, extractHealingFormulaFromDescription } from '~/utils/spellAttackConfig';
import { calculateSpellSlots, SPELL_LEVEL_LABELS } from '~/utils/characterUtils';
import { cardBgAlt, cardBorder, headingText, subHeadingText, labelText, inputBase, inputAccent, btnSmall, checkboxAccent, divider } from '~/utils/theme';

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
  handleSpellSlotChange: (key: string, delta: number) => void;
}

function SpellSlotPips({
  total,
  used,
  onToggle,
}: {
  total: number;
  used: number;
  onToggle: (delta: number) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: total }).map((_, i) => {
        const isUsed = i < used;
        return (
          <button
            key={i}
            onClick={() => onToggle(isUsed ? -1 : 1)}
            title={isUsed ? 'Mark slot available' : 'Mark slot used'}
            className={`w-4 h-4 rounded-full border transition-colors ${
              isUsed
                ? 'bg-orange-500 border-orange-400'
                : 'bg-gray-700 border-gray-500 hover:border-orange-400'
            }`}
          />
        );
      })}
    </div>
  );
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
  handleSpellSlotChange,
}: SpellsTabProps) {
  const { slots, warlockSlots } = calculateSpellSlots(character);
  const usedSlots = character.usedSpellSlots || {};

  const hasAnySlots = slots.some(s => s > 0) || !!warlockSlots;

  // Group spells by level for display mode
  const spellsByLevel: Record<string, CharacterData['spells']> = {};
  const spellIndexByLevel: Record<string, number[]> = {};
  character.spells.forEach((spell, idx) => {
    const lvl = spell.level || '0';
    if (!spellsByLevel[lvl]) { spellsByLevel[lvl] = []; spellIndexByLevel[lvl] = []; }
    spellsByLevel[lvl].push(spell);
    spellIndexByLevel[lvl].push(idx);
  });
  const sortedLevels = Object.keys(spellsByLevel).sort((a, b) => parseInt(a) - parseInt(b));

  return (
    <div className="space-y-4">
      {/* Header */}
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

      {/* Spell Slot Tracker */}
      {hasAnySlots && (
        <div className={`${cardBgAlt} rounded-lg p-3 space-y-2`}>
          <h4 className={`text-sm font-semibold ${subHeadingText}`}>Spell Slots</h4>
          <div className="space-y-1">
            {slots.map((total, i) => {
              if (total === 0) return null;
              const level = i + 1;
              const key = String(level);
              const used = usedSlots[key] || 0;
              return (
                <div key={level} className="flex items-center gap-3">
                  <span className={`text-xs w-10 flex-shrink-0 ${labelText}`}>{SPELL_LEVEL_LABELS[i]}</span>
                  <SpellSlotPips total={total} used={used} onToggle={(d) => handleSpellSlotChange(key, d)} />
                  <span className={`text-xs ${labelText}`}>{used}/{total}</span>
                  <div className="flex gap-1 ml-auto">
                    <button
                      onClick={() => handleSpellSlotChange(key, -1)}
                      disabled={used === 0}
                      className="w-5 h-5 rounded bg-gray-600 hover:bg-gray-500 text-gray-300 text-xs disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center"
                    >−</button>
                    <button
                      onClick={() => handleSpellSlotChange(key, 1)}
                      disabled={used >= total}
                      className="w-5 h-5 rounded bg-gray-600 hover:bg-gray-500 text-gray-300 text-xs disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center"
                    >+</button>
                  </div>
                </div>
              );
            })}
            {warlockSlots && (() => {
              const key = 'warlock';
              const used = usedSlots[key] || 0;
              const { count, level } = warlockSlots;
              return (
                <div className={`flex items-center gap-3 pt-1 mt-1 border-t ${divider}`}>
                  <span className={`text-xs w-10 flex-shrink-0 ${labelText}`}>Pact</span>
                  <SpellSlotPips total={count} used={used} onToggle={(d) => handleSpellSlotChange(key, d)} />
                  <span className={`text-xs ${labelText}`}>{used}/{count} (lv{level})</span>
                  <div className="flex gap-1 ml-auto">
                    <button
                      onClick={() => handleSpellSlotChange(key, -1)}
                      disabled={used === 0}
                      className="w-5 h-5 rounded bg-gray-600 hover:bg-gray-500 text-gray-300 text-xs disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center"
                    >−</button>
                    <button
                      onClick={() => handleSpellSlotChange(key, 1)}
                      disabled={used >= count}
                      className="w-5 h-5 rounded bg-gray-600 hover:bg-gray-500 text-gray-300 text-xs disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center"
                    >+</button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Spell list */}
      <div className="space-y-3">
        {character.spells.length === 0 ? (
          <p className="text-gray-500 italic">No spells known</p>
        ) : isEditing ? (
          // Edit mode: flat list (easier to manage)
          character.spells.map((spell, idx) => (
            <div key={idx} className={`${cardBgAlt} ${cardBorder} rounded-lg p-4`}>
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
              <textarea
                value={spell.higherLevels || ''}
                onChange={(e) => handleSpellChange(idx, 'higherLevels', e.target.value)}
                placeholder="At Higher Levels (upcast effects)"
                className={`w-full text-xs min-h-12 ${inputBase}`}
              />
            </div>
          ))
        ) : (
          // Display mode: grouped by level
          sortedLevels.map(lvl => (
            <div key={lvl}>
              <div className={`flex items-center gap-2 mb-2`}>
                <div className={`flex-1 h-px bg-gray-600`} />
                <span className={`text-xs font-semibold uppercase tracking-wide ${labelText}`}>
                  {parseInt(lvl) === 0 ? 'Cantrip' : `${SPELL_LEVEL_LABELS[parseInt(lvl) - 1]} Level`}
                </span>
                <div className={`flex-1 h-px bg-gray-600`} />
              </div>
              {spellsByLevel[lvl].map((spell, localIdx) => {
                const idx = spellIndexByLevel[lvl][localIdx];
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
                    key={idx}
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
                    higherLevels={spell.higherLevels}
                    editable={false}
                  />
                );
              })}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
