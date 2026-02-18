import { X } from 'lucide-react';
import type { CharacterData } from '~/types/character';
import { cardBgAlt, cardBorder, headingText, subHeadingText, labelText, bodyText, inputBase, inputAccent, btnSmall, btnDanger, accordionHeader, accordionBody, dividerSubtle } from '~/utils/theme';

interface FeaturesTabProps {
  character: CharacterData;
  isEditing: boolean;
  expandedFeatures: { [key: string | number]: boolean };
  toggleFeatureExpanded: (index: number | string) => void;
  handleCharacterChange: (key: keyof CharacterData, value: any) => void;
  handleFeatureChange: (index: number, key: 'name' | 'description' | 'category', value: string) => void;
  handleAddFeature: () => void;
  handleDeleteFeature: (index: number) => void;
}

export default function FeaturesTab({
  character,
  isEditing,
  expandedFeatures,
  toggleFeatureExpanded,
  handleCharacterChange,
  handleFeatureChange,
  handleAddFeature,
  handleDeleteFeature,
}: FeaturesTabProps) {
  return (
    <div className="space-y-6">
      {/* Overview: Race & Classes */}
      <div className="space-y-3">
        <h3 className={`text-lg font-bold ${headingText}`}>Overview</h3>

        {/* Race */}
        <div className={`${cardBorder} rounded-lg overflow-hidden ${cardBgAlt}`}>
          <button onClick={() => toggleFeatureExpanded(-1)} className={accordionHeader}>
            <div className="text-left">
              <div className={`font-bold ${subHeadingText}`}>{character.race}</div>
              <div className={`text-xs ${labelText}`}>Race</div>
            </div>
            <span className={headingText}>{expandedFeatures[-1] ? '−' : '+'}</span>
          </button>
          {expandedFeatures[-1] && (
            <div className={`${accordionBody} space-y-3`}>
              {isEditing && (
                <div>
                  <label className={`text-sm font-semibold ${labelText}`}>Race Name</label>
                  <input type="text" value={character.race} onChange={(e) => handleCharacterChange('race', e.target.value)} className={`w-full mt-1 ${inputBase}`} placeholder="Race name" />
                </div>
              )}
              <div>
                <label className={`text-sm font-semibold ${labelText}`}>Description</label>
                {isEditing ? (
                  <textarea value={character.raceDescription} onChange={(e) => handleCharacterChange('raceDescription', e.target.value)} className={`w-full mt-1 min-h-24 ${inputBase}`} />
                ) : (
                  <p className={`mt-1 ${bodyText}`}>{character.raceDescription || 'No description provided'}</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Classes */}
        {character.classes && character.classes.length > 0 ? (
          <div className="space-y-3">
            {character.classes.map((cls, classIdx) => (
              <div key={classIdx} className={`${cardBorder} rounded-lg overflow-hidden ${cardBgAlt}`}>
                <button onClick={() => toggleFeatureExpanded(`class-${classIdx}`)} className={accordionHeader}>
                  <div className="text-left">
                    <div className={`font-bold ${subHeadingText}`}>{cls.name} (Level {cls.level})</div>
                    {cls.subclass && <div className={`text-xs ${labelText}`}>{cls.subclass}</div>}
                  </div>
                  <span className={headingText}>{expandedFeatures[`class-${classIdx}`] ? '−' : '+'}</span>
                </button>
                {expandedFeatures[`class-${classIdx}`] && (
                  <div className={`${accordionBody} space-y-3`}>
                    {isEditing ? (
                      <>
                        {[
                          { label: 'Class Name', field: 'name' as const, type: 'text' },
                          { label: 'Level', field: 'level' as const, type: 'number' },
                          { label: 'Subclass (optional)', field: 'subclass' as const, type: 'text' },
                        ].map(({ label, field, type }) => (
                          <div key={field}>
                            <label className={`text-sm font-semibold ${labelText}`}>{label}</label>
                            <input
                              type={type}
                              value={cls[field]}
                              min={type === 'number' ? 1 : undefined}
                              max={type === 'number' ? 20 : undefined}
                              onChange={(e) => {
                                const newClasses = [...character.classes!];
                                newClasses[classIdx] = { ...newClasses[classIdx], [field]: type === 'number' ? parseInt(e.target.value) || 1 : e.target.value };
                                handleCharacterChange('classes', newClasses);
                              }}
                              className={`w-full mt-1 ${inputBase}`}
                            />
                          </div>
                        ))}
                        <div>
                          <label className={`text-sm font-semibold ${labelText}`}>Description</label>
                          <textarea
                            value={cls.description || ''}
                            onChange={(e) => {
                              const newClasses = [...character.classes!];
                              newClasses[classIdx] = { ...newClasses[classIdx], description: e.target.value };
                              handleCharacterChange('classes', newClasses);
                            }}
                            className={`w-full mt-1 min-h-20 ${inputBase}`}
                          />
                        </div>
                        {character.classes!.length > 1 && (
                          <button onClick={() => handleCharacterChange('classes', character.classes!.filter((_, i) => i !== classIdx))} className={btnDanger}>
                            Remove Class
                          </button>
                        )}
                      </>
                    ) : (
                      <p className={bodyText}>{cls.description || 'No description provided'}</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          /* Legacy single-class fallback */
          <div className={`${cardBorder} rounded-lg overflow-hidden ${cardBgAlt}`}>
            <button onClick={() => toggleFeatureExpanded(-2)} className={accordionHeader}>
              <div className="text-left">
                <div className={`font-bold ${subHeadingText}`}>{character.class}</div>
                <div className={`text-xs ${labelText}`}>Class</div>
              </div>
              <span className={headingText}>{expandedFeatures[-2] ? '−' : '+'}</span>
            </button>
            {expandedFeatures[-2] && (
              <div className={accordionBody}>
                {isEditing ? (
                  <textarea value={character.classDescription} onChange={(e) => handleCharacterChange('classDescription', e.target.value)} className={`w-full min-h-24 ${inputBase}`} />
                ) : (
                  <p className={bodyText}>{character.classDescription || 'No description provided'}</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Add Class button */}
        {isEditing && character.classes && character.classes.length < 3 && (
          <button onClick={() => handleCharacterChange('classes', [...(character.classes || []), { name: 'Class', subclass: '', level: 1, description: '' }])} className={`w-full ${btnSmall}`}>
            + Add Class
          </button>
        )}

        {/* Legacy subclass */}
        {(!character.classes || character.classes.length === 0) && character.subclass && (
          <div className={`${cardBorder} rounded-lg overflow-hidden ${cardBgAlt}`}>
            <button onClick={() => toggleFeatureExpanded(-3)} className={accordionHeader}>
              <div className="text-left">
                <div className={`font-bold ${subHeadingText}`}>{character.subclass}</div>
                <div className={`text-xs ${labelText}`}>Subclass</div>
              </div>
              <span className={headingText}>{expandedFeatures[-3] ? '−' : '+'}</span>
            </button>
            {expandedFeatures[-3] && (
              <div className={accordionBody}>
                {isEditing ? (
                  <textarea value={character.subclassDescription} onChange={(e) => handleCharacterChange('subclassDescription', e.target.value)} className={`w-full min-h-24 ${inputBase}`} />
                ) : (
                  <p className={bodyText}>{character.subclassDescription || 'No description provided'}</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Features & Traits */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className={`text-lg font-bold ${headingText}`}>Features & Traits</h3>
          {isEditing && <button onClick={handleAddFeature} className={btnSmall}>+ Add Feature</button>}
        </div>
        {character.features && character.features.length > 0 ? (
          <div className="space-y-2">
            {character.features.map((feature, idx) => (
              <div key={idx} className={`${cardBorder} rounded-lg overflow-hidden ${cardBgAlt}`}>
                <button onClick={() => toggleFeatureExpanded(idx)} className={accordionHeader}>
                  <div className="text-left flex-1">
                    {isEditing ? (
                      <input type="text" value={feature.name} onChange={(e) => handleFeatureChange(idx, 'name', e.target.value)} className={`w-full font-bold mb-1 ${inputAccent}`} />
                    ) : (
                      <div className={`font-bold ${subHeadingText}`}>{feature.name}</div>
                    )}
                    {feature.category && <div className={`text-xs capitalize ${labelText}`}>{feature.category}</div>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-lg ${headingText}`}>{expandedFeatures[idx] ? '−' : '+'}</span>
                    {isEditing && (
                      <button onClick={(e) => { e.stopPropagation(); handleDeleteFeature(idx); }} className="text-red-400 hover:text-red-300">
                        <X size={16} />
                      </button>
                    )}
                  </div>
                </button>
                {expandedFeatures[idx] && (
                  <div className={`${accordionBody} border-t ${dividerSubtle}`}>
                    {isEditing ? (
                      <>
                        <div className="mb-3">
                          <label className={`block text-xs font-medium mb-1 ${labelText}`}>Category</label>
                          <input type="text" value={feature.category || ''} onChange={(e) => handleFeatureChange(idx, 'category', e.target.value)} placeholder="e.g., racial, class, background" className={`w-full ${inputBase}`} />
                        </div>
                        <label className={`block text-xs font-medium mb-1 ${labelText}`}>Description</label>
                        <textarea value={feature.description} onChange={(e) => handleFeatureChange(idx, 'description', e.target.value)} className={`w-full min-h-20 ${inputBase}`} placeholder="Enter feature description..." />
                      </>
                    ) : (
                      <p className={`text-sm ${bodyText}`}>{feature.description || 'No description provided'}</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 italic">No features added yet</p>
        )}
      </div>
    </div>
  );
}
