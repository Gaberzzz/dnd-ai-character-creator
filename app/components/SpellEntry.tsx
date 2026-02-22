import { useState } from 'react';
import { Dice5, ChevronDown, ChevronRight } from 'lucide-react';
import { cardBg, cardBorder, headingText, subHeadingText, labelText, inputAccent, btnDice, checkboxAccent, divider } from '~/utils/theme';

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
  higherLevels?: string;
}

// ── Abbreviation helpers ────────────────────────────────────────────────────

function abbrevCastingTime(ct: string): string {
  const lower = ct.toLowerCase().trim();
  if (lower === '1 action' || lower === 'action') return '1A';
  if (lower === '1 bonus action' || lower === 'bonus action') return '1BA';
  if (lower.includes('reaction')) return '1R';
  if (lower === 'instantaneous') return 'Inst';
  const mMatch = lower.match(/^(\d+)\s*minute/);
  if (mMatch) return `${mMatch[1]}m`;
  const hMatch = lower.match(/^(\d+)\s*hour/);
  if (hMatch) return `${hMatch[1]}h`;
  return ct.slice(0, 5);
}

function abbrevRangeBase(r: string): string {
  const lower = r.toLowerCase().trim();
  if (lower === 'self') return 'Self';
  if (lower === 'touch') return 'Touch';
  if (lower === 'unlimited') return 'Unlim';
  if (lower === 'sight') return 'Sight';
  if (lower === 'special') return 'Spec';
  const feetMatch = lower.match(/^(\d+)\s*feet?$/);
  if (feetMatch) return `${feetMatch[1]}ft`;
  const mileMatch = lower.match(/^(\d+)\s*miles?$/);
  if (mileMatch) return `${mileMatch[1]}mi`;
  return r.slice(0, 8);
}

function parseRange(range: string): { display: string; area?: string } {
  // e.g. "Self (15-foot cone)" or "60 feet (20-foot radius)"
  const parenMatch = range.match(/^(.+?)\s*\((.+)\)$/);
  if (parenMatch) {
    const base = parenMatch[1].trim();
    const areaRaw = parenMatch[2].trim();
    // "15-foot cone" → "15ft cone", "20-foot-radius sphere" → "20ft sphere"
    const area = areaRaw.replace(/(\d+)-foot(?:-radius)?/, '$1ft');
    return { display: abbrevRangeBase(base), area };
  }
  return { display: abbrevRangeBase(range) };
}

function abbrevDuration(dur: string, conc: boolean): string {
  const lower = dur.toLowerCase().trim();
  let abbrev = '';
  if (lower === 'instantaneous') abbrev = 'Inst';
  else if (lower === '1 round') abbrev = '1rnd';
  else if (lower.includes('until dispelled')) abbrev = '∞';
  else if (lower.includes('concentration')) {
    // "Concentration, up to 1 minute" style — extract the time
    const mM = lower.match(/(\d+)\s*minute/);
    const hM = lower.match(/(\d+)\s*hour/);
    if (mM) abbrev = `${mM[1]}m`;
    else if (hM) abbrev = `${hM[1]}h`;
    else abbrev = 'Conc';
  } else {
    const mMatch = lower.match(/^(\d+)\s*minute/);
    if (mMatch) abbrev = `${mMatch[1]}m`;
    else {
      const hMatch = lower.match(/^(\d+)\s*hour/);
      if (hMatch) abbrev = `${hMatch[1]}h`;
      else abbrev = dur.slice(0, 5);
    }
  }
  return conc ? `C·${abbrev}` : abbrev;
}

function abbrevComponents(components?: string): string {
  if (!components) return '';
  // "V, S, M (a bit of fleece)" → "V/S/M"
  return components
    .replace(/\s*\(.+\)/, '')   // strip parenthetical material
    .replace(/,\s*/g, '/')      // "V, S" → "V/S"
    .trim();
}

function buildNotes(duration: string, concentration: boolean, components?: string, area?: string): string {
  const parts: string[] = [];
  const durAbbrev = abbrevDuration(duration, concentration);
  if (durAbbrev) parts.push(durAbbrev);
  const compAbbrev = abbrevComponents(components);
  if (compAbbrev) parts.push(compAbbrev);
  if (area) parts.push(area);
  return parts.join(' · ');
}

function stripDamageType(formula: string): string {
  // "2d6 fire" → "2d6", "1d10 radiant" → "1d10", "1d8+3" stays
  return formula.replace(/\s+[a-zA-Z]+$/, '').trim();
}

function abbrevEffect(
  damage?: string,
  altDamage?: string,
  isHealing?: boolean,
  healingFormula?: string,
  appliesModifier?: boolean,
): string {
  if (damage && altDamage) {
    return `${stripDamageType(damage)}/${stripDamageType(altDamage)}`;
  }
  if (damage) return stripDamageType(damage);
  if (isHealing && healingFormula && healingFormula !== '0') {
    return appliesModifier ? `${healingFormula}+mod` : healingFormula;
  }
  return '—';
}

function abbrevHitDC(
  attackType: AttackType,
  spellAttackBonus?: string,
  spellSaveDC?: string,
  isHealing?: boolean,
): string {
  if (attackType === 'attack') return spellAttackBonus || '—';
  if (attackType === 'save') {
    // spellSaveDC can be "DEX 15" or just "15"
    if (spellSaveDC) {
      const typeMatch = spellSaveDC.match(/(STR|DEX|CON|INT|WIS|CHA)/i);
      const numMatch = spellSaveDC.match(/(\d+)/);
      if (typeMatch && numMatch) return `${typeMatch[1].toUpperCase()} ${numMatch[1]}`;
      if (numMatch) return numMatch[1];
    }
    return '—';
  }
  if (attackType === 'auto-hit') return 'Auto';
  // 'none'
  return isHealing ? 'Heal' : '—';
}

// ── Component ────────────────────────────────────────────────────────────────

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
  higherLevels,
}: SpellProps) {
  const [isExpanded, setIsExpanded] = useState(false);

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

  // ── Editable mode (unchanged) ─────────────────────────────────────────────
  if (editable) {
    return (
      <div className={`${cardBg} ${cardBorder} rounded-lg p-4 space-y-3`}>
        {/* Spell Name and Header */}
        <div className="flex items-center justify-between gap-2">
          {onNameChange ? (
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
            {onLevelChange ? (
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
            {onDelete && (
              <button onClick={onDelete} className="text-red-400 hover:text-red-300 text-sm font-semibold">✕</button>
            )}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <span className={labelText}>School</span>
            {onSchoolChange ? (
              <input type="text" value={school} onChange={(e) => onSchoolChange(e.target.value)} placeholder="e.g., Evocation" className={`w-full mt-1 ${inputAccent}`} />
            ) : (
              <div className={`mt-1 ${subHeadingText}`}>{school}</div>
            )}
          </div>
          <div>
            <span className={labelText}>Casting Time</span>
            {onCastingTimeChange ? (
              <input type="text" value={castingTime} onChange={(e) => onCastingTimeChange(e.target.value)} placeholder="e.g., 1 action" className={`w-full mt-1 ${inputAccent}`} />
            ) : (
              <div className={`mt-1 ${subHeadingText}`}>{castingTime}</div>
            )}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <span className={labelText}>Range</span>
            {onRangeChange ? (
              <input type="text" value={range} onChange={(e) => onRangeChange(e.target.value)} placeholder="e.g., 30 feet" className={`w-full mt-1 ${inputAccent}`} />
            ) : (
              <div className={`mt-1 ${subHeadingText}`}>{range}</div>
            )}
          </div>
          <div>
            <span className={labelText}>Duration</span>
            {onDurationChange ? (
              <input type="text" value={duration} onChange={(e) => onDurationChange(e.target.value)} placeholder="e.g., 1 minute" className={`w-full mt-1 ${inputAccent}`} />
            ) : (
              <div className={`mt-1 ${subHeadingText}`}>{duration}</div>
            )}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className={labelText}>Concentration</span>
            {onConcentrationChange ? (
              <input type="checkbox" checked={concentration} onChange={(e) => onConcentrationChange(e.target.checked)} className={checkboxAccent} />
            ) : (
              <span className={`px-2 py-0.5 rounded ${concentration ? 'bg-orange-600 text-orange-100' : 'bg-gray-700 text-gray-500'}`}>
                {concentration ? '✓' : '✗'}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className={labelText}>Ritual</span>
            {onRitualChange ? (
              <input type="checkbox" checked={ritual} onChange={(e) => onRitualChange(e.target.checked)} className={checkboxAccent} />
            ) : (
              <span className={`px-2 py-0.5 rounded ${ritual ? 'bg-orange-600 text-orange-100' : 'bg-gray-700 text-gray-500'}`}>
                {ritual ? '✓' : '✗'}
              </span>
            )}
          </div>
          <div>
            <span className={labelText}>Components</span>
            {onComponentsChange ? (
              <input type="text" value={components} onChange={(e) => onComponentsChange(e.target.value)} placeholder="e.g., V, S, M" className={`w-full mt-1 ${inputAccent}`} />
            ) : (
              <div className={`mt-1 ${subHeadingText}`}>{components || '—'}</div>
            )}
          </div>
        </div>
        <div>
          <span className={`text-xs ${labelText}`}>Description</span>
          {onDescriptionChange ? (
            <textarea value={description} onChange={(e) => onDescriptionChange(e.target.value)} placeholder="Spell description and effects..." className={`w-full mt-1 text-xs min-h-20 resize-none bg-gray-700 border border-orange-400 text-orange-300 rounded px-2 py-1`} />
          ) : (
            <p className={`text-xs mt-1 leading-relaxed ${subHeadingText}`}>{description}</p>
          )}
        </div>
      </div>
    );
  }

  // ── Display mode: accordion ────────────────────────────────────────────────
  const { display: rangeDisplay, area } = parseRange(range);
  const timeAbbrev = abbrevCastingTime(castingTime);
  const hitDC = abbrevHitDC(attackType, spellAttackBonus, spellSaveDC, isHealing);
  const effect = abbrevEffect(damage, altDamage, isHealing, healingFormula, appliesModifier);
  const notes = buildNotes(duration, concentration, components, area);

  const hasRollContent =
    (attackType !== 'none' && (damage || attackType === 'attack' || attackType === 'auto-hit')) ||
    (isHealing && healingFormula && healingFormula !== '0');

  return (
    <div className={`${cardBg} ${cardBorder} rounded-lg overflow-hidden`}>
      {/* ── Collapsed row ── */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-700/40 transition-colors text-left"
      >
        {/* Chevron */}
        <span className="text-gray-500 flex-shrink-0">
          {isExpanded
            ? <ChevronDown className="w-3.5 h-3.5" />
            : <ChevronRight className="w-3.5 h-3.5" />}
        </span>

        {/* Name */}
        <span className={`font-semibold text-sm flex-1 min-w-0 truncate ${headingText}`}>
          {name}
        </span>

        {/* Time */}
        <span className="text-xs font-mono w-10 flex-shrink-0 text-center text-amber-300" title={`Casting Time: ${castingTime}`}>
          {timeAbbrev}
        </span>

        {/* Range */}
        <span className="text-xs w-14 flex-shrink-0 text-center text-sky-300 truncate" title={`Range: ${range}`}>
          {rangeDisplay}
        </span>

        {/* Hit/DC */}
        <span
          className={`text-xs w-16 flex-shrink-0 text-center font-mono ${
            attackType === 'attack' ? 'text-blue-300' :
            attackType === 'save' ? 'text-purple-300' :
            attackType === 'auto-hit' ? 'text-green-300' :
            isHealing ? 'text-emerald-300' :
            'text-gray-500'
          }`}
          title={
            attackType === 'attack' ? `Spell Attack: ${spellAttackBonus}` :
            attackType === 'save' ? `Save DC: ${spellSaveDC}` :
            attackType === 'auto-hit' ? 'Auto-hit' :
            isHealing ? 'Healing spell' : 'No attack'
          }
        >
          {hitDC}
        </span>

        {/* Effect */}
        <span
          className={`text-xs w-16 flex-shrink-0 text-center font-mono ${
            isHealing ? 'text-emerald-300' : effect !== '—' ? 'text-orange-300' : 'text-gray-500'
          }`}
          title={
            damage ? `Damage: ${damage}` :
            healingFormula ? `Healing: ${healingFormula}` : ''
          }
        >
          {effect}
        </span>

        {/* Notes */}
        <span className={`text-xs flex-shrink min-w-0 truncate text-right ${labelText}`} title={`Duration: ${duration} | Components: ${components}`}>
          {notes || '—'}
        </span>
      </button>

      {/* ── Expanded panel ── */}
      {isExpanded && (
        <div className={`border-t ${divider} px-4 py-3 space-y-3`}>

          {/* Roll buttons */}
          {hasRollContent && (
            <div className="flex flex-wrap items-center gap-2">
              {attackType === 'attack' && spellAttackBonus && onRollAttack && (
                <button
                  onClick={() => onRollAttack(name, spellAttackBonus)}
                  className={`${btnDice} flex items-center gap-1.5 px-3 py-1.5 text-xs`}
                  title={`Roll ${name} Attack`}
                >
                  <Dice5 className="w-3.5 h-3.5" />
                  <span>Attack {spellAttackBonus}</span>
                </button>
              )}
              {attackType === 'save' && dcValue && saveType && (
                <span className="text-xs font-medium text-purple-300 px-2 py-1 bg-purple-900/30 border border-purple-700 rounded">
                  DC {dcValue} {saveType} Save
                </span>
              )}
              {attackType === 'auto-hit' && (
                <span className="text-xs font-medium text-green-300 px-2 py-1 bg-green-900/30 border border-green-700 rounded">
                  Auto-hit
                </span>
              )}
              {damage && (attackType === 'attack' || attackType === 'save' || attackType === 'auto-hit') && onRollDamage && (
                altDamage ? (
                  <>
                    <button
                      onClick={() => onRollDamage(name, damage, 8)}
                      className="px-3 py-1.5 text-xs bg-orange-700 hover:bg-orange-600 text-orange-100 rounded transition-colors flex items-center gap-1.5"
                    >
                      <Dice5 className="w-3.5 h-3.5" />
                      <span>d8 ({stripDamageType(damage)})</span>
                    </button>
                    <button
                      onClick={() => onRollDamage(name, altDamage, 12)}
                      className="px-3 py-1.5 text-xs bg-orange-700 hover:bg-orange-600 text-orange-100 rounded transition-colors flex items-center gap-1.5"
                    >
                      <Dice5 className="w-3.5 h-3.5" />
                      <span>d12 ({stripDamageType(altDamage)})</span>
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => onRollDamage(name, damage)}
                    className="px-3 py-1.5 text-xs bg-orange-700 hover:bg-orange-600 text-orange-100 rounded transition-colors flex items-center gap-1.5"
                  >
                    <Dice5 className="w-3.5 h-3.5" />
                    <span>Damage {damage}</span>
                  </button>
                )
              )}
              {isHealing && healingFormula && healingFormula !== '0' && onRollHealing && (
                <button
                  onClick={() => onRollHealing(name, healingFormula, appliesModifier)}
                  className="px-3 py-1.5 text-xs bg-emerald-700 hover:bg-emerald-600 text-emerald-100 rounded transition-colors flex items-center gap-1.5"
                >
                  <Dice5 className="w-3.5 h-3.5" />
                  <span>Heal {healingFormula}{appliesModifier ? '+mod' : ''}</span>
                </button>
              )}
            </div>
          )}

          {/* Detail grid */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
            <div className="flex gap-1.5">
              <span className={labelText}>School:</span>
              <span className={subHeadingText}>{school}</span>
            </div>
            <div className="flex gap-1.5">
              <span className={labelText}>Time:</span>
              <span className={subHeadingText}>{castingTime}</span>
            </div>
            <div className="flex gap-1.5">
              <span className={labelText}>Range:</span>
              <span className={subHeadingText}>{range}</span>
            </div>
            <div className="flex gap-1.5">
              <span className={labelText}>Duration:</span>
              <span className={subHeadingText}>{duration}</span>
            </div>
          </div>

          {/* Flags row */}
          <div className="flex flex-wrap gap-2 text-xs">
            {concentration && (
              <span className="px-2 py-0.5 rounded bg-orange-700/60 text-orange-200 font-medium">Concentration</span>
            )}
            {ritual && (
              <span className="px-2 py-0.5 rounded bg-indigo-700/60 text-indigo-200 font-medium">Ritual</span>
            )}
            {components && (
              <span className={`px-2 py-0.5 rounded bg-gray-700 ${subHeadingText}`}>
                {components}
              </span>
            )}
          </div>

          {/* Description */}
          {description && (
            <p className={`text-xs leading-relaxed ${subHeadingText}`}>{description}</p>
          )}

          {/* Higher levels / cantrip scaling */}
          {higherLevels && (
            <div className="border-t border-gray-700 pt-2">
              <p className="text-xs leading-relaxed text-amber-200/80">
                <span className="font-semibold text-amber-300">
                  {level === '0' ? 'Cantrip Scaling. ' : 'At Higher Levels. '}
                </span>
                {higherLevels.replace(/^(At Higher Levels\.?\s*|Cantrip Scaling\.?\s*)/i, '')}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
