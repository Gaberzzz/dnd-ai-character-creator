import { Eye, EyeOff } from 'lucide-react';

interface ApiKeyInputProps {
    apiKey: string;
    showApiKey: boolean;
    onApiKeyChange: (value: string) => void;
    onToggleVisibility: () => void;
}

export default function ApiKeyInput({ apiKey, showApiKey, onApiKeyChange, onToggleVisibility }: ApiKeyInputProps) {
    return (
        <div className="mb-6">
            <label className="block text-sm font-medium text-orange-300 mb-2">
                OpenRouter API Key:
            </label>
            <div className="relative">
                <input
                    type={showApiKey ? "text" : "password"}
                    value={apiKey}
                    onChange={(e) => onApiKeyChange(e.target.value)}
                    placeholder="sk-or-v1-..."
                    className="w-full p-3 border border-orange-500 rounded-md bg-gray-800 text-orange-300 placeholder-gray-500 focus:ring-2 focus:ring-orange-400"
                />

                <button
                    type="button"
                    onClick={onToggleVisibility}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-orange-300 transition-colors"
                >
                    {showApiKey ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
            </div>
            <p className="text-xs text-gray-400 mt-1">
                Get your API key from{" "}
                <a
                    href="https://openrouter.ai/app/keys"
                    className="text-orange-400 hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    openrouter.ai
                </a>
            </p>
        </div>
    );
}
