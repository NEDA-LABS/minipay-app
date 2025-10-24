'use client';

/**
 * Verification Status Component for Smile ID
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock, ExternalLink, RefreshCw } from 'lucide-react';

interface VerificationStatusProps {
  status: 'pending' | 'success' | 'failed' | 'expired';
  verificationUrl?: string;
  error?: string;
  resultCode?: string;
  resultText?: string;
  onReset?: () => void;
}

export function VerificationStatus({
  status,
  verificationUrl,
  error,
  resultCode,
  resultText,
  onReset,
}: VerificationStatusProps) {
  const getStatusIcon = () => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'expired':
        return <Clock className="h-5 w-5 text-gray-500" />;
      case 'pending':
      default:
        return <Clock className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusBadge = () => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-100 text-green-800">Verified</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'expired':
        return <Badge variant="secondary">Expired</Badge>;
      case 'pending':
      default:
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
    }
  };

  const getStatusMessage = () => {
    switch (status) {
      case 'success':
        return 'Your identity has been successfully verified!';
      case 'failed':
        return error || resultText || 'Identity verification failed. Please try again.';
      case 'expired':
        return 'Your verification link has expired. Please start a new verification.';
      case 'pending':
      default:
        return 'Your verification is in progress. Please complete the process using the link below.';
    }
  };

  const getAlertVariant = () => {
    switch (status) {
      case 'success':
        return 'default';
      case 'failed':
        return 'destructive';
      case 'expired':
        return 'default';
      case 'pending':
      default:
        return 'default';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <span className="font-medium">Verification Status</span>
        </div>
        {getStatusBadge()}
      </div>

      <Alert variant={getAlertVariant()}>
        <AlertDescription>
          {getStatusMessage()}
        </AlertDescription>
      </Alert>

      {/* Result details for failed verifications */}
      {status === 'failed' && resultCode && (
        <div className="text-sm text-muted-foreground space-y-1">
          <p><strong>Error Code:</strong> {resultCode}</p>
          {resultText && <p><strong>Details:</strong> {resultText}</p>}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2">
        {status === 'pending' && verificationUrl && (
          <Button asChild className="flex-1">
            <a
              href={verificationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2"
            >
              Continue Verification
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        )}

        {(status === 'failed' || status === 'expired') && onReset && (
          <Button onClick={onReset} variant="outline" className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
        )}
      </div>

      {/* Help text */}
      {status === 'pending' && (
        <div className="text-sm text-muted-foreground">
          <p>
            Complete your verification on Smile ID. This page will automatically update when 
            your verification is processed.
          </p>
        </div>
      )}

      {status === 'success' && (
        <div className="text-sm text-muted-foreground">
          <p>
            Your identity verification is complete. You now have access to all platform features.
          </p>
        </div>
      )}
    </div>
  );
}
