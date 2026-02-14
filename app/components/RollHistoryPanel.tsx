import { useState } from 'react';
import { ChevronUp, ChevronDown, Trash2, Dice5 } from 'lucide-react';
import type { RollResult } from '../utils/diceRoller';
import { formatTimestamp } from '../utils/diceRoller';

// Helper functions defined outside component for accessibility
function getTypeLabel(type: string): string {
  switch (type) {
    case 'ability-check':
      return 'Ability Checks';
    case 'saving-throw':
      return 'Saving Throws';
    case 'skill-check':
      return 'Skill Checks';
    case 'attack':
      return 'Attacks';
    case 'damage':
      return 'Damage Rolls';
    case 'healing':
      return 'Healing';
    default:
      return type;
  }
}

function getTypeColor(type: string): string {
  switch (type) {
    case 'ability-check':
      return 'bg-blue-900 border-blue-700';
    case 'saving-throw':
      return 'bg-purple-900 border-purple-700';
    case 'skill-check':
      return 'bg-green-900 border-green-700';
    case 'attack':
      return 'bg-red-900 border-red-700';
    case 'damage':
      return 'bg-orange-900 border-orange-700';
    case 'healing':
      return 'bg-green-900 border-green-700';
    default:
      return 'bg-gray-800 border-gray-700';
  }
}

export interface DisplayRoll extends RollResult {
  characterName: string;
  isRemote: boolean;
}

interface RollHistoryPanelProps {
  rolls: DisplayRoll[];
  minimized: boolean;
  onToggleMinimize: () => void;
  onClearHistory: () => void;
}

export function RollHistoryPanel({
  rolls,
  minimized,
  onToggleMinimize,
  onClearHistory,
}: RollHistoryPanelProps) {
  const [sortBy, setSortBy] = useState<'recent' | 'type'>('recent');

  // Sort rolls
  const sortedRolls = [...rolls].sort((a, b) => {
    if (sortBy === 'recent') {
      return b.timestamp.getTime() - a.timestamp.getTime();
    }
    return a.type.localeCompare(b.type);
  });

  // Get last roll for minimized display
  const lastRoll = rolls.length > 0 ? rolls[rolls.length - 1] : null;

  // Group rolls by type for display
  const rollsByType = rolls.reduce(
    (acc, roll) => {
      if (!acc[roll.type]) {
        acc[roll.type] = [];
      }
      acc[roll.type].push(roll);
      return acc;
    },
    {} as Record<string, DisplayRoll[]>
  );

  if (minimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={onToggleMinimize}
          className="bg-orange-500 hover:bg-orange-600 text-white rounded-lg p-3 shadow-lg flex items-center gap-2 transition-colors"
          title="Roll History"
        >
          <Dice5 className="w-5 h-5" />
          <span className="font-semibold text-sm">
            {rolls.length > 0 ? lastRoll?.total : 0}
          </span>
          <span className="text-xs opacity-75">({rolls.length})</span>
          <ChevronUp className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 max-h-96 bg-gray-900 border-2 border-orange-500 rounded-lg shadow-2xl flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 border-b border-orange-500 p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Dice5 className="w-5 h-5 text-orange-300" />
          <h3 className="text-lg font-bold text-orange-300">Roll History</h3>
          <span className="text-sm text-gray-400 ml-2">({rolls.length})</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onToggleMinimize}
            className="text-gray-400 hover:text-orange-300 transition-colors p-1"
            title="Minimize"
          >
            <ChevronDown className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Sort and Clear Controls */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-2 flex items-center justify-between text-xs">
        <div className="flex gap-2">
          <button
            onClick={() => setSortBy('recent')}
            className={`px-2 py-1 rounded ${
              sortBy === 'recent'
                ? 'bg-orange-500 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Recent
          </button>
          <button
            onClick={() => setSortBy('type')}
            className={`px-2 py-1 rounded ${
              sortBy === 'type'
                ? 'bg-orange-500 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            By Type
          </button>
        </div>
        <button
          onClick={onClearHistory}
          className="text-gray-400 hover:text-red-400 transition-colors flex items-center gap-1"
          title="Clear history"
        >
          <Trash2 className="w-4 h-4" />
          Clear
        </button>
      </div>

      {/* Roll List */}
      <div className="overflow-y-auto flex-1 p-3">
        {rolls.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 text-sm">No rolls yet</p>
          </div>
        ) : sortBy === 'recent' ? (
          <div className="space-y-2">
            {sortedRolls.map((roll) => (
              <RollItem key={roll.id} roll={roll} />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {Object.entries(rollsByType).map(([type, typeRolls]) => (
              <div key={type}>
                <h4 className="text-xs font-semibold text-gray-400 mb-1 uppercase">
                  {getTypeLabel(type)}
                </h4>
                <div className="space-y-1">
                  {typeRolls.map((roll) => (
                    <RollItem key={roll.id} roll={roll} compact />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
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
          <p
            className={`text-orange-300 font-mono truncate ${compact ? 'text-xs' : 'text-sm'}`}
          >
            {roll.breakdown}
          </p>
          {!compact && (
            <p className="text-xs text-gray-500 mt-1">{formatTimestamp(roll.timestamp)}</p>
          )}
        </div>
        <div
          className={`${getTypeColor(roll.type)} border rounded px-2 py-1 text-right whitespace-nowrap flex-shrink-0`}
        >
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
