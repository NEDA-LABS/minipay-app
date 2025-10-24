/**
 * Smile ID Webhook Handler
 * Processes incoming webhooks from Smile ID
 */

import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { SmileIDService } from './service';
import { SmileIDWebhookPayload, SmileIDWebhookError, SmileIDSignatureError } from './types';
import { verifyWebhookSignature } from './signature';
import { getSmileIDConfig } from './config';

export class SmileIDWebhookHandler {
  private smileIdService: SmileIDService;
  private config: ReturnType<typeof getSmileIDConfig>;

  constructor(prisma: PrismaClient) {
    this.smileIdService = new SmileIDService(prisma);
    this.config = getSmileIDConfig();
  }

  /**
   * Handle incoming webhook from Smile ID
   */
  async handleWebhook(request: NextRequest): Promise<{ success: boolean; message: string }> {
    try {
      // Parse request body
      const payload = await this.parseWebhookPayload(request);

      // Verify signature
      if (!this.verifySignature(payload)) {
        throw new SmileIDSignatureError('Invalid webhook signature');
      }

      // Validate payload structure
      this.validatePayload(payload);

      // Process the webhook
      await this.smileIdService.processWebhook(payload);

      return {
        success: true,
        message: 'Webhook processed successfully',
      };
    } catch (error) {
      console.error('Webhook processing failed:', error);
      
      if (error instanceof SmileIDSignatureError) {
        return {
          success: false,
          message: 'Invalid signature',
        };
      }

      if (error instanceof SmileIDWebhookError) {
        return {
          success: false,
          message: error.message,
        };
      }

      return {
        success: false,
        message: 'Internal server error',
      };
    }
  }

  /**
   * Parse webhook payload from request
   */
  private async parseWebhookPayload(request: NextRequest): Promise<SmileIDWebhookPayload> {
    try {
      const body = await request.text();
      const payload = JSON.parse(body) as SmileIDWebhookPayload;
      
      return payload;
    } catch (error) {
      throw new SmileIDWebhookError('Invalid JSON payload');
    }
  }

  /**
   * Verify webhook signature
   */
  private verifySignature(payload: SmileIDWebhookPayload): boolean {
    try {
      return verifyWebhookSignature(
        {
          signature: payload.signature,
          timestamp: payload.timestamp,
        },
        this.config
      );
    } catch (error) {
      console.error('Signature verification error:', error);
      return false;
    }
  }

  /**
   * Validate webhook payload structure
   */
  private validatePayload(payload: SmileIDWebhookPayload): void {
    if (!payload.ResultCode) {
      throw new SmileIDWebhookError('Missing ResultCode in payload');
    }

    if (!payload.PartnerParams?.user_id) {
      throw new SmileIDWebhookError('Missing user_id in PartnerParams');
    }

    if (!payload.signature) {
      throw new SmileIDWebhookError('Missing signature in payload');
    }

    if (!payload.timestamp) {
      throw new SmileIDWebhookError('Missing timestamp in payload');
    }
  }
}

/**
 * Utility function to create webhook handler
 */
export function createSmileIDWebhookHandler(prisma: PrismaClient) {
  return new SmileIDWebhookHandler(prisma);
}
