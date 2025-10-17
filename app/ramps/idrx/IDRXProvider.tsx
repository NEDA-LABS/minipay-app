/**
 * IDRXProvider - Implementation of IOfframpProvider for IDRX
 * 
 * This provider handles offramp transactions for:
 * - Indonesia (IDR)
 * 
 * Supported chains: Base
 * Supported tokens: USDC
 */

import React from 'react';
import {
  IOfframpProvider,
  ProviderCapabilities,
  Currency,
  OfframpContext,
} from '../types/offramp.types';
import RedeemForm from '@/app/components/RedeemForm';

// Currency mapping for IDRX
const IDRX_CURRENCIES: Record<string, Currency> = {
  indonesia: {
    code: 'IDR',
    name: 'Indonesian Rupiah',
    symbol: 'Rp',
  },
};

class IDRXProvider implements IOfframpProvider {
  id = 'idrx';
  name = 'IDRX';
  description = 'Crypto-to-fiat offramp for Indonesia';
  logo = '/idrx-logo.png';

  capabilities: ProviderCapabilities = {
    supportedCountries: ['indonesia'],
    supportedChains: [8453], // Base only
    supportedTokens: ['USDC'],
    minAmount: 10,
    maxAmount: 50000,
    estimatedTime: '10-30 minutes',
    fees: {
      percentage: 2.0, // 2% fee
    },
  };

  /**
   * Check if IDRX supports the given combination
   */
  supports(country: string, chain: number, token: string): boolean {
    return (
      this.capabilities.supportedCountries.includes(country) &&
      this.capabilities.supportedChains.includes(chain) &&
      this.capabilities.supportedTokens.includes(token)
    );
  }

  /**
   * Get currency code for a country
   */
  getCurrencyCode(countryId: string): string | null {
    const currency = IDRX_CURRENCIES[countryId];
    return currency ? currency.code : null;
  }

  /**
   * Get available currencies for a country
   */
  getCurrencies(countryId: string): Currency[] {
    const currency = IDRX_CURRENCIES[countryId];
    return currency ? [currency] : [];
  }

  /**
   * Render IDRX-specific form
   */
  renderForm(context: OfframpContext): React.ReactNode {
    return <RedeemForm />;
  }

  /**
   * Validate transaction
   */
  validate(context: OfframpContext): { valid: boolean; error?: string } {
    // Check if combination is supported
    if (!this.supports(context.country.id, context.chain.id, context.token)) {
      return {
        valid: false,
        error: `IDRX does not support ${context.country.name}/${context.chain.name}/${context.token}`,
      };
    }

    // Check amount limits
    const amount = parseFloat(context.amount);
    if (isNaN(amount) || amount <= 0) {
      return {
        valid: false,
        error: 'Please enter a valid amount',
      };
    }

    if (this.capabilities.minAmount && amount < this.capabilities.minAmount) {
      return {
        valid: false,
        error: `Minimum amount is ${this.capabilities.minAmount} ${context.token}`,
      };
    }

    if (this.capabilities.maxAmount && amount > this.capabilities.maxAmount) {
      return {
        valid: false,
        error: `Maximum amount is ${this.capabilities.maxAmount} ${context.token}`,
      };
    }

    return { valid: true };
  }
}

// Export singleton instance
export const idrxProvider = new IDRXProvider();

// Export class for testing
export { IDRXProvider };
