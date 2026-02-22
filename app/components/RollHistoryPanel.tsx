import { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronUp, ChevronDown, Trash2, Dice5, GripVertical } from 'lucide-react';
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

const PANEL_WIDTH = 384;   // w-96
const PANEL_HEIGHT = 420;  // max-h-96 + header + controls
const BUTTON_WIDTH = 130;  // approximate rendered button width
const BUTTON_HEIGHT = 48;  // approximate rendered button height

function getDefaultPosition() {
  if (typeof window === 'undefined') return { x: 16, y: 16 };
  return {
    x: window.innerWidth - BUTTON_WIDTH - 16,
    y: window.innerHeight - BUTTON_HEIGHT - 16,
  };
}

// Compute where the expanded panel should appear, anchored to the button
function computePanelPosition(btnX: number, btnY: number) {
  // Right-align panel to button's right edge, open above by default
  let left = btnX + BUTTON_WIDTH - PANEL_WIDTH;
  let top = btnY - PANEL_HEIGHT - 8;

  // If not enough space above, open below instead
  if (top < 0) top = btnY + BUTTON_HEIGHT + 8;

  // Clamp to viewport
  left = Math.max(0, Math.min(left, window.innerWidth - PANEL_WIDTH));
  top = Math.max(0, Math.min(top, window.innerHeight - PANEL_HEIGHT));

  return { left, top };
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
  const [position, setPosition] = useState(getDefaultPosition);
  const [panelPosition, setPanelPosition] = useState<{ left: number; top: number } | null>(null);

  // Button drag refs
  const isDragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const hasMoved = useRef(false);
  const minimizedRef = useRef(minimized);

  // Panel drag refs
  const isPanelDragging = useRef(false);
  const panelDragOffset = useRef({ x: 0, y: 0 });

  useEffect(() => {
    minimizedRef.current = minimized;
  }, [minimized]);

  // When expanding, initialize panel position anchored to button
  useEffect(() => {
    if (!minimized) {
      setPanelPosition(computePanelPosition(position.x, position.y));
    }
  }, [minimized]); // only re-anchor when toggling open, not on every button drag

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

  // --- Button drag handlers ---

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging.current) {
      hasMoved.current = true;
      const newX = Math.max(0, Math.min(
        e.clientX - dragOffset.current.x,
        window.innerWidth - BUTTON_WIDTH
      ));
      const newY = Math.max(0, Math.min(
        e.clientY - dragOffset.current.y,
        window.innerHeight - BUTTON_HEIGHT
      ));
      setPosition({ x: newX, y: newY });
      return;
    }

    if (isPanelDragging.current) {
      const newLeft = Math.max(0, Math.min(
        e.clientX - panelDragOffset.current.x,
        window.innerWidth - PANEL_WIDTH
      ));
      const newTop = Math.max(0, Math.min(
        e.clientY - panelDragOffset.current.y,
        window.innerHeight - PANEL_HEIGHT
      ));
      setPanelPosition({ left: newLeft, top: newTop });
    }
  }, []);

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
    isPanelDragging.current = false;
    document.body.style.userSelect = '';
  }, []);

  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    const touch = e.touches[0];

    if (isDragging.current) {
      e.preventDefault();
      hasMoved.current = true;
      const newX = Math.max(0, Math.min(
        touch.clientX - dragOffset.current.x,
        window.innerWidth - BUTTON_WIDTH
      ));
      const newY = Math.max(0, Math.min(
        touch.clientY - dragOffset.current.y,
        window.innerHeight - BUTTON_HEIGHT
      ));
      setPosition({ x: newX, y: newY });
      return;
    }

    if (isPanelDragging.current) {
      e.preventDefault();
      const newLeft = Math.max(0, Math.min(
        touch.clientX - panelDragOffset.current.x,
        window.innerWidth - PANEL_WIDTH
      ));
      const newTop = Math.max(0, Math.min(
        touch.clientY - panelDragOffset.current.y,
        window.innerHeight - PANEL_HEIGHT
      ));
      setPanelPosition({ left: newLeft, top: newTop });
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    isDragging.current = false;
    isPanelDragging.current = false;
  }, []);

  useEffect(() => {
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);
    return () => {
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchMove, handleTouchEnd]);

  useEffect(() => {
    const clamp = () => {
      setPosition(p => ({
        x: Math.min(p.x, window.innerWidth - BUTTON_WIDTH),
        y: Math.min(p.y, window.innerHeight - BUTTON_HEIGHT),
      }));
      setPanelPosition(p => p ? {
        left: Math.min(p.left, window.innerWidth - PANEL_WIDTH),
        top: Math.min(p.top, window.innerHeight - PANEL_HEIGHT),
      } : p);
    };
    window.addEventListener('resize', clamp);
    return () => window.removeEventListener('resize', clamp);
  }, []);

  const handleDragStart = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    isDragging.current = true;
    hasMoved.current = false;
    document.body.style.userSelect = 'none';
    dragOffset.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
  }, [position]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    isDragging.current = true;
    hasMoved.current = false;
    dragOffset.current = {
      x: touch.clientX - position.x,
      y: touch.clientY - position.y,
    };
  }, [position]);

  const handlePanelDragStart = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    isPanelDragging.current = true;
    document.body.style.userSelect = 'none';
    const pos = panelPosition ?? computePanelPosition(position.x, position.y);
    panelDragOffset.current = {
      x: e.clientX - pos.left,
      y: e.clientY - pos.top,
    };
  }, [panelPosition, position]);

  const handlePanelTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    isPanelDragging.current = true;
    const pos = panelPosition ?? computePanelPosition(position.x, position.y);
    panelDragOffset.current = {
      x: touch.clientX - pos.left,
      y: touch.clientY - pos.top,
    };
  }, [panelPosition, position]);

  if (minimized) {
    return (
      <div style={{ position: 'fixed', left: position.x, top: position.y }} className="z-50">
        <button
          onMouseDown={handleDragStart}
          onTouchStart={handleTouchStart}
          onClick={() => { if (hasMoved.current) return; onToggleMinimize(); }}
          className="bg-orange-500 hover:bg-orange-600 text-white rounded-lg p-3 shadow-lg flex items-center gap-2 transition-colors cursor-grab active:cursor-grabbing"
          title="Roll History (drag to move)"
        >
          <GripVertical className="w-4 h-4 opacity-50" />
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

  const resolvedPanelPos = panelPosition ?? computePanelPosition(position.x, position.y);

  return (
    <div
      style={{ position: 'fixed', left: resolvedPanelPos.left, top: resolvedPanelPos.top }}
      className="z-50 w-96 max-h-96 bg-gray-900 border-2 border-orange-500 rounded-lg shadow-2xl flex flex-col"
    >
      {/* Header — drag handle for panel */}
      <div
        className="bg-gray-800 border-b border-orange-500 p-4 flex items-center justify-between cursor-grab active:cursor-grabbing select-none"
        onMouseDown={handlePanelDragStart}
        onTouchStart={handlePanelTouchStart}
      >
        <div className="flex items-center gap-2">
          <GripVertical className="w-4 h-4 text-gray-500" />
          <Dice5 className="w-5 h-5 text-orange-300" />
          <h3 className="text-lg font-bold text-orange-300">Roll History</h3>
          <span className="text-sm text-gray-400 ml-2">({rolls.length})</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onToggleMinimize}
            onMouseDown={(e) => e.stopPropagation()}
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
