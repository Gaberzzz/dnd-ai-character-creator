import { Download, Edit2, Save, X, Upload } from 'lucide-react';
import type { CharacterData } from '~/types/character';
import { getClassDisplayText, parseClassDisplayString, calculateTotalLevel } from '~/utils/characterUtils';
import { headingText, subHeadingText, labelText, inputBase, inputAccent, btnPrimary, btnSecondary } from '~/utils/theme';

interface CharacterSheetHeaderProps {
  character: CharacterData;
  isEditing: boolean;
  setIsEditing: (val: boolean) => void;
  initialCharacter: CharacterData;
  setCharacter: (c: CharacterData) => void;
  pdfVersion: '2024' | 'original';
  setPdfVersion: (v: '2024' | 'original') => void;
  onBack?: () => void;
  onLevelUp?: () => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  exportToPDF: () => void;
  exportToJSON: () => void;
  importFromJSON: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleCharacterChange: (key: keyof CharacterData, value: any) => void;
}

export default function CharacterSheetHeader({
  character,
  isEditing,
  setIsEditing,
  initialCharacter,
  setCharacter,
  pdfVersion,
  setPdfVersion,
  onBack,
  fileInputRef,
  exportToPDF,
  exportToJSON,
  importFromJSON,
  handleCharacterChange,
}: CharacterSheetHeaderProps) {
  return (
    <div>
      {isEditing ? (
        <input
          type="text"
          value={character.characterName}
          onChange={(e) => handleCharacterChange('characterName', e.target.value)}
          className={`text-3xl font-bold mb-1 w-full ${inputAccent}`}
          placeholder="Character Name"
        />
      ) : (
        <h1 className={`text-3xl font-bold mb-1 ${headingText}`}>{character.characterName}</h1>
      )}

      {isEditing ? (
        <div className="space-y-2">
          <div className="flex gap-2 flex-wrap text-sm">
            {(['race', 'background'] as const).map((field) => (
              <div key={field} className="flex-1 min-w-48">
                <label className={`text-xs block mb-1 ${labelText}`}>{field.charAt(0).toUpperCase() + field.slice(1)}</label>
                <input
                  type="text"
                  value={character[field]}
                  onChange={(e) => handleCharacterChange(field, e.target.value)}
                  className={`w-full text-sm font-medium ${inputBase}`}
                  placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                />
              </div>
            ))}
            <div className="flex-1 min-w-48">
              <label className={`text-xs block mb-1 ${labelText}`}>Class</label>
              <input
                type="text"
                value={getClassDisplayText(character)}
                onChange={(e) => {
                  const raw = e.target.value;
                  const parsed = parseClassDisplayString(raw);
                  if (parsed.length === 0) {
                    setCharacter({
                      ...character,
                      classes: [{ name: '', subclass: '', level: 1, description: character.classes?.[0]?.description ?? '' }],
                    });
                    return;
                  }
                  setCharacter({
                    ...character,
                    classes: parsed.map((p, i) => ({
                      ...p,
                      description: character.classes?.[i]?.description ?? '',
                    })),
                  });
                }}
                className={`w-full text-sm font-medium ${inputBase}`}
                placeholder="e.g. Fighter 3 or Wizard (Evocation) 2 / Fighter 1"
              />
            </div>
          </div>
          <div className={`text-xs ${labelText}`}>Level {calculateTotalLevel(character)}</div>
        </div>
      ) : (
        <div className={`text-sm ${labelText}`}>
          <span className={`font-medium ${subHeadingText}`}>{character.race}</span>
          {' • '}
          <span className={`font-medium ${subHeadingText}`}>{getClassDisplayText(character)}</span>
          {' • '}
          <span>Level {calculateTotalLevel(character)}</span>
          {' • '}
          <span>{character.background}</span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-2 mt-2">
        {isEditing ? (
          <>
            <button onClick={() => setIsEditing(false)} className={btnPrimary}>
              <Save size={16} className="inline mr-1" />
              Save
            </button>
            <button
              onClick={() => { setCharacter(initialCharacter); setIsEditing(false); }}
              className={btnSecondary}
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <button onClick={() => setIsEditing(true)} className={btnPrimary}>
              <Edit2 size={16} className="inline mr-1" />
              Edit
            </button>
            <div className="flex items-center gap-2">
              <select
                value={pdfVersion}
                onChange={(e) => setPdfVersion(e.target.value as '2024' | 'original')}
                className={`px-3 py-2 rounded-md text-sm font-medium ${inputBase}`}
              >
                <option value="2024">2024 Edition (Default)</option>
                <option value="original">Original Edition</option>
              </select>
              <button onClick={exportToPDF} className={btnSecondary}>
                <Download size={16} className="inline mr-1" />
                PDF
              </button>
              <button onClick={exportToJSON} className={btnSecondary}>
                <Download size={16} className="inline mr-1" />
                JSON
              </button>
              <button onClick={() => fileInputRef.current?.click()} className={btnSecondary}>
                <Upload size={16} className="inline mr-1" />
                JSON
              </button>
              <input ref={fileInputRef} type="file" accept=".json" onChange={importFromJSON} className="hidden" />
            </div>
            {onBack && (
              <button onClick={onBack} className={`${btnSecondary} ml-auto`}>
                <X size={16} className="inline mr-1" />
                Back
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
