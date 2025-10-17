/**
 * PayrampProvider - Implementation of IOfframpProvider for Payramp
 * 
 * This provider handles offramp transactions for:
 * - Tanzania (TZS)
 * - Kenya (KES)
 * - Uganda (UGX)
 * - Nigeria (NGN)
 * 
 * Supported chains: Base, Arbitrum, Polygon
 * Supported tokens: USDC, USDT, CNGN
 */

import React from 'react';
import {
  IOfframpProvider,
  ProviderCapabilities,
  Currency,
  OfframpContext,
} from '../types/offramp.types';
import OffRampForm from './OffRampForm';

// Currency mapping for Payramp
const PAYRAMP_CURRENCIES: Record<string, Currency> = {
  tanzania: {
    code: 'TZS',
    name: 'Tanzanian Shilling',
    symbol: 'TSh',
  },
  kenya: {
    code: 'KES',
    name: 'Kenyan Shilling',
    symbol: 'KSh',
  },
  uganda: {
    code: 'UGX',
    name: 'Ugandan Shilling',
    symbol: 'USh',
  },
  nigeria: {
    code: 'NGN',
    name: 'Nigerian Naira',
    symbol: '₦',
  },
};

class PayrampProvider implements IOfframpProvider {
  id = 'payramp';
  name = 'Payramp';
  description = 'Fast and secure crypto-to-fiat offramp for East Africa';
  logo = '/payramp-logo.png';

  capabilities: ProviderCapabilities = {
    supportedCountries: ['tanzania', 'kenya', 'uganda', 'nigeria'],
    supportedChains: [8453, 42161, 137], // Base, Arbitrum, Polygon
    supportedTokens: ['USDC', 'USDT', 'CNGN'],
    minAmount: 1,
    maxAmount: 100000,
    estimatedTime: '5-15 minutes',
    fees: {
      percentage: 1.5, // 1.5% fee
    },
  };

  /**
   * Check if Payramp supports the given combination
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
    const currency = PAYRAMP_CURRENCIES[countryId];
    return currency ? currency.code : null;
  }

  /**
   * Get available currencies for a country
   */
  getCurrencies(countryId: string): Currency[] {
    const currency = PAYRAMP_CURRENCIES[countryId];
    return currency ? [currency] : [];
  }

  /**
   * Render Payramp-specific form
   */
  renderForm(context: OfframpContext): React.ReactNode {
    // Pre-populate the currency based on country
    const preselectedCurrency = this.getCurrencyCode(context.country.id);

    return (
      <OffRampForm
        chain={context.chain}
        token={context.token}
        onTokenChange={(newToken) => {
          // Token change callback if needed
          console.log('Token changed to:', newToken);
        }}
        onBack={context.onBack}
        isAccountVerified={false}
        setIsAccountVerified={() => {}}
        preselectedCurrency={preselectedCurrency || undefined}
      />
    );
  }

  /**
   * Validate transaction
   */
  validate(context: OfframpContext): { valid: boolean; error?: string } {
    // Check if combination is supported
    if (!this.supports(context.country.id, context.chain.id, context.token)) {
      return {
        valid: false,
        error: `Payramp does not support ${context.country.name}/${context.chain.name}/${context.token}`,
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
export const payrampProvider = new PayrampProvider();

// Export class for testing
export { PayrampProvider };
