/**
 * Smile ID KYC Service
 * Main service class for Smile ID integration
 */

import { PrismaClient } from '@prisma/client';
import {
  SmileIDConfig,
  SmileIDVerificationRequest,
  SmileIDVerificationResponse,
  SmileIDVerificationStatus,
  SmileIDLinkRequest,
  SmileIDLinkResponse,
  SmileIDProviderError,
  SmileIDError,
  SMILE_ID_SUCCESS_CODES,
  SMILE_ID_FAILED_CODES,
} from './types';
import { getSmileIDConfig, SMILE_ID_CONSTANTS, getWebhookUrl } from './config';
import { generateSmileIDSignature, generateTimestamp } from './signature';
import idTypesData from './id_types.json';

export class SmileIDService {
  private config: SmileIDConfig;
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.config = getSmileIDConfig();
    this.prisma = prisma;
  }

  /**
   * Request a new KYC verification
   */
  async requestVerification(request: SmileIDVerificationRequest): Promise<SmileIDVerificationResponse> {
    try {
      // Check for existing verification
      const existingVerification = await this.prisma.smileIDVerification.findUnique({
        where: { privyUserId: request.privyUserId },
      });

      const timestamp = new Date();

      // Handle existing verification logic
      if (existingVerification) {
        // If already successful, reject
        if (existingVerification.status === 'SUCCESS') {
          throw new SmileIDError('Wallet address already verified', 'ALREADY_VERIFIED');
        }

        // If pending and not expired, return existing URL
        if (
          existingVerification.status === 'PENDING' &&
          existingVerification.expiresAt > timestamp
        ) {
          return {
            verificationUrl: existingVerification.verificationUrl,
            referenceId: existingVerification.platformRef,
            expiresAt: existingVerification.expiresAt,
          };
        }

        // If failed or expired, delete and create new
        if (
          existingVerification.status === 'FAILED' ||
          existingVerification.status === 'EXPIRED' ||
          existingVerification.expiresAt <= timestamp
        ) {
          await this.prisma.smileIDVerification.delete({
            where: { id: existingVerification.id },
          });
        }
      }

      // Get supported ID types for the selected country
      const supportedTypes = this.getSupportedTypes(request.country);
      
      // Filter to only the selected country's ID types
      let idTypes = supportedTypes.continents
        .flatMap((continent: any) => 
          continent.countries
            .filter((country: any) => country.code === request.country?.toUpperCase())
            .flatMap((country: any) => country.id_types)
        );

      // If a specific ID type is selected, filter to just that one
      if (request.idType && idTypes.length > 0) {
        const filteredTypes = idTypes.filter((idType: any) => idType.type === request.idType);
        if (filteredTypes.length > 0) {
          idTypes = filteredTypes;
        }
      }

      if (idTypes.length === 0) {
        console.error('No ID types found:', {
          country: request.country,
          idType: request.idType,
          availableCountries: supportedTypes.continents.flatMap((c: any) => c.countries.map((co: any) => co.code)),
        });
        throw new SmileIDError(
          `No supported ID types found for country ${request.country} and ID type ${request.idType}`,
          'INVALID_ID_TYPE'
        );
      }

      // Format ID types for Smile ID API
      const formattedIdTypes = idTypes.map((idType: any) => ({
        country: request.country?.toUpperCase(),
        id_type: idType.type,
        verification_method: idType.verification_method,
      }));

      // Generate signature and create Smile Link
      const linkTimestamp = generateTimestamp();
      const signature = generateSmileIDSignature(linkTimestamp, this.config);
      const expiresAt = new Date(timestamp.getTime() + SMILE_ID_CONSTANTS.VERIFICATION_EXPIRY_HOURS * 60 * 60 * 1000);

      const linkRequest: SmileIDLinkRequest = {
        partner_id: this.config.partnerId,
        signature,
        timestamp: linkTimestamp,
        name: SMILE_ID_CONSTANTS.VERIFICATION_NAME,
        company_name: SMILE_ID_CONSTANTS.COMPANY_NAME,
        id_types: formattedIdTypes,
        callback_url: getWebhookUrl(),
        data_privacy_policy_url: SMILE_ID_CONSTANTS.DATA_PRIVACY_POLICY_URL,
        logo_url: SMILE_ID_CONSTANTS.LOGO_URL,
        is_single_use: true,
        user_id: request.privyUserId,
        expires_at: expiresAt.toISOString(),
      };

      // Make API request to Smile ID
      const response = await this.makeSmileIDRequest('/v1/smile_links', linkRequest);
      const linkResponse = response as SmileIDLinkResponse;

      // Find user by Privy ID
      const user = await this.prisma.user.findUnique({
        where: { privyUserId: request.privyUserId },
      });

      if (!user) {
        throw new SmileIDError('User not found for Privy ID', 'USER_NOT_FOUND');
      }

      // Check if user has email (required for notifications)
      if (!user.email) {
        throw new SmileIDError('Email address is required for KYC verification', 'EMAIL_REQUIRED');
      }

      // Store verification in database
      const verification = await this.prisma.smileIDVerification.create({
        data: {
          userId: user.id,
          privyUserId: request.privyUserId,
          platformRef: linkResponse.ref_id,
          verificationUrl: linkResponse.link,
          status: 'PENDING',
          country: request.country,
          idType: request.idType,
          expiresAt,
          emailSent: false,
        },
      });

      return {
        verificationUrl: verification.verificationUrl,
        referenceId: verification.platformRef,
        expiresAt: verification.expiresAt,
      };
    } catch (error) {
      if (error instanceof SmileIDError) {
        throw error;
      }
      throw new SmileIDProviderError(
        `Failed to request verification: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Check verification status
   */
  async checkStatus(privyUserId: string): Promise<SmileIDVerificationStatus> {
    try {
      const verification = await this.prisma.smileIDVerification.findUnique({
        where: { privyUserId },
      });

      if (!verification) {
        throw new SmileIDError('No verification found for Privy user ID', 'NOT_FOUND');
      }

      let status = verification.status;

      // Check if expired
      if (verification.status === 'PENDING' && verification.expiresAt <= new Date()) {
        status = 'EXPIRED';
        
        // Update status in database
        await this.prisma.smileIDVerification.update({
          where: { id: verification.id },
          data: { status: 'EXPIRED' },
        });
      }

      return {
        status,
        verificationUrl: verification.verificationUrl,
        resultCode: verification.resultCode || undefined,
        resultText: verification.resultText || undefined,
        completedAt: verification.completedAt || undefined,
      };
    } catch (error) {
      if (error instanceof SmileIDError) {
        throw error;
      }
      throw new SmileIDProviderError(
        `Failed to check status: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Get supported ID types by country
   */
  getSupportedTypes(country?: string) {
    const data = idTypesData as any;
    
    if (!country) {
      return data;
    }

    // Filter by country
    const filteredData = {
      continents: data.continents.map((continent: any) => ({
        ...continent,
        countries: continent.countries.filter((c: any) => c.code === country.toUpperCase()),
      })).filter((continent: any) => continent.countries.length > 0),
    };

    return filteredData;
  }

  /**
   * Process webhook from Smile ID
   */
  async processWebhook(payload: any): Promise<void> {
    try {
      const privyUserId = payload.PartnerParams?.user_id;
      if (!privyUserId) {
        throw new SmileIDError('Missing user_id in webhook payload', 'INVALID_PAYLOAD');
      }

      const verification = await this.prisma.smileIDVerification.findUnique({
        where: { privyUserId },
        include: { user: true },
      });

      if (!verification) {
        throw new SmileIDError('Verification not found for webhook', 'VERIFICATION_NOT_FOUND');
      }

      // Determine status based on result code
      let status: 'SUCCESS' | 'FAILED' | 'PENDING' = 'PENDING';
      
      if (SMILE_ID_SUCCESS_CODES.includes(payload.ResultCode as any)) {
        status = 'SUCCESS';
      } else if (SMILE_ID_FAILED_CODES.includes(payload.ResultCode as any)) {
        status = 'FAILED';
      }

      // Update verification status
      await this.prisma.smileIDVerification.update({
        where: { id: verification.id },
        data: {
          status,
          resultCode: payload.ResultCode,
          resultText: payload.ResultText,
          completedAt: status !== 'PENDING' ? new Date() : null,
        },
      });

      // Return verification with user data for email sending
      return { verification, user: verification.user, status };

      // Store webhook event
      await this.prisma.smileIDWebhookEvent.create({
        data: {
          smileIdVerificationId: verification.id,
          resultCode: payload.ResultCode,
          resultText: payload.ResultText,
          payload: payload,
          signature: payload.signature || '',
          processed: true,
          processedAt: new Date(),
        },
      });
    } catch (error) {
      // Store failed webhook event if verification exists
      try {
        const privyUserId = payload.PartnerParams?.user_id;
        if (privyUserId) {
          const verification = await this.prisma.smileIDVerification.findUnique({
            where: { privyUserId },
          });
          
          if (verification) {
            await this.prisma.smileIDWebhookEvent.create({
              data: {
                smileIdVerificationId: verification.id,
                resultCode: payload.ResultCode || 'ERROR',
                resultText: payload.ResultText,
                payload: payload,
                signature: payload.signature || '',
                processed: false,
                errorMessage: error instanceof Error ? error.message : 'Unknown error',
              },
            });
          }
        }
      } catch (dbError) {
        console.error('Failed to store webhook error:', dbError);
      }

      throw error;
    }
  }

  /**
   * Make HTTP request to Smile ID API
   */
  private async makeSmileIDRequest(endpoint: string, data: any): Promise<any> {
    const url = `${this.config.baseUrl}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        signal: AbortSignal.timeout(SMILE_ID_CONSTANTS.DEFAULT_TIMEOUT),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new SmileIDProviderError(
          `Smile ID API error: ${response.status} ${response.statusText} - ${errorText}`
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof SmileIDError) {
        throw error;
      }
      throw new SmileIDProviderError(
        `Failed to communicate with Smile ID: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Flatten ID types configuration for Smile ID API
   */
  private getFlattenedIdTypes(): Array<{ country: string; id_type: string; verification_method: string }> {
    const data = idTypesData as any;
    const flattened: Array<{ country: string; id_type: string; verification_method: string }> = [];

    for (const continent of data.continents) {
      for (const country of continent.countries) {
        for (const idType of country.id_types) {
          flattened.push({
            country: country.code,
            id_type: idType.type,
            verification_method: idType.verification_method,
          });
        }
      }
    }

    return flattened;
  }
}
