import type { CharacterData } from '~/types/character';
import { cardAlt, headingText, subHeadingText, inputAccent, inputBase } from '~/utils/theme';

interface InventoryTabProps {
  character: CharacterData;
  isEditing: boolean;
  handleCharacterChange: (key: keyof CharacterData, value: any) => void;
}

const COINS = [
  { label: 'CP', key: 'cp' as const },
  { label: 'SP', key: 'sp' as const },
  { label: 'EP', key: 'ep' as const },
  { label: 'GP', key: 'gp' as const },
  { label: 'PP', key: 'pp' as const },
];

export default function InventoryTab({ character, isEditing, handleCharacterChange }: InventoryTabProps) {
  return (
    <div className="space-y-4">
      <h3 className={`text-lg font-bold ${headingText}`}>Inventory & Currency</h3>
      <div className="grid grid-cols-5 gap-3">
        {COINS.map((coin) => (
          <div key={coin.label} className={`${cardAlt} text-center`}>
            <div className={`text-xs font-medium mb-1 ${headingText}`}>{coin.label}</div>
            {isEditing ? (
              <input
                type="text"
                value={character[coin.key]}
                onChange={(e) => handleCharacterChange(coin.key, e.target.value)}
                className={`w-full text-lg font-bold text-center ${inputAccent}`}
              />
            ) : (
              <div className={`text-lg font-bold ${subHeadingText}`}>{character[coin.key]}</div>
            )}
          </div>
        ))}
      </div>
      <div className={cardAlt}>
        <h4 className={`font-bold mb-2 ${headingText}`}>Equipment</h4>
        {isEditing ? (
          <textarea
            value={character.equipment}
            onChange={(e) => handleCharacterChange('equipment', e.target.value)}
            className={`w-full text-sm min-h-20 ${inputBase}`}
          />
        ) : (
          <p className="text-sm text-gray-300">{character.equipment}</p>
        )}
      </div>
    </div>
  );
}
