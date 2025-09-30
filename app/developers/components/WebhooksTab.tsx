'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Webhook, Save, TestTube, CheckCircle, AlertCircle, Globe, Shield, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

interface WebhooksTabProps {
  webhookUrl: string;
  onSaveWebhook: (url: string) => Promise<boolean>;
}

export default function WebhooksTab({ webhookUrl, onSaveWebhook }: WebhooksTabProps) {
  const [currentUrl, setCurrentUrl] = useState(webhookUrl);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
  const [saveStatus, setSaveStatus] = useState<'success' | 'error' | null>(null);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus(null);
    
    try {
      const success = await onSaveWebhook(currentUrl);
      setSaveStatus(success ? 'success' : 'error');
      if (success) {
        setTimeout(() => setSaveStatus(null), 3000);
      }
    } catch (error) {
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  const testWebhook = async () => {
    if (!currentUrl.trim()) {
      alert('Please enter a webhook URL first');
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      // Simulate webhook test - in real implementation, this would call your API
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // For demo purposes, randomly succeed or fail
      const success = Math.random() > 0.3;
      setTestResult(success ? 'success' : 'error');
      
      setTimeout(() => setTestResult(null), 5000);
    } catch (error) {
      setTestResult('error');
    } finally {
      setIsTesting(false);
    }
  };

  const isValidUrl = (url: string) => {
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const webhookEvents = [
    {
      event: 'payment.completed',
      description: 'Triggered when a payment is successfully completed',
      icon: CheckCircle,
      color: 'text-emerald-400'
    },
    {
      event: 'payment.failed',
      description: 'Triggered when a payment fails or is declined',
      icon: AlertCircle,
      color: 'text-red-400'
    },
    {
      event: 'payment.pending',
      description: 'Triggered when a payment is pending confirmation',
      icon: Zap,
      color: 'text-yellow-400'
    },
    {
      event: 'refund.processed',
      description: 'Triggered when a refund is successfully processed',
      icon: CheckCircle,
      color: 'text-blue-400'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-2">Webhook Configuration</h3>
        <p className="text-sm text-gray-400">
          Configure webhook endpoints to receive real-time payment notifications
        </p>
      </div>

      {/* Webhook URL Configuration */}
      <Card className="bg-slate-800/50 border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Webhook className="w-5 h-5 mr-2 text-blue-400" />
            Webhook Endpoint
          </CardTitle>
          <CardDescription className="text-gray-300">
            Enter the HTTPS URL where you want to receive webhook notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="webhookUrl" className="text-gray-300">Webhook URL</Label>
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  id="webhookUrl"
                  type="url"
                  value={currentUrl}
                  onChange={(e) => setCurrentUrl(e.target.value)}
                  placeholder="https://your-domain.com/webhooks/nedapay"
                  className="bg-slate-900 border-slate-600 text-white"
                />
                {currentUrl && !isValidUrl(currentUrl) && (
                  <p className="text-red-400 text-xs mt-1">
                    Please enter a valid HTTPS URL
                  </p>
                )}
              </div>
              <Button
                onClick={handleSave}
                disabled={isSaving || !currentUrl.trim() || !isValidUrl(currentUrl)}
                className="bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700"
              >
                {isSaving ? (
                  'Saving...'
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Save Status */}
          {saveStatus && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <Alert className={saveStatus === 'success' 
                ? 'bg-emerald-500/10 border-emerald-500/30' 
                : 'bg-red-500/10 border-red-500/30'
              }>
                {saveStatus === 'success' ? (
                  <CheckCircle className="h-4 w-4 text-emerald-400" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-400" />
                )}
                <AlertDescription className={saveStatus === 'success' ? 'text-emerald-200' : 'text-red-200'}>
                  {saveStatus === 'success' 
                    ? 'Webhook URL saved successfully!' 
                    : 'Failed to save webhook URL. Please try again.'
                  }
                </AlertDescription>
              </Alert>
            </motion.div>
          )}

          {/* Test Webhook */}
          {currentUrl && isValidUrl(currentUrl) && (
            <div className="flex items-center gap-4 pt-2">
              <Button
                variant="outline"
                onClick={testWebhook}
                disabled={isTesting}
                className="border-slate-600 text-gray-300 hover:bg-slate-700"
              >
                {isTesting ? (
                  'Testing...'
                ) : (
                  <>
                    <TestTube className="w-4 h-4 mr-2" />
                    Test Webhook
                  </>
                )}
              </Button>

              {testResult && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-2"
                >
                  {testResult === 'success' ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-400 text-sm">Test successful!</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-4 h-4 text-red-400" />
                      <span className="text-red-400 text-sm">Test failed</span>
                    </>
                  )}
                </motion.div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Webhook Status */}
      <Card className="bg-slate-800/50 border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-white flex items-center justify-between">
            <span className="flex items-center">
              <Globe className="w-5 h-5 mr-2 text-purple-400" />
              Webhook Status
            </span>
            <Badge 
              variant={webhookUrl ? 'default' : 'secondary'}
              className={webhookUrl 
                ? 'bg-emerald-600 text-white' 
                : 'bg-slate-600 text-gray-200'
              }
            >
              {webhookUrl ? 'Active' : 'Not Configured'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {webhookUrl ? (
            <div className="space-y-2">
              <p className="text-gray-300 text-sm">Current webhook endpoint:</p>
              <div className="bg-slate-900/50 p-3 rounded border border-slate-600/50 font-mono text-sm text-gray-200 break-all">
                {webhookUrl}
              </div>
            </div>
          ) : (
            <p className="text-gray-400 text-sm">
              No webhook endpoint configured. Add one above to start receiving notifications.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Webhook Events */}
      <Card className="bg-slate-800/50 border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Zap className="w-5 h-5 mr-2 text-yellow-400" />
            Webhook Events
          </CardTitle>
          <CardDescription className="text-gray-300">
            Events that will trigger webhook notifications to your endpoint
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {webhookEvents.map((event, index) => (
              <motion.div
                key={event.event}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="flex items-start gap-3 p-3 bg-slate-900/30 rounded-lg border border-slate-700/30"
              >
                <event.icon className={`w-5 h-5 mt-0.5 ${event.color}`} />
                <div className="flex-1">
                  <h4 className="font-medium text-white text-sm">{event.event}</h4>
                  <p className="text-gray-400 text-xs mt-1">{event.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Security Notice */}
      <Alert className="bg-blue-500/10 border-blue-500/30">
        <Shield className="h-4 w-4 text-blue-400" />
        <AlertDescription className="text-blue-200">
          <strong>Security:</strong> Webhook endpoints must use HTTPS. We recommend verifying webhook signatures 
          to ensure the authenticity of incoming requests. Check our documentation for implementation details.
        </AlertDescription>
      </Alert>
    </div>
  );
}
