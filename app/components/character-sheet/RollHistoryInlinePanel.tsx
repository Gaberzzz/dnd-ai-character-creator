import { useState, useRef } from 'react';
import { Trash2, Dice5 } from 'lucide-react';
import type { DisplayRoll } from '~/components/RollHistoryPanel';
import { formatTimestamp, rollCustomFormula } from '~/utils/diceRoller';
import type { RollResult } from '~/utils/diceRoller';
import { card, headingText, subHeadingText, labelText, divider } from '~/utils/theme';

interface RollHistoryInlinePanelProps {
  rolls: DisplayRoll[];
  onClearHistory: () => void;
  addRoll: (roll: RollResult) => void;
}

function getTypeLabel(type: string): string {
  switch (type) {
    case 'ability-check': return 'Ability Checks';
    case 'saving-throw':  return 'Saving Throws';
    case 'skill-check':   return 'Skill Checks';
    case 'attack':        return 'Attacks';
    case 'damage':        return 'Damage Rolls';
    case 'healing':       return 'Healing';
    case 'custom':        return 'Custom Rolls';
    default:              return type;
  }
}

function getTypeColor(type: string): string {
  switch (type) {
    case 'ability-check': return 'bg-blue-900 border-blue-700';
    case 'saving-throw':  return 'bg-purple-900 border-purple-700';
    case 'skill-check':   return 'bg-green-900 border-green-700';
    case 'attack':        return 'bg-red-900 border-red-700';
    case 'damage':        return 'bg-orange-900 border-orange-700';
    case 'healing':       return 'bg-green-900 border-green-700';
    case 'custom':        return 'bg-gray-700 border-gray-500';
    default:              return 'bg-gray-800 border-gray-700';
  }
}

interface RollItemProps {
  roll: DisplayRoll;
  compact?: boolean;
}

function RollItem({ roll, compact = false }: RollItemProps) {
  const borderClass = roll.isRemote
    ? 'border-l-4 border-l-blue-500'
    : 'border-l-4 border-l-orange-500';

  return (
    <div
      className={`bg-gray-800 border border-gray-700 rounded p-2 hover:border-orange-500 transition-colors ${borderClass} ${compact ? 'p-1' : ''}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className={`text-gray-400 truncate ${compact ? 'text-[10px]' : 'text-xs'}`}>
            {roll.characterName}
          </p>
          <p className={`text-gray-200 font-semibold truncate ${compact ? 'text-xs' : 'text-sm'}`}>
            {roll.name}
          </p>
          <p className={`text-orange-300 font-mono truncate ${compact ? 'text-xs' : 'text-sm'}`}>
            {roll.breakdown}
          </p>
          {!compact && (
            <p className="text-xs text-gray-500 mt-1">{formatTimestamp(roll.timestamp)}</p>
          )}
        </div>
        <div className={`${getTypeColor(roll.type)} border rounded px-2 py-1 text-right whitespace-nowrap flex-shrink-0`}>
          <p className={`font-bold text-white ${compact ? 'text-xs' : 'text-sm'}`}>
            {roll.total}
          </p>
          {!compact && (
            <p className="text-xs text-gray-300">{roll.formula}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function RollHistoryInlinePanel({ rolls, onClearHistory, addRoll }: RollHistoryInlinePanelProps) {
  const [sortBy, setSortBy] = useState<'recent' | 'type'>('recent');
  const [formula, setFormula] = useState('');
  const [invalid, setInvalid] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleRoll() {
    const result = rollCustomFormula(formula);
    if (!result) {
      setInvalid(true);
      setTimeout(() => setInvalid(false), 600);
      return;
    }
    addRoll(result);
    setFormula('');
    inputRef.current?.focus();
  }

  const sortedRolls = [...rolls].sort((a, b) =>
    sortBy === 'recent'
      ? b.timestamp.getTime() - a.timestamp.getTime()
      : a.type.localeCompare(b.type)
  );

  const rollsByType = rolls.reduce((acc, roll) => {
    if (!acc[roll.type]) acc[roll.type] = [];
    acc[roll.type].push(roll);
    return acc;
  }, {} as Record<string, DisplayRoll[]>);

  return (
    <div className={`${card} flex flex-col`} style={{ height: '80vh', minHeight: '400px' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Dice5 className={`w-4 h-4 ${subHeadingText}`} />
          <h3 className={`text-sm font-bold uppercase ${headingText}`}>
            Roll History
          </h3>
          <span className={`text-xs ${labelText}`}>({rolls.length})</span>
        </div>
        <button
          onClick={onClearHistory}
          className={`${labelText} hover:text-red-400 transition-colors flex items-center gap-1 text-xs`}
          title="Clear history"
        >
          <Trash2 className="w-3 h-3" />
          Clear
        </button>
      </div>

      {/* Custom Roll Input */}
      <div className="flex gap-2 mb-3">
        <input
          ref={inputRef}
          type="text"
          value={formula}
          onChange={(e) => { setFormula(e.target.value); setInvalid(false); }}
          onKeyDown={(e) => { if (e.key === 'Enter') handleRoll(); }}
          placeholder="2d6+3, d20, 1d8-1…"
          className={`flex-1 bg-gray-700 text-gray-200 text-xs rounded px-2 py-1.5 border outline-none focus:border-orange-500 transition-colors placeholder-gray-500 ${
            invalid ? 'border-red-500 animate-pulse' : 'border-gray-600'
          }`}
        />
        <button
          onClick={handleRoll}
          className="px-2 py-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded text-xs font-medium transition-colors flex items-center gap-1 flex-shrink-0"
        >
          <Dice5 className="w-3 h-3" />
          Roll
        </button>
      </div>

      {/* Sort Controls */}
      <div className={`flex gap-2 mb-3 pb-3 border-b ${divider}`}>
        <button
          onClick={() => setSortBy('recent')}
          className={`px-2 py-1 rounded text-xs ${
            sortBy === 'recent'
              ? 'bg-orange-500 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          Recent
        </button>
        <button
          onClick={() => setSortBy('type')}
          className={`px-2 py-1 rounded text-xs ${
            sortBy === 'type'
              ? 'bg-orange-500 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          By Type
        </button>
      </div>

      {/* Roll List */}
      <div className="overflow-y-auto flex-1 space-y-2 pr-1">
        {rolls.length === 0 ? (
          <div className="text-center py-8">
            <p className={`text-sm ${labelText}`}>No rolls yet</p>
          </div>
        ) : sortBy === 'recent' ? (
          sortedRolls.map((roll) => (
            <RollItem key={roll.id} roll={roll} />
          ))
        ) : (
          Object.entries(rollsByType).map(([type, typeRolls]) => (
            <div key={type}>
              <h4 className={`text-xs font-semibold uppercase mb-1 ${labelText}`}>
                {getTypeLabel(type)}
              </h4>
              <div className="space-y-1 mb-2">
                {typeRolls.map((roll) => (
                  <RollItem key={roll.id} roll={roll} compact />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
