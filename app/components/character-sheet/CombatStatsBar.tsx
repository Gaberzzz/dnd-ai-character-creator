import { Heart, Shield, Sword, Dice5 } from 'lucide-react';
import type { CharacterData } from '~/types/character';
import { rollAbilityCheck } from '~/utils/diceRoller';
import type { RollResult } from '~/utils/diceRoller';
import { cardBgAlt, cardBorder, headingText, subHeadingText, labelText, inputAccent, btnDice } from '~/utils/theme';

interface CombatStatsBarProps {
  character: CharacterData;
  isEditing: boolean;
  abilityModifiers: { dexterity: number };
  calculatedInitiative: string;
  hpAdjustAmount: string;
  setHpAdjustAmount: (val: string) => void;
  editingTempHp: boolean;
  setEditingTempHp: (val: boolean) => void;
  handleCharacterChange: (key: keyof CharacterData, value: any) => void;
  handleApplyHealing: () => void;
  handleApplyDamage: () => void;
  addRoll: (roll: RollResult) => void;
}

export default function CombatStatsBar({
  character,
  isEditing,
  abilityModifiers,
  calculatedInitiative,
  hpAdjustAmount,
  setHpAdjustAmount,
  editingTempHp,
  setEditingTempHp,
  handleCharacterChange,
  handleApplyHealing,
  handleApplyDamage,
  addRoll,
}: CombatStatsBarProps) {
  return (
    <div className="flex items-center gap-3">
      {/* HP */}
      <div className={`${cardBgAlt} border-2 border-orange-500 rounded-lg px-3 py-2`}>
        {isEditing ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-1">
              <Heart className={headingText} size={16} />
              <span className={`text-xs font-bold uppercase ${headingText}`}>Hit Points</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <input
                type="text"
                value={character.currentHitPoints}
                onChange={(e) => handleCharacterChange('currentHitPoints', e.target.value)}
                className={`w-12 text-2xl font-bold text-center ${inputAccent}`}
              />
              <span className="text-gray-500">/</span>
              <input
                type="text"
                value={character.hitPointMaximum}
                onChange={(e) => handleCharacterChange('hitPointMaximum', e.target.value)}
                className={`w-12 text-lg text-center ${inputAccent}`}
              />
            </div>
            <div className="flex items-center justify-center gap-1 text-xs">
              <Shield className="text-gray-400" size={12} />
              <input
                type="text"
                value={character.temporaryHitPoints}
                onChange={(e) => handleCharacterChange('temporaryHitPoints', e.target.value)}
                className="w-12 text-xs text-gray-300 bg-gray-800 border border-gray-600 rounded px-1 text-center"
                placeholder="0"
              />
              <span className="text-gray-500">temp HP</span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            {/* Heal/Damage controls */}
            <div className="flex flex-col gap-1">
              <button
                onClick={handleApplyHealing}
                disabled={!hpAdjustAmount || parseInt(hpAdjustAmount) <= 0}
                className="px-3 py-1 text-xs bg-green-700 hover:bg-green-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded transition-colors font-medium uppercase"
              >
                Heal
              </button>
              <input
                type="number"
                value={hpAdjustAmount}
                onChange={(e) => setHpAdjustAmount(e.target.value)}
                min="0"
                className="w-16 text-xs text-center bg-gray-800 border border-gray-600 text-gray-300 rounded px-1 py-1"
              />
              <button
                onClick={handleApplyDamage}
                disabled={!hpAdjustAmount || parseInt(hpAdjustAmount) <= 0}
                className="px-3 py-1 text-xs bg-red-800 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded transition-colors font-medium uppercase"
              >
                Damage
              </button>
            </div>

            {/* HP display */}
            <div className="flex-1 text-center">
              <div className="flex items-baseline justify-center gap-3">
                <div className="text-center">
                  <div className={`text-[10px] uppercase font-semibold tracking-wide ${labelText}`}>Current</div>
                  <span className={`text-3xl font-bold ${headingText}`}>{character.currentHitPoints}</span>
                </div>
                <span className="text-gray-500 text-xl font-light">/</span>
                <div className="text-center">
                  <div className={`text-[10px] uppercase font-semibold tracking-wide ${labelText}`}>Max</div>
                  <span className={`text-2xl font-bold ${subHeadingText}`}>{character.hitPointMaximum}</span>
                </div>
              </div>
              <div className={`text-xs font-bold uppercase tracking-wide mt-0.5 ${headingText}`}>Hit Points</div>
            </div>

            {/* Temp HP */}
            <div className="text-center px-2">
              <div className={`text-[10px] uppercase font-semibold tracking-wide ${labelText}`}>Temp</div>
              {editingTempHp ? (
                <input
                  type="number"
                  value={character.temporaryHitPoints}
                  onChange={(e) => handleCharacterChange('temporaryHitPoints', e.target.value)}
                  onBlur={() => setEditingTempHp(false)}
                  onKeyDown={(e) => { if (e.key === 'Enter') setEditingTempHp(false); }}
                  autoFocus
                  min="0"
                  className="w-12 text-lg text-gray-300 font-medium bg-gray-800 border border-gray-600 rounded px-1 text-center"
                />
              ) : (
                <div
                  onClick={() => setEditingTempHp(true)}
                  className="text-lg text-gray-300 font-medium cursor-pointer hover:bg-gray-600 rounded px-1 transition-colors"
                  title="Click to set temp HP"
                >
                  {parseInt(character.temporaryHitPoints || '0') > 0 ? character.temporaryHitPoints : <span className="text-gray-500">--</span>}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* AC */}
      <div className={`${cardBgAlt} border-2 border-orange-500 rounded-lg px-4 py-2 text-center min-w-24`}>
        <div className="flex items-center justify-center gap-1 mb-1">
          <Shield className={headingText} size={14} />
          <span className={`text-xs font-bold uppercase ${headingText}`}>AC</span>
        </div>
        {isEditing ? (
          <input
            type="text"
            value={character.armorClass}
            onChange={(e) => handleCharacterChange('armorClass', e.target.value)}
            className={`w-full text-2xl font-bold text-center ${inputAccent}`}
          />
        ) : (
          <div className={`text-3xl font-bold ${subHeadingText}`}>{character.armorClass}</div>
        )}
      </div>

      {/* Initiative */}
      <div className={`${cardBgAlt} border-2 border-orange-500 rounded-lg px-4 py-2 text-center min-w-24 group`}>
        <div className="flex items-center justify-center gap-1 mb-1">
          <Sword className={headingText} size={14} />
          <span className={`text-xs font-bold uppercase ${headingText}`}>Init</span>
        </div>
        {isEditing ? (
          <input
            type="text"
            value={character.initiative}
            onChange={(e) => handleCharacterChange('initiative', e.target.value)}
            className={`w-full text-2xl font-bold text-center ${inputAccent}`}
            placeholder={calculatedInitiative}
          />
        ) : (
          <div className="flex items-center justify-center gap-2">
            <div className={`text-3xl font-bold ${subHeadingText}`}>{calculatedInitiative}</div>
            <button
              onClick={() => addRoll(rollAbilityCheck('Initiative', abilityModifiers.dexterity))}
              className={btnDice}
              title="Roll Initiative"
            >
              <Dice5 className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
