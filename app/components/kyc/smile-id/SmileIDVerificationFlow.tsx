'use client';

/**
 * Smile ID Verification Flow Component
 * Main component for Smile ID KYC verification
 */

import React, { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle, Clock, ExternalLink } from 'lucide-react';
import { CountrySelector } from './CountrySelector';
import { IDTypeSelector } from './IDTypeSelector';
import { VerificationStatus } from './VerificationStatus';

interface SmileIDVerificationFlowProps {
  onVerificationComplete?: (success: boolean) => void;
  className?: string;
}

interface VerificationState {
  status: 'idle' | 'loading' | 'pending' | 'success' | 'failed' | 'expired';
  verificationUrl?: string;
  error?: string;
  resultCode?: string;
  resultText?: string;
}

export function SmileIDVerificationFlow({ 
  onVerificationComplete, 
  className 
}: SmileIDVerificationFlowProps) {
  const { user, signMessage, getAccessToken } = usePrivy();
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [selectedIdType, setSelectedIdType] = useState<string>('');
  const [verificationState, setVerificationState] = useState<VerificationState>({ status: 'idle' });
  const [isInitializing, setIsInitializing] = useState(true);

  // Check existing verification status on mount
  useEffect(() => {
    checkVerificationStatus();
  }, []);

  // Poll verification status when pending
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (verificationState.status === 'pending') {
      interval = setInterval(() => {
        checkVerificationStatus();
      }, 5000); // Poll every 5 seconds
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [verificationState.status]);

  const checkVerificationStatus = async () => {
    try {
      const token = await getAccessToken();
      if (!token) {
        console.log('No access token available');
        return;
      }
      
      const response = await fetch('/api/kyc/smile-id/status', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();

      if (response.ok && data.success) {
        const status = data.data.status.toLowerCase();
        setVerificationState({
          status: status as any,
          verificationUrl: data.data.verificationUrl,
          resultCode: data.data.resultCode,
          resultText: data.data.resultText,
        });

        if (status === 'success' || status === 'failed') {
          onVerificationComplete?.(status === 'success');
        }
      } else if (response.status === 404 || (data.error && data.code === 'NOT_FOUND')) {
        // No existing verification - this is normal for first-time users
        setVerificationState({ status: 'idle' });
      } else {
        console.error('Unexpected error checking verification status:', data);
        setVerificationState({ status: 'idle' });
      }
    } catch (error) {
      // Only log if it's not a network error or expected 404
      if (error instanceof Error && !error.message.includes('404')) {
        console.error('Failed to check verification status:', error);
      }
      setVerificationState({ status: 'idle' });
    } finally {
      setIsInitializing(false);
    }
  };

  const startVerification = async () => {
    const walletAddress = user?.wallet?.address;
    
    if (!walletAddress || !selectedCountry || !selectedIdType) {
      console.error('Missing required data:', { walletAddress, selectedCountry, selectedIdType });
      return;
    }

    setVerificationState({ status: 'loading' });

    try {
      // Generate nonce and sign message
      const nonce = Math.random().toString(36).substring(7);
      const message = `I accept the KYC Policy and hereby request an identity verification check for ${walletAddress} with nonce ${nonce}`;
      
      if (!message || message.trim() === '') {
        throw new Error('Message cannot be empty');
      }
      
      const signature = await signMessage({ message });

      // Request verification
      const token = await getAccessToken();
      if (!token) {
        throw new Error('Authentication required. Please sign in again.');
      }
      
      const response = await fetch('/api/kyc/smile-id/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          signature,
          nonce,
          country: selectedCountry,
          idType: selectedIdType,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setVerificationState({
          status: 'pending',
          verificationUrl: data.data.verificationUrl,
        });
      } else {
        setVerificationState({
          status: 'failed',
          error: data.error || 'Failed to start verification',
        });
      }
    } catch (error) {
      console.error('Verification request failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to start verification. Please try again.';
      setVerificationState({
        status: 'failed',
        error: errorMessage,
      });
    }
  };

  const resetVerification = () => {
    setVerificationState({ status: 'idle' });
    setSelectedCountry('');
    setSelectedIdType('');
  };

  if (isInitializing) {
    return (
      <Card className={`${className} bg-slate-900/90 border-slate-700`}>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2 text-blue-400" />
          <span className="text-slate-300">Checking verification status...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`${className} bg-slate-900/90 border-slate-700 !rounded-3xl`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <span>Identity Verification</span>
          {verificationState.status === 'success' && (
            <CheckCircle className="h-5 w-5 text-green-500" />
          )}
          {verificationState.status === 'failed' && (
            <XCircle className="h-5 w-5 text-red-500" />
          )}
          {verificationState.status === 'pending' && (
            <Clock className="h-5 w-5 text-yellow-500" />
          )}
        </CardTitle>
        <CardDescription className="text-slate-300">
          Verify your identity using Smile ID to access all platform features
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Verification Status Display */}
        {verificationState.status !== 'idle' && verificationState.status !== 'loading' && (
          <VerificationStatus
            status={verificationState.status}
            verificationUrl={verificationState.verificationUrl}
            error={verificationState.error}
            resultCode={verificationState.resultCode}
            resultText={verificationState.resultText}
            onReset={resetVerification}
          />
        )}

        {/* Verification Form */}
        {verificationState.status === 'idle' && (
          <div className="space-y-4">
            {!user?.wallet?.address ? (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                <p className="text-sm text-red-200">
                  Please connect your wallet to start identity verification.
                </p>
              </div>
            ) : (
              <>
                <CountrySelector
                  value={selectedCountry}
                  onChange={setSelectedCountry}
                />

                {selectedCountry && (
                  <IDTypeSelector
                    country={selectedCountry}
                    value={selectedIdType}
                    onChange={setSelectedIdType}
                  />
                )}

                {selectedCountry && selectedIdType && (
                  <div className="space-y-4">
                    <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-blue-200 mb-1">
                            You will be redirected to Smile ID
                          </p>
                          <p className="text-sm text-blue-100/80">
                            Complete your identity verification with your {selectedIdType.toLowerCase().replace('_', ' ')}. Please have it ready.
                          </p>
                        </div>
                      </div>
                    </div>

                    <Button
                      onClick={startVerification}
                      disabled={!user?.wallet?.address || !selectedCountry || !selectedIdType}
                      className="w-full h-11 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Start Verification
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Loading State */}
        {verificationState.status === 'loading' && (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2 text-blue-400" />
            <span className="text-slate-200">Starting verification...</span>
          </div>
        )}

        {/* Pending State with Link */}
        {verificationState.status === 'pending' && verificationState.verificationUrl && (
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-200 mb-1">
                    Verification in Progress
                  </p>
                  <p className="text-sm text-blue-100/80">
                    Click the button below to continue with Smile ID.
                  </p>
                </div>
              </div>
            </div>

            <Button
              asChild
              className="w-full h-11 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <a
                href={verificationState.verificationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2"
              >
                Continue Verification
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          </div>
        )}

        {/* Error State */}
        {verificationState.status === 'failed' && verificationState.error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <XCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-200 mb-1">
                  Verification Failed
                </p>
                <p className="text-sm text-red-100/80">
                  {verificationState.error}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
