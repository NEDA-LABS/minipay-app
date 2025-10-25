'use client';

/**
 * KYC Verification Page
 * Main page for identity verification using Smile ID
 */

import React from 'react';
import { SmileIDVerificationFlow } from '@/components/kyc/smile-id';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, CheckCircle, Clock, FileText, Camera, Sparkles } from 'lucide-react';
import Header from '@/components/Header';
import { withDashboardLayout } from '@/utils/withDashboardLayout';

function KYCPage() {
  const handleVerificationComplete = (success: boolean) => {
    if (success) {
      console.log('KYC verification completed successfully!');
      // You can add additional logic here, like redirecting or showing a success message
    } else {
      console.log('KYC verification failed or was cancelled');
    }
  };

  return (
    <div className="space-y-2 w-full">
      <Header />
      
      <div className="relative z-10 max-w-6xl mx-auto px-4 py-6">
        {/* Header Section */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Identity Verification
          </h1>
        </div>

        {/* Important Information */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-yellow-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <Clock className="h-4 w-4 text-yellow-400" />
              </div>
              <div>
                <p className="text-yellow-200 font-medium mb-1">Sandbox Testing Environment</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Verification Component */}
        <div className="flex justify-center mb-12">
          <SmileIDVerificationFlow
            onVerificationComplete={handleVerificationComplete}
            className="w-full max-w-2xl"
          />
        </div>

        {/* Help Section */}
        <div className="mt-12 text-center">
          <Card className="bg-slate-900/50 border-slate-700/50 inline-block">
            <CardContent className="px-6 py-4">
              <div className="flex items-center gap-2 text-slate-300">
                <Sparkles className="h-4 w-4 text-blue-400" />
                <span className="text-sm">
                  Need help? Contact our support team or visit our{' '}
                  <a href="/support" className="text-blue-400 hover:text-blue-300 underline transition-colors">
                    help center
                  </a>
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default withDashboardLayout(KYCPage);
