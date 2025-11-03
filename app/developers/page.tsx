'use client';

import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { Loader, Code, Key, Webhook, Book, Settings } from 'lucide-react';
import { withDashboardLayout } from '@/utils/withDashboardLayout';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';
import ApiKeysTab from './components/ApiKeysTab';
import WebhooksTab from './components/WebhooksTab';

export interface ApiKey {
  id: string;
  keyId: string;
  environment: string;
  name: string;
  lastUsed?: string;
  createdAt: string;
}

function DevelopersPage() {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('api-keys');
  const [loading, setLoading] = useState(true);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [webhookUrl, setWebhookUrl] = useState('');

  useEffect(() => {
    if (!isConnected && !loading) {
      router.replace('/dashboard');
    }
  }, [isConnected, loading, router]);

  // Fetch API keys and webhook settings
  useEffect(() => {
    if (!isConnected) return;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/settings');
        if (!res.ok) throw new Error('fetch failed');
        const json = await res.json();
        setApiKeys(json.apiKeys || []);
        setWebhookUrl(json.settings?.webhookUrl || '');
      } catch (e: any) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [isConnected]);

  const saveWebhookUrl = async (newUrl: string) => {
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ webhookUrl: newUrl }),
      });
      if (!res.ok) throw new Error('save failed');
      setWebhookUrl(newUrl);
      return true;
    } catch (e: any) {
      console.error('Error saving webhook URL:', e.message);
      return false;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <Header />
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <Loader className="animate-spin text-blue-400" size={32} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />
      
      {/* Floating blur elements for premium feel */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-10"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg backdrop-blur-sm border border-white/10">
              <Code className="w-6 h-6 text-blue-400" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-100 to-purple-100 bg-clip-text text-transparent">
              Developer Portal
            </h1>
          </div>
          <p className="text-gray-300 text-lg">
            Integrate NedaPay into your applications with our powerful APIs and tools
          </p>
        </motion.div>

        {/* Stats Cards */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
          <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Active API Keys</CardTitle>
              <Key className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{apiKeys.length}</div>
              <p className="text-xs text-gray-400">
                {apiKeys.filter(k => k.environment === 'live').length} live, {apiKeys.filter(k => k.environment === 'test').length} test
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Webhook Status</CardTitle>
              <Webhook className="h-4 w-4 text-emerald-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {webhookUrl ? 'Active' : 'Not Set'}
              </div>
              <p className="text-xs text-gray-400">
                {webhookUrl ? 'Configured' : 'Configure webhook URL'}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Integration Status</CardTitle>
              <Settings className="h-4 w-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">Ready</div>
              <p className="text-xs text-gray-400">
                All systems operational
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">Developer Tools</CardTitle>
              <CardDescription className="text-gray-300">
                Manage your API keys, webhooks, and integration settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-6">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
                  <TabsList className="grid w-full grid-cols-2 bg-slate-700/50 max-w-md">
                    <TabsTrigger 
                      value="api-keys" 
                      className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                    >
                      <Key className="w-4 h-4 mr-2" />
                      API Keys
                    </TabsTrigger>
                    <TabsTrigger 
                      value="webhooks"
                      className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                    >
                      <Webhook className="w-4 h-4 mr-2" />
                      Webhooks
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
                
                <Button
                  variant="outline"
                  className="border-slate-600 text-gray-300 hover:bg-slate-700"
                  onClick={() => window.open('https://docs.nedapay.com', '_blank')}
                >
                  <Book className="w-4 h-4 mr-2" />
                  Documentation
                  <ExternalLink className="w-4 h-4 ml-2" />
                </Button>
              </div>

              <div className="mt-6">
                {activeTab === 'api-keys' && (
                  <ApiKeysTab 
                    apiKeys={apiKeys} 
                    setApiKeys={setApiKeys}
                  />
                )}

                {activeTab === 'webhooks' && (
                  <WebhooksTab 
                    webhookUrl={webhookUrl}
                    onSaveWebhook={saveWebhookUrl}
                  />
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Connected Wallet Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-8"
        >
          <Card className="bg-slate-800/30 border-slate-700/30 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-300 mb-1">Connected Wallet</h3>
                  <p className="font-mono text-sm text-gray-100 break-all">
                    {address}
                  </p>
                </div>
                <Badge variant="outline" className="border-emerald-500/50 text-emerald-400">
                  Connected
                </Badge>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

export default withDashboardLayout(DevelopersPage);
