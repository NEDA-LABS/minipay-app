/**
 * Core types for the Offramp system
 * These interfaces define the contract that all offramp providers must follow
 */

import { ChainConfig } from '../payramp/offrampHooks/constants';

/**
 * Represents a country supported by the offramp system
 */
export interface Country {
  id: string;
  name: string;
  flag: string;
  currency: string;
  currencySymbol: string;
  currencyCode: string;
  providers: string[]; // List of provider IDs that support this country
}

/**
 * Represents a currency supported by a provider
 */
export interface Currency {
  code: string;
  name: string;
  symbol: string;
}

/**
 * Context data passed to offramp providers
 * Contains all user selections from the selection phase
 */
export interface OfframpContext {
  // User selections
  country: Country;
  chain: ChainConfig;
  token: string;
  amount: string;
  userAddress: string;
  
  // Derived data
  currencyCode: string; // Auto-derived from country
  
  // Callbacks
  onBack: () => void;
  onSuccess?: (txHash: string) => void;
  onError?: (error: Error) => void;
}

/**
 * Provider capabilities and metadata
 */
export interface ProviderCapabilities {
  supportedCountries: string[];
  supportedChains: number[];
  supportedTokens: string[];
  minAmount?: number;
  maxAmount?: number;
  estimatedTime?: string; // e.g., "5-10 minutes"
  fees?: {
    fixed?: number;
    percentage?: number;
  };
}

/**
 * Main interface that all offramp providers must implement
 */
export interface IOfframpProvider {
  // Provider metadata
  id: string;
  name: string;
  description?: string;
  logo?: string;
  
  // Capabilities
  capabilities: ProviderCapabilities;
  
  /**
   * Check if this provider supports the given combination
   * @param country - Country ID
   * @param chain - Chain ID
   * @param token - Token symbol
   * @returns true if provider supports this combination
   */
  supports(country: string, chain: number, token: string): boolean;
  
  /**
   * Get the currency code for a given country
   * @param countryId - Country ID
   * @returns Currency code (e.g., 'TZS', 'IDR')
   */
  getCurrencyCode(countryId: string): string | null;
  
  /**
   * Get available currencies for a country
   * @param countryId - Country ID
   * @returns Array of supported currencies
   */
  getCurrencies(countryId: string): Currency[];
  
  /**
   * Render the provider-specific form component
   * @param context - Offramp context with user selections
   * @returns React component
   */
  renderForm(context: OfframpContext): React.ReactNode;
  
  /**
   * Validate if the provider can process the transaction
   * @param context - Offramp context
   * @returns Validation result with error message if invalid
   */
  validate(context: OfframpContext): {
    valid: boolean;
    error?: string;
  };
}

/**
 * Provider registry entry
 */
export interface ProviderRegistryEntry {
  provider: IOfframpProvider;
  priority: number; // Higher priority providers are preferred
  enabled: boolean;
}

/**
 * Result of provider selection
 */
export interface ProviderSelectionResult {
  provider: IOfframpProvider | null;
  alternatives: IOfframpProvider[]; // Other providers that also support this combination
  reason?: string; // Why this provider was selected or why none found
}
