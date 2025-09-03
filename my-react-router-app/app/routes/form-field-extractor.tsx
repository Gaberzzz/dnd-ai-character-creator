import React, { useState, useCallback } from 'react';
import { PDFDocument, PDFForm, PDFField } from 'pdf-lib';

interface FormField {
  name: string;
  type: string;
  index: number;
  value?: string;
  isChecked?: boolean;
  maxLength?: number | null;
  options?: string[];
  selected?: string[];
}

interface AnalysisResult {
  totalFields: number;
  fields: FormField[];
}

const PDFFormAnalyzer: React.FC = () => {
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError('');

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const form: PDFForm = pdfDoc.getForm();
      
      const fields: PDFField[] = form.getFields();
      const fieldData: FormField[] = [];

      fields.forEach((field: PDFField, index: number) => {
        const fieldInfo: FormField = {
          name: field.getName(),
          type: field.constructor.name,
          index: index
        };

        // Type-specific information - use duck typing to detect field types
        try {
          const fieldAny = field as any;
          
          // Check if it's a text field
          if (fieldAny.getText && typeof fieldAny.getText === 'function') {
            fieldInfo.type = 'PDFTextField';
            fieldInfo.maxLength = fieldAny.getMaxLength?.() || null;
            fieldInfo.value = fieldAny.getText?.() || '';
          }
          // Check if it's a checkbox
          else if (fieldAny.isChecked && typeof fieldAny.isChecked === 'function') {
            fieldInfo.type = 'PDFCheckBox';
            fieldInfo.isChecked = fieldAny.isChecked?.() || false;
          }
          // Check if it's a dropdown
          else if (fieldAny.getOptions && typeof fieldAny.getOptions === 'function') {
            fieldInfo.type = 'PDFDropdown';
            fieldInfo.options = fieldAny.getOptions?.() || [];
            fieldInfo.selected = fieldAny.getSelected?.() || [];
          }
          // Fallback - try to determine from method availability
          else {
            // Check what methods are available to infer type
            const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(fieldAny));
            if (methods.includes('setText') || methods.includes('getText')) {
              fieldInfo.type = 'PDFTextField';
              fieldInfo.value = fieldAny.getText?.() || '';
            } else if (methods.includes('check') || methods.includes('uncheck')) {
              fieldInfo.type = 'PDFCheckBox';
              fieldInfo.isChecked = fieldAny.isChecked?.() || false;
            } else {
              // Keep the original constructor name as fallback
              fieldInfo.type = 'Unknown';
            }
          }
        } catch (err) {
          console.warn(`Could not get details for field ${fieldInfo.name}:`, err);
          fieldInfo.type = 'Unknown';
        }

        fieldData.push(fieldInfo);
      });

      setAnalysisResult({
        totalFields: fields.length,
        fields: fieldData
      });

    } catch (err) {
      setError(`Error analyzing PDF: ${err instanceof Error ? err.message : 'Unknown error'}`);
      console.error('PDF Analysis Error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const generatePdfLibCode = (): string => {
    if (!analysisResult) return '';

    const textFields = analysisResult.fields.filter(f => f.type === 'PDFTextField');
    const checkboxes = analysisResult.fields.filter(f => f.type === 'PDFCheckBox');
    const dropdowns = analysisResult.fields.filter(f => f.type === 'PDFDropdown');

    return `import { PDFDocument } from 'pdf-lib';

async function fillDnDCharacterSheet(pdfBytes: ArrayBuffer) {
  // Load the PDF
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const form = pdfDoc.getForm();

  // IMPORTANT: Field names must match EXACTLY (including trailing spaces!)
  
  // Fill Text Fields
${textFields.map(field => {
  const escapedName = field.name.replace(/'/g, "\\'"); // Escape single quotes
  return `  form.getTextField('${escapedName}').setText('${getSampleValue(field.name)}');`;
}).join('\n')}

  // Set Checkboxes
${checkboxes.map(field => {
  const escapedName = field.name.replace(/'/g, "\\'");
  return `  form.getCheckBox('${escapedName}').check(); // or .uncheck()`;
}).join('\n')}

${dropdowns.length > 0 ? `  // Set Dropdowns
${dropdowns.map(field => {
  const escapedName = field.name.replace(/'/g, "\\'");
  return `  form.getDropdown('${escapedName}').select('${field.options?.[0] || 'option'}');`;
}).join('\n')}` : ''}

  // Optional: Flatten form to prevent further editing
  // form.flatten();

  // Save the modified PDF
  const modifiedPdfBytes = await pdfDoc.save();
  return modifiedPdfBytes;
}

// Example with actual field names (notice the exact spacing!):
async function fillWithRealFieldNames(pdfBytes: ArrayBuffer) {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const form = pdfDoc.getForm();

  // Examples showing EXACT field names with trailing spaces
${textFields.slice(0, 10).map(field => {
  const escapedName = field.name.replace(/'/g, "\\'");
  const hasTrailingSpace = field.name !== field.name.trim();
  const comment = hasTrailingSpace ? ' // Note: trailing space!' : '';
  return `  form.getTextField('${escapedName}').setText('${getSampleValue(field.name)}');${comment}`;
}).join('\n')}
  
  return await pdfDoc.save();
}`;
  };

  const generateFieldsJSON = (): string => {
    if (!analysisResult) return '';

    const fieldsMap: Record<string, any> = {};
    
    analysisResult.fields.forEach(field => {
      // KEEP EXACT FIELD NAME - no trimming or cleaning!
      const exactFieldName = field.name; // Preserve trailing spaces and special chars
      const fieldData: any = {
        fieldName: exactFieldName, // Exact PDF field name for pdf-lib
        displayName: exactFieldName.trim(), // Clean name for display purposes
        type: field.type === 'PDFTextField' ? 'textfield' : 
              field.type === 'PDFCheckBox' ? 'checkbox' : 
              field.type === 'PDFDropdown' ? 'dropdown' : 'unknown',
        required: false,
        hasTrailingSpace: exactFieldName !== exactFieldName.trim(), // Flag for trailing spaces
        hasSpecialChars: /[^\w\s]/.test(exactFieldName), // Flag for special characters
      };

      if (field.type === 'PDFTextField') {
        fieldData.dataType = 'string';
        fieldData.maxLength = field.maxLength || null;
        fieldData.currentValue = field.value || '';
        fieldData.sampleValue = getSampleValue(exactFieldName);
        fieldData.description = getFieldDescription(exactFieldName);
      } else if (field.type === 'PDFCheckBox') {
        fieldData.dataType = 'boolean';
        fieldData.currentValue = field.isChecked || false;
        fieldData.sampleValue = getSampleValue(exactFieldName) === 'true' || Math.random() > 0.5;
        fieldData.description = getFieldDescription(exactFieldName);
      } else if (field.type === 'PDFDropdown') {
        fieldData.dataType = 'string';
        fieldData.options = field.options || [];
        fieldData.currentValue = field.selected?.[0] || '';
        fieldData.sampleValue = field.options?.[0] || getSampleValue(exactFieldName);
        fieldData.description = getFieldDescription(exactFieldName);
      }

      fieldsMap[exactFieldName] = fieldData; // Use exact name as key
    });

    // Generate simple form data with EXACT field names
    const simpleFormData: Record<string, any> = {};
    analysisResult.fields.forEach(field => {
      const exactFieldName = field.name; // Keep exact name!
      if (field.type === 'PDFTextField') {
        simpleFormData[exactFieldName] = getSampleValue(exactFieldName);
      } else if (field.type === 'PDFCheckBox') {
        simpleFormData[exactFieldName] = Math.random() > 0.5;
      } else if (field.type === 'PDFDropdown') {
        simpleFormData[exactFieldName] = field.options?.[0] || '';
      }
    });

    // Field names analysis
    const fieldNamesWithSpaces = analysisResult.fields.filter(f => f.name !== f.name.trim()).map(f => f.name);
    const fieldNamesWithSpecialChars = analysisResult.fields.filter(f => /[^\w\s]/.test(f.name)).map(f => f.name);

    return JSON.stringify({
      fullSchema: fieldsMap,
      simpleFormData: simpleFormData,
      fieldCount: {
        textFields: analysisResult.fields.filter(f => f.type === 'PDFTextField').length,
        checkboxes: analysisResult.fields.filter(f => f.type === 'PDFCheckBox').length,
        dropdowns: analysisResult.fields.filter(f => f.type === 'PDFDropdown').length,
        total: analysisResult.fields.length
      },
      specialCharacterAnalysis: {
        fieldsWithTrailingSpaces: fieldNamesWithSpaces,
        fieldsWithSpecialChars: fieldNamesWithSpecialChars,
        totalFieldsWithSpaces: fieldNamesWithSpaces.length,
        totalFieldsWithSpecialChars: fieldNamesWithSpecialChars.length
      }
    }, null, 2);
  };

  const getFieldDescription = (fieldName: string): string => {
    const name = fieldName.toLowerCase();
    
    // Character basics
    if (name.includes('charactername') || name === 'charactername') return 'Character\'s name';
    if (name.includes('playername') || name === 'playername') return 'Player\'s name';
    if (name.includes('race')) return 'Character race (Human, Elf, Dwarf, etc.)';
    if (name.includes('class') || name === 'classlevel') return 'Character class and level';
    if (name.includes('background')) return 'Character background';
    if (name.includes('alignment')) return 'Character alignment';
    if (name.includes('xp') || name.includes('experience')) return 'Experience points';
    
    // Ability scores
    if (name === 'str' || name.includes('strength')) return 'Strength ability score';
    if (name === 'dex' || name.includes('dexterity')) return 'Dexterity ability score';
    if (name === 'con' || name.includes('constitution')) return 'Constitution ability score';
    if (name === 'int' || name.includes('intelligence')) return 'Intelligence ability score';
    if (name === 'wis' || name.includes('wisdom')) return 'Wisdom ability score';
    if (name === 'cha' || name.includes('charisma')) return 'Charisma ability score';
    
    // Modifiers
    if (name.includes('mod')) return 'Ability score modifier';
    
    // Combat stats
    if (name === 'ac' || name.includes('armor')) return 'Armor Class';
    if (name.includes('initiative')) return 'Initiative bonus';
    if (name.includes('speed')) return 'Movement speed';
    if (name.includes('hp') || name.includes('hitpoints')) return 'Hit points';
    if (name.includes('profbonus') || name.includes('proficiency')) return 'Proficiency bonus';
    
    // Saving throws
    if (name.includes('st ') || name.includes('save')) return 'Saving throw modifier';
    
    // Character traits
    if (name.includes('personality')) return 'Personality traits';
    if (name.includes('ideals')) return 'Character ideals';
    if (name.includes('bonds')) return 'Character bonds';
    if (name.includes('flaws')) return 'Character flaws';
    
    // Generic checkbox descriptions
    if (name.includes('check box')) return 'Checkbox field';
    
    return `Field: ${fieldName}`;
  };

  const getSampleValue = (fieldName: string): string => {
    const name = fieldName.toLowerCase();
    
    // Character basics
    if (name.includes('charactername') || name.includes('char_name')) return 'Aragorn';
    if (name.includes('race')) return 'Human';
    if (name.includes('class')) return 'Ranger';
    if (name.includes('level')) return '5';
    if (name.includes('background')) return 'Folk Hero';
    if (name.includes('alignment')) return 'Chaotic Good';
    if (name.includes('experience')) return '6500';
    
    // Ability scores
    if (name.includes('strength') || name.includes('str')) return '16';
    if (name.includes('dexterity') || name.includes('dex')) return '18';
    if (name.includes('constitution') || name.includes('con')) return '14';
    if (name.includes('intelligence') || name.includes('int')) return '12';
    if (name.includes('wisdom') || name.includes('wis')) return '15';
    if (name.includes('charisma') || name.includes('cha')) return '13';
    
    // Combat stats
    if (name.includes('ac') || name.includes('armor')) return '15';
    if (name.includes('initiative')) return '+4';
    if (name.includes('speed')) return '30 ft';
    if (name.includes('hitpoints') || name.includes('hp')) return '45';
    if (name.includes('proficiency')) return '+3';
    
    // Skills and saves
    if (name.includes('athletics')) return '+6';
    if (name.includes('perception')) return '+5';
    if (name.includes('stealth')) return '+7';
    
    // Generic fallbacks
    if (name.includes('bonus') || name.includes('modifier')) return '+2';
    if (name.includes('name')) return 'Sample Name';
    if (name.includes('age')) return '27';
    if (name.includes('height')) return '6\'0"';
    if (name.includes('weight')) return '180 lbs';
    if (name.includes('eyes')) return 'Blue';
    if (name.includes('hair')) return 'Brown';
    if (name.includes('skin')) return 'Fair';
    
    return 'Sample Value';
  };

  const generateTypeScriptInterface = (): string => {
    if (!analysisResult) return '';

    const interfaceFields: string[] = [];
    
    analysisResult.fields.forEach(field => {
      let typeAnnotation = 'string';
      let optional = '?';
      
      if (field.type === 'PDFCheckBox') {
        typeAnnotation = 'boolean';
      } else if (field.type === 'PDFDropdown' && field.options && field.options.length > 0) {
        typeAnnotation = `'${field.options.join("' | '")}'`;
      }
      
      const comment = field.maxLength ? ` // Max length: ${field.maxLength}` : '';
      interfaceFields.push(`  ${field.name}${optional}: ${typeAnnotation};${comment}`);
    });

    return `interface CharacterSheetData {
${interfaceFields.join('\n')}
}

// Example usage:
const characterData: CharacterSheetData = {
${analysisResult.fields.map(field => {
  let value: string;
  if (field.type === 'PDFCheckBox') {
    value = 'true';
  } else if (field.type === 'PDFDropdown' && field.options && field.options.length > 0) {
    value = `'${field.options[0]}'`;
  } else {
    value = `'${getSampleValue(field.name)}'`;
  }
  return `  ${field.name}: ${value},`;
}).join('\n')}
};`;
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert('Copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-3">
          <svg className="w-8 h-8 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
            <path d="M4 3a2 2 0 00-2 2v1.816a.5.5 0 00.106.316l2.414 3.45c.02.03.021.068.004.098L2.109 16.18A.5.5 0 002 16.5V18a2 2 0 002 2h12a2 2 0 002-2v-1.5a.5.5 0 00-.109-.316l-2.415-4.5c-.017-.03-.016-.068.004-.098l2.414-3.45A.5.5 0 0018 6.816V5a2 2 0 00-2-2H4z"/>
          </svg>
          D&D Character Sheet PDF Analyzer
        </h1>

        <div className="mb-8">
          <label htmlFor="pdf-upload" className="block text-sm font-medium text-gray-700 mb-2">
            Upload your D&D Character Sheet PDF
          </label>
          <input
            id="pdf-upload"
            type="file"
            accept=".pdf"
            onChange={handleFileUpload}
            disabled={isLoading}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 disabled:opacity-50"
          />
          {isLoading && (
            <div className="mt-2 text-blue-600">Analyzing PDF form fields...</div>
          )}
          {error && (
            <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
              {error}
            </div>
          )}
        </div>

        {analysisResult && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-lg">
                <div className="text-3xl font-bold">{analysisResult.totalFields}</div>
                <div className="text-purple-100">Total Form Fields</div>
              </div>
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-lg">
                <div className="text-3xl font-bold">
                  {analysisResult.fields.filter(f => f.type === 'PDFTextField').length}
                </div>
                <div className="text-blue-100">Text Fields</div>
              </div>
              <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-lg">
                <div className="text-3xl font-bold">
                  {analysisResult.fields.filter(f => f.type === 'PDFCheckBox').length}
                </div>
                <div className="text-green-100">Checkboxes</div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {/* Fields List */}
              <div className="bg-gray-50 p-6 rounded-lg border">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Form Fields</h2>
                <div className="max-h-96 overflow-y-auto space-y-2">
                  {analysisResult.fields.map((field, index) => (
                    <div key={index} className="p-3 bg-white rounded border border-gray-200 shadow-sm">
                      <div className="flex items-center justify-between mb-1">
                        <code className="text-sm text-purple-700 font-mono">{field.name}</code>
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          field.type === 'PDFTextField' ? 'bg-blue-100 text-blue-800' :
                          field.type === 'PDFCheckBox' ? 'bg-green-100 text-green-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {field.type.replace('PDF', '')}
                        </span>
                      </div>
                      {field.value && (
                        <div className="text-xs text-gray-600">Value: {field.value}</div>
                      )}
                      {field.maxLength && (
                        <div className="text-xs text-gray-600">Max Length: {field.maxLength}</div>
                      )}
                      {field.isChecked !== undefined && (
                        <div className="text-xs text-gray-600">
                          Checked: {field.isChecked ? 'Yes' : 'No'}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* JSON Schema */}
              <div className="bg-gray-900 p-6 rounded-lg border">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-white">JSON Schema & Types</h2>
                  <button
                    onClick={() => copyToClipboard(generateFieldsJSON())}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm font-semibold transition-colors"
                  >
                    Copy JSON
                  </button>
                </div>
                <pre className="text-xs text-yellow-400 font-mono overflow-auto max-h-96 bg-gray-800 p-4 rounded">
                  {generateFieldsJSON()}
                </pre>
              </div>

              {/* Generated Code */}
              <div className="bg-gray-900 p-6 rounded-lg border">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-white">pdf-lib Code</h2>
                  <button
                    onClick={() => copyToClipboard(generatePdfLibCode())}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded text-sm font-semibold transition-colors"
                  >
                    Copy Code
                  </button>
                </div>
                <pre className="text-xs text-green-400 font-mono overflow-auto max-h-96 bg-gray-800 p-4 rounded">
                  {generatePdfLibCode()}
                </pre>
              </div>
            </div>

            {/* TypeScript Interface */}
            <div className="bg-gray-900 p-6 rounded-lg border">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white">TypeScript Interface</h2>
                <button
                  onClick={() => copyToClipboard(generateTypeScriptInterface())}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-semibold transition-colors"
                >
                  Copy Interface
                </button>
              </div>
              <pre className="text-xs text-blue-400 font-mono overflow-auto max-h-96 bg-gray-800 p-4 rounded">
                {generateTypeScriptInterface()}
              </pre>
            </div>

            {/* Installation Instructions */}
            <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
              <h3 className="text-lg font-semibold text-blue-800 mb-3">Installation & Usage</h3>
              <div className="space-y-3 text-sm text-blue-700">
                <div>
                  <strong>1. Install pdf-lib:</strong>
                  <code className="block bg-blue-100 p-2 rounded mt-1 font-mono">npm install pdf-lib</code>
                </div>
                <div>
                  <strong>2. Import in your component:</strong>
                  <code className="block bg-blue-100 p-2 rounded mt-1 font-mono">import &#123; PDFDocument &#125; from 'pdf-lib';</code>
                </div>
                <div>
                  <strong>3. Use the generated code above to fill your PDF programmatically!</strong>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PDFFormAnalyzer;