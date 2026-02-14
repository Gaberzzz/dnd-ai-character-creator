import { Dice5 } from 'lucide-react';

interface AttackEntryProps {
  name: string;
  atkBonus: string;
  damage: string;
  onNameChange?: (value: string) => void;
  onAtkBonusChange?: (value: string) => void;
  onDamageChange?: (value: string) => void;
  onRollAttack?: (weaponName: string, bonus: string) => void;
  onRollDamage?: (weaponName: string, damage: string) => void;
  onDelete?: () => void;
  editable?: boolean;
}

export default function AttackEntry({
  name,
  atkBonus,
  damage,
  onNameChange,
  onAtkBonusChange,
  onDamageChange,
  onRollAttack,
  onRollDamage,
  onDelete,
  editable = false,
}: AttackEntryProps) {
  return (
    <div className="bg-gray-800 border border-orange-500 rounded-lg p-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        {editable && onNameChange ? (
          <input
            type="text"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="Weapon Name"
            className="flex-1 bg-gray-700 text-orange-300 border border-orange-400 rounded px-2 py-1 text-sm"
          />
        ) : (
          <span className="text-orange-400 font-semibold flex-1">{name}</span>
        )}
        {editable && onDelete && (
          <button
            onClick={onDelete}
            className="text-red-400 hover:text-red-300 text-sm font-semibold"
          >
            ✕
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <span className="text-gray-400">Atk Bonus</span>
          {editable && onAtkBonusChange ? (
            <input
              type="text"
              value={atkBonus}
              onChange={(e) => onAtkBonusChange(e.target.value)}
              className="w-full bg-gray-700 text-orange-300 border border-orange-400 rounded px-1 py-0.5 font-semibold mt-1"
            />
          ) : (
            <div className="flex items-center justify-between p-1 group">
              <div className="text-orange-300 font-semibold">{atkBonus}</div>
              {!editable && onRollAttack && (
                <button
                  onClick={() => onRollAttack(name, atkBonus)}
                  className="p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-orange-500 text-orange-300 hover:text-white transition-all flex-shrink-0"
                  title={`Roll ${name} Attack`}
                >
                  <Dice5 className="w-3 h-3" />
                </button>
              )}
            </div>
          )}
        </div>
        <div>
          <span className="text-gray-400">Damage</span>
          {editable && onDamageChange ? (
            <input
              type="text"
              value={damage}
              onChange={(e) => onDamageChange(e.target.value)}
              className="w-full bg-gray-700 text-orange-300 border border-orange-400 rounded px-1 py-0.5 font-semibold mt-1"
            />
          ) : (
            <div className="flex items-center justify-between p-1 group">
              <div className="text-orange-300 font-semibold">{damage}</div>
              {!editable && onRollDamage && (
                <button
                  onClick={() => onRollDamage(name, damage)}
                  className="p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-orange-500 text-orange-300 hover:text-white transition-all flex-shrink-0"
                  title={`Roll ${name} Damage`}
                >
                  <Dice5 className="w-3 h-3" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
