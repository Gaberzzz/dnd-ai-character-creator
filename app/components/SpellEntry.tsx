import { Dice5 } from 'lucide-react';
import { cardBg, cardBorder, headingText, subHeadingText, labelText, inputAccent, btnDice, checkboxAccent } from '~/utils/theme';

type AttackType = 'attack' | 'save' | 'auto-hit' | 'none';

interface SpellProps {
  name: string;
  level: string;
  school: string;
  castingTime: string;
  range: string;
  duration: string;
  description: string;
  concentration?: boolean;
  ritual?: boolean;
  components?: string;
  attackType?: AttackType;
  damage?: string;
  altDamage?: string;
  spellAttackBonus?: string;
  spellSaveDC?: string;
  onNameChange?: (value: string) => void;
  onLevelChange?: (value: string) => void;
  onSchoolChange?: (value: string) => void;
  onCastingTimeChange?: (value: string) => void;
  onRangeChange?: (value: string) => void;
  onDurationChange?: (value: string) => void;
  onDescriptionChange?: (value: string) => void;
  onConcentrationChange?: (value: boolean) => void;
  onRitualChange?: (value: boolean) => void;
  onComponentsChange?: (value: string) => void;
  onDelete?: () => void;
  onRollAttack?: (spellName: string, attackBonus: string) => void;
  onRollDamage?: (spellName: string, damageFormula: string, diceSides?: number) => void;
  isHealing?: boolean;
  healingFormula?: string;
  appliesModifier?: boolean;
  onRollHealing?: (spellName: string, healingFormula: string, applyModifier: boolean) => void;
  editable?: boolean;
}

export default function SpellEntry({
  name,
  level,
  school,
  castingTime,
  range,
  duration,
  description,
  concentration = false,
  ritual = false,
  components = '',
  attackType = 'none',
  damage,
  altDamage,
  spellAttackBonus,
  spellSaveDC,
  onNameChange,
  onLevelChange,
  onSchoolChange,
  onCastingTimeChange,
  onRangeChange,
  onDurationChange,
  onDescriptionChange,
  onConcentrationChange,
  onRitualChange,
  onComponentsChange,
  onDelete,
  onRollAttack,
  onRollDamage,
  isHealing = false,
  healingFormula,
  appliesModifier = false,
  onRollHealing,
  editable = false,
}: SpellProps) {
  const parseSaveDC = (dcString?: string): number | null => {
    if (!dcString) return null;
    const match = dcString.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : null;
  };

  const parseSaveType = (dcString?: string): string | null => {
    if (!dcString) return null;
    const match = dcString.match(/(STR|DEX|CON|INT|WIS|CHA)/i);
    return match ? match[1].toUpperCase() : null;
  };

  const dcValue = parseSaveDC(spellSaveDC);
  const saveType = parseSaveType(spellSaveDC);

  return (
    <div className={`${cardBg} ${cardBorder} rounded-lg p-4 space-y-3`}>
      {/* Spell Name and Header */}
      <div className="flex items-center justify-between gap-2">
        {editable && onNameChange ? (
          <input
            type="text"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="Spell Name"
            className={`flex-1 text-sm font-semibold ${inputAccent}`}
          />
        ) : (
          <span className={`font-semibold flex-1 ${headingText}`}>{name}</span>
        )}
        <div className="flex items-center gap-2">
          {editable && onLevelChange ? (
            <select
              value={level}
              onChange={(e) => onLevelChange(e.target.value)}
              className={`text-xs ${inputAccent}`}
            >
              {Array.from({ length: 10 }, (_, i) => (
                <option key={i} value={i.toString()}>Level {i}</option>
              ))}
            </select>
          ) : (
            <span className={`text-xs font-semibold bg-gray-700 px-2 py-1 rounded ${subHeadingText}`}>
              Level {level}
            </span>
          )}
          {editable && onDelete && (
            <button onClick={onDelete} className="text-red-400 hover:text-red-300 text-sm font-semibold">✕</button>
          )}
        </div>
      </div>

      {/* Attack/Save Info */}
      {!editable && attackType !== 'none' && (
        <div className="bg-gray-700 border border-orange-400 rounded p-3 space-y-2">
          {attackType === 'attack' && spellAttackBonus && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-blue-300">Spell Attack:</span>
              <span className="text-sm font-bold text-blue-400">{spellAttackBonus} to hit</span>
              {onRollAttack && (
                <button onClick={() => onRollAttack(name, spellAttackBonus)} className={btnDice} title={`Roll ${name} Attack`}>
                  <Dice5 className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
          {attackType === 'save' && dcValue && saveType && (
            <div className="text-sm font-medium text-purple-300">
              <span>DC {dcValue}</span>
              <span className="text-purple-400 font-bold ml-2">{saveType}</span>
              <span className="text-purple-300"> Saving Throw</span>
            </div>
          )}
          {attackType === 'auto-hit' && (
            <div className="text-sm font-medium text-green-300">Auto-hit (no roll needed)</div>
          )}
          {damage && (attackType === 'attack' || attackType === 'save' || attackType === 'auto-hit') && (
            <div className="pt-2 border-t border-gray-600 space-y-2">
              {altDamage ? (
                <div className="flex flex-wrap gap-2">
                  <span className={`text-xs w-full ${labelText}`}>Damage Options:</span>
                  <button onClick={() => onRollDamage?.(name, damage, 8)} className={`px-3 py-1 text-xs bg-orange-600 hover:bg-orange-500 text-orange-100 rounded transition-colors flex items-center gap-1`} title={`Roll ${name} Damage (d8)`}>
                    <span>Roll d8</span><Dice5 className="w-3 h-3" />
                  </button>
                  <button onClick={() => onRollDamage?.(name, altDamage, 12)} className={`px-3 py-1 text-xs bg-orange-600 hover:bg-orange-500 text-orange-100 rounded transition-colors flex items-center gap-1`} title={`Roll ${name} Damage (d12)`}>
                    <span>Roll d12</span><Dice5 className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className={`text-xs ${labelText}`}>Damage:</span>
                  <span className={`text-sm ${subHeadingText}`}>{damage}</span>
                  {onRollDamage && (
                    <button onClick={() => onRollDamage(name, damage)} className={btnDice} title={`Roll ${name} Damage`}>
                      <Dice5 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Healing Roll Button */}
      {!editable && isHealing && healingFormula && healingFormula !== '0' && (
        <div className="bg-green-900/30 border border-green-600 rounded p-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-green-400">Healing:</span>
            <span className="text-sm text-green-300 font-medium">{healingFormula}{appliesModifier ? ' + modifier' : ''}</span>
            {onRollHealing && (
              <button onClick={() => onRollHealing(name, healingFormula, appliesModifier)} className="ml-auto px-3 py-1 text-xs bg-green-600 hover:bg-green-700 text-green-100 rounded transition-colors flex items-center gap-1" title={`Roll ${name} Healing`}>
                <span>Roll Healing</span><Dice5 className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* School and Casting Time */}
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div>
          <span className={labelText}>School</span>
          {editable && onSchoolChange ? (
            <input type="text" value={school} onChange={(e) => onSchoolChange(e.target.value)} placeholder="e.g., Evocation" className={`w-full mt-1 ${inputAccent}`} />
          ) : (
            <div className={`mt-1 ${subHeadingText}`}>{school}</div>
          )}
        </div>
        <div>
          <span className={labelText}>Casting Time</span>
          {editable && onCastingTimeChange ? (
            <input type="text" value={castingTime} onChange={(e) => onCastingTimeChange(e.target.value)} placeholder="e.g., 1 action" className={`w-full mt-1 ${inputAccent}`} />
          ) : (
            <div className={`mt-1 ${subHeadingText}`}>{castingTime}</div>
          )}
        </div>
      </div>

      {/* Range and Duration */}
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div>
          <span className={labelText}>Range</span>
          {editable && onRangeChange ? (
            <input type="text" value={range} onChange={(e) => onRangeChange(e.target.value)} placeholder="e.g., 30 feet" className={`w-full mt-1 ${inputAccent}`} />
          ) : (
            <div className={`mt-1 ${subHeadingText}`}>{range}</div>
          )}
        </div>
        <div>
          <span className={labelText}>Duration</span>
          {editable && onDurationChange ? (
            <input type="text" value={duration} onChange={(e) => onDurationChange(e.target.value)} placeholder="e.g., 1 minute" className={`w-full mt-1 ${inputAccent}`} />
          ) : (
            <div className={`mt-1 ${subHeadingText}`}>{duration}</div>
          )}
        </div>
      </div>

      {/* Concentration, Ritual, Components */}
      <div className="grid grid-cols-3 gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className={labelText}>Concentration</span>
          {editable && onConcentrationChange ? (
            <input type="checkbox" checked={concentration} onChange={(e) => onConcentrationChange(e.target.checked)} className={checkboxAccent} />
          ) : (
            <span className={`px-2 py-0.5 rounded ${concentration ? 'bg-orange-600 text-orange-100' : 'bg-gray-700 text-gray-500'}`}>
              {concentration ? '✓' : '✗'}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className={labelText}>Ritual</span>
          {editable && onRitualChange ? (
            <input type="checkbox" checked={ritual} onChange={(e) => onRitualChange(e.target.checked)} className={checkboxAccent} />
          ) : (
            <span className={`px-2 py-0.5 rounded ${ritual ? 'bg-orange-600 text-orange-100' : 'bg-gray-700 text-gray-500'}`}>
              {ritual ? '✓' : '✗'}
            </span>
          )}
        </div>
        <div>
          <span className={labelText}>Components</span>
          {editable && onComponentsChange ? (
            <input type="text" value={components} onChange={(e) => onComponentsChange(e.target.value)} placeholder="e.g., V, S, M" className={`w-full mt-1 ${inputAccent}`} />
          ) : (
            <div className={`mt-1 ${subHeadingText}`}>{components || '—'}</div>
          )}
        </div>
      </div>

      {/* Description */}
      <div>
        <span className={`text-xs ${labelText}`}>Description</span>
        {editable && onDescriptionChange ? (
          <textarea value={description} onChange={(e) => onDescriptionChange(e.target.value)} placeholder="Spell description and effects..." className={`w-full mt-1 text-xs min-h-20 resize-none bg-gray-700 border border-orange-400 text-orange-300 rounded px-2 py-1`} />
        ) : (
          <p className={`text-xs mt-1 leading-relaxed ${subHeadingText}`}>{description}</p>
        )}
      </div>
    </div>
  );
}
