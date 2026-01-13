'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, Key, AlertCircle, CheckCircle } from 'lucide-react';

interface ApiKeyInputProps {
  onApiKeyChange: (apiKey: string) => void;
  initialApiKey?: string;
}

export function ApiKeyInput({ onApiKeyChange, initialApiKey = '' }: ApiKeyInputProps) {
  const [apiKey, setApiKey] = useState(initialApiKey);
  const [showApiKey, setShowApiKey] = useState(false);
  const [isStored, setIsStored] = useState(false);

  useEffect(() => {
    // Check if API key is stored in localStorage
    const storedKey = localStorage.getItem('perplexity_api_key');
    if (storedKey && !initialApiKey) {
      setApiKey(storedKey);
      setIsStored(true);
      onApiKeyChange(storedKey);
    }
  }, [initialApiKey, onApiKeyChange]);

  const handleSaveApiKey = () => {
    if (apiKey.trim()) {
      localStorage.setItem('perplexity_api_key', apiKey.trim());
      setIsStored(true);
      onApiKeyChange(apiKey.trim());
    }
  };

  const handleClearApiKey = () => {
    localStorage.removeItem('perplexity_api_key');
    setApiKey('');
    setIsStored(false);
    onApiKeyChange('');
  };

  const handleApiKeyChange = (value: string) => {
    setApiKey(value);
    if (isStored) {
      setIsStored(false);
    }
  };

  return (
    <Card className="border-amber-200 bg-amber-50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center text-amber-800">
          <Key className="h-5 w-5 mr-2" />
          Perplexity API Configuration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start space-x-2 text-sm text-amber-700">
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium">API Key Required</p>
            <p className="text-amber-600">
              Enter your Perplexity API key to analyze job descriptions. 
              Your key is stored locally and never sent to our servers.
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="apiKey" className="text-amber-800">
            Perplexity API Key
          </Label>
          <div className="flex space-x-2">
            <div className="relative flex-1">
              <Input
                id="apiKey"
                type={showApiKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => handleApiKeyChange(e.target.value)}
                placeholder="pplx-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowApiKey(!showApiKey)}
              >
                {showApiKey ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            
            {!isStored ? (
              <Button
                onClick={handleSaveApiKey}
                disabled={!apiKey.trim()}
                variant="outline"
                className="border-amber-300 text-amber-700 hover:bg-amber-100"
              >
                Save
              </Button>
            ) : (
              <Button
                onClick={handleClearApiKey}
                variant="outline"
                className="border-red-300 text-red-700 hover:bg-red-50"
              >
                Clear
              </Button>
            )}
          </div>
          
          {isStored && (
            <div className="flex items-center text-sm text-green-700">
              <CheckCircle className="h-4 w-4 mr-1" />
              API key saved locally
            </div>
          )}
        </div>

        <div className="text-xs text-amber-600 space-y-1">
          <p>• Get your API key from <a href="https://www.perplexity.ai/settings/api" target="_blank" rel="noopener noreferrer" className="underline hover:text-amber-800">Perplexity Settings</a></p>
          <p>• Your API key is stored in your browser's local storage</p>
          <p>• The key is only used to make direct API calls to Perplexity</p>
        </div>
      </CardContent>
    </Card>
  );
}