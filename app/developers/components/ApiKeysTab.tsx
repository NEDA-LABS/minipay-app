'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Key, Plus, Trash2, Copy, Eye, EyeOff, Calendar, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ApiKey } from '../page';

interface ApiKeysTabProps {
  apiKeys: ApiKey[];
  setApiKeys: (keys: ApiKey[]) => void;
}

export default function ApiKeysTab({ apiKeys, setApiKeys }: ApiKeysTabProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyEnvironment, setNewKeyEnvironment] = useState('test');
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const generateApiKey = async () => {
    if (!newKeyName.trim()) {
      alert('Please enter a name for the API key');
      return;
    }

    setIsGenerating(true);
    try {
      const res = await fetch('/api/settings/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          environment: newKeyEnvironment, 
          name: newKeyName.trim() 
        }),
      });
      
      if (!res.ok) throw new Error('Failed to generate API key');
      
      const { keyId, environment, name } = await res.json();
      const newKey: ApiKey = {
        id: keyId,
        keyId,
        environment,
        name,
        createdAt: new Date().toISOString()
      };
      
      setApiKeys([...apiKeys, newKey]);
      setNewKeyName('');
      setNewKeyEnvironment('test');
      setShowCreateForm(false);
      
      // Show the new key temporarily
      setVisibleKeys(new Set([keyId]));
      setTimeout(() => setVisibleKeys(new Set()), 10000); // Hide after 10 seconds
      
    } catch (e: any) {
      alert('Error generating API key: ' + e.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const revokeApiKey = async (keyId: string) => {
    if (!confirm('Are you sure you want to revoke this API key? This action cannot be undone.')) {
      return;
    }

    try {
      const res = await fetch('/api/settings/api-keys', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyId }),
      });
      
      if (!res.ok) throw new Error('Failed to revoke API key');
      
      setApiKeys(apiKeys.filter(k => k.keyId !== keyId));
      setVisibleKeys(prev => {
        const newSet = new Set(prev);
        newSet.delete(keyId);
        return newSet;
      });
      
    } catch (e: any) {
      alert('Error revoking API key: ' + e.message);
    }
  };

  const toggleKeyVisibility = (keyId: string) => {
    setVisibleKeys(prev => {
      const newSet = new Set(prev);
      if (newSet.has(keyId)) {
        newSet.delete(keyId);
      } else {
        newSet.add(keyId);
      }
      return newSet;
    });
  };

  const copyToClipboard = async (text: string, keyId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(keyId);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const maskApiKey = (key: string) => {
    if (key.length <= 8) return key;
    return key.substring(0, 4) + '•'.repeat(key.length - 8) + key.substring(key.length - 4);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">API Keys</h3>
          <p className="text-sm text-gray-400">
            Manage API keys for integrating with your applications
          </p>
        </div>
        <Button
          onClick={() => setShowCreateForm(true)}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Generate New Key
        </Button>
      </div>

      {/* Create Form */}
      <AnimatePresence>
        {showCreateForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="bg-slate-700/50 border-slate-600/50">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Key className="w-5 h-5 mr-2 text-blue-400" />
                  Generate New API Key
                </CardTitle>
                <CardDescription className="text-gray-300">
                  Create a new API key for your integration
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="keyName" className="text-gray-300">Key Name</Label>
                    <Input
                      id="keyName"
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                      placeholder="e.g., Production API Key"
                      className="bg-slate-800 border-slate-600 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="environment" className="text-gray-300">Environment</Label>
                    <Select value={newKeyEnvironment} onValueChange={setNewKeyEnvironment}>
                      <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="test">Test</SelectItem>
                        <SelectItem value="live">Live</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={generateApiKey}
                    disabled={isGenerating}
                    className="bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700"
                  >
                    {isGenerating ? 'Generating...' : 'Generate Key'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowCreateForm(false)}
                    className="border-slate-600 text-gray-300 hover:bg-slate-700"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* API Keys List */}
      {apiKeys.length === 0 ? (
        <Card className="bg-slate-800/30 border-slate-700/30">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Key className="w-12 h-12 text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-300 mb-2">No API Keys</h3>
              <p className="text-gray-400 mb-4">
                Generate your first API key to start integrating with NedaPay
              </p>
              <Button
                onClick={() => setShowCreateForm(true)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Generate API Key
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {apiKeys.map((apiKey, index) => (
            <motion.div
              key={apiKey.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Card className="bg-slate-800/50 border-slate-700/50 hover:bg-slate-800/70 transition-all duration-200">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-semibold text-white">{apiKey.name}</h4>
                        <Badge 
                          variant={apiKey.environment === 'live' ? 'default' : 'secondary'}
                          className={apiKey.environment === 'live' 
                            ? 'bg-emerald-600 text-white' 
                            : 'bg-slate-600 text-gray-200'
                          }
                        >
                          {apiKey.environment}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          Created {new Date(apiKey.createdAt).toLocaleDateString()}
                        </div>
                        {apiKey.lastUsed && (
                          <div className="flex items-center gap-1">
                            <Activity className="w-4 h-4" />
                            Last used {new Date(apiKey.lastUsed).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => revokeApiKey(apiKey.keyId)}
                      className="border-red-600/50 text-red-400 hover:bg-red-600/10 hover:border-red-500"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Revoke
                    </Button>
                  </div>

                  <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-600/30">
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-gray-300 text-sm">API Key</Label>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleKeyVisibility(apiKey.keyId)}
                          className="text-gray-400 hover:text-white"
                        >
                          {visibleKeys.has(apiKey.keyId) ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(apiKey.keyId, apiKey.keyId)}
                          className="text-gray-400 hover:text-white"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="font-mono text-sm bg-slate-800 p-3 rounded border border-slate-600/50 text-gray-200 break-all">
                      {visibleKeys.has(apiKey.keyId) ? apiKey.keyId : maskApiKey(apiKey.keyId)}
                    </div>
                    {copiedKey === apiKey.keyId && (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-emerald-400 text-xs mt-2"
                      >
                        ✓ Copied to clipboard
                      </motion.p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Security Notice */}
      <Alert className="bg-amber-500/10 border-amber-500/30">
        <Key className="h-4 w-4 text-amber-400" />
        <AlertDescription className="text-amber-200">
          <strong>Security Notice:</strong> Keep your API keys secure and never share them publicly. 
          API keys provide access to your NedaPay account and should be treated like passwords.
        </AlertDescription>
      </Alert>
    </div>
  );
}
