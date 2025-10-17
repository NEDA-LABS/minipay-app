/**
 * OfframpProviderRegistry - Central registry for all offramp providers
 * 
 * This registry manages all available offramp providers and handles:
 * - Provider registration
 * - Provider selection based on country/chain/token
 * - Provider prioritization
 * - Provider validation
 * 
 * Design Pattern: Registry Pattern + Strategy Pattern
 * - Registry: Manages collection of providers
 * - Strategy: Each provider implements the same interface
 */

import {
  IOfframpProvider,
  ProviderRegistryEntry,
  ProviderSelectionResult,
} from '../types/offramp.types';

class OfframpProviderRegistry {
  private providers: Map<string, ProviderRegistryEntry> = new Map();
  private static instance: OfframpProviderRegistry;

  private constructor() {
    // Private constructor for singleton pattern
  }

  /**
   * Get singleton instance
   */
  static getInstance(): OfframpProviderRegistry {
    if (!OfframpProviderRegistry.instance) {
      OfframpProviderRegistry.instance = new OfframpProviderRegistry();
    }
    return OfframpProviderRegistry.instance;
  }

  /**
   * Register a new provider
   * @param provider - Provider implementation
   * @param priority - Priority (higher = preferred), default 0
   * @param enabled - Whether provider is enabled, default true
   */
  register(
    provider: IOfframpProvider,
    priority: number = 0,
    enabled: boolean = true
  ): void {
    if (this.providers.has(provider.id)) {
      console.warn(`Provider ${provider.id} is already registered. Overwriting.`);
    }

    this.providers.set(provider.id, {
      provider,
      priority,
      enabled,
    });

    console.log(`✓ Registered offramp provider: ${provider.name} (${provider.id})`);
  }

  /**
   * Unregister a provider
   * @param providerId - Provider ID to remove
   */
  unregister(providerId: string): void {
    this.providers.delete(providerId);
  }

  /**
   * Enable or disable a provider
   * @param providerId - Provider ID
   * @param enabled - Whether to enable or disable
   */
  setEnabled(providerId: string, enabled: boolean): void {
    const entry = this.providers.get(providerId);
    if (entry) {
      entry.enabled = enabled;
    }
  }

  /**
   * Get a specific provider by ID
   * @param providerId - Provider ID
   * @returns Provider or null if not found
   */
  getProvider(providerId: string): IOfframpProvider | null {
    const entry = this.providers.get(providerId);
    return entry?.enabled ? entry.provider : null;
  }

  /**
   * Get all registered providers
   * @param enabledOnly - Return only enabled providers
   * @returns Array of providers
   */
  getAllProviders(enabledOnly: boolean = true): IOfframpProvider[] {
    const entries = Array.from(this.providers.values());
    
    return entries
      .filter(entry => !enabledOnly || entry.enabled)
      .sort((a, b) => b.priority - a.priority) // Higher priority first
      .map(entry => entry.provider);
  }

  /**
   * Find the best provider for a given combination
   * @param country - Country ID
   * @param chain - Chain ID
   * @param token - Token symbol
   * @returns Selection result with primary provider and alternatives
   */
  selectProvider(
    country: string,
    chain: number,
    token: string
  ): ProviderSelectionResult {
    const enabledProviders = this.getAllProviders(true);
    
    // Find all providers that support this combination
    const supportingProviders = enabledProviders.filter(provider =>
      provider.supports(country, chain, token)
    );

    if (supportingProviders.length === 0) {
      return {
        provider: null,
        alternatives: [],
        reason: `No provider supports ${country}/${chain}/${token}`,
      };
    }

    // Sort by priority (already sorted by getAllProviders)
    const [primary, ...alternatives] = supportingProviders;

    return {
      provider: primary,
      alternatives,
      reason: `Selected ${primary.name} (highest priority)`,
    };
  }

  /**
   * Get all providers that support a specific country
   * @param countryId - Country ID
   * @returns Array of supporting providers
   */
  getProvidersForCountry(countryId: string): IOfframpProvider[] {
    return this.getAllProviders(true).filter(provider =>
      provider.capabilities.supportedCountries.includes(countryId)
    );
  }

  /**
   * Get all providers that support a specific chain
   * @param chainId - Chain ID
   * @returns Array of supporting providers
   */
  getProvidersForChain(chainId: number): IOfframpProvider[] {
    return this.getAllProviders(true).filter(provider =>
      provider.capabilities.supportedChains.includes(chainId)
    );
  }

  /**
   * Get all providers that support a specific token
   * @param token - Token symbol
   * @returns Array of supporting providers
   */
  getProvidersForToken(token: string): IOfframpProvider[] {
    return this.getAllProviders(true).filter(provider =>
      provider.capabilities.supportedTokens.includes(token)
    );
  }

  /**
   * Check if any provider supports the combination
   * @param country - Country ID
   * @param chain - Chain ID
   * @param token - Token symbol
   * @returns true if at least one provider supports it
   */
  isSupported(country: string, chain: number, token: string): boolean {
    const result = this.selectProvider(country, chain, token);
    return result.provider !== null;
  }

  /**
   * Get provider statistics
   * @returns Statistics object
   */
  getStats() {
    const all = Array.from(this.providers.values());
    const enabled = all.filter(e => e.enabled);
    
    return {
      total: all.length,
      enabled: enabled.length,
      disabled: all.length - enabled.length,
      providers: enabled.map(e => ({
        id: e.provider.id,
        name: e.provider.name,
        priority: e.priority,
        countries: e.provider.capabilities.supportedCountries.length,
        chains: e.provider.capabilities.supportedChains.length,
        tokens: e.provider.capabilities.supportedTokens.length,
      })),
    };
  }

  /**
   * Clear all registered providers (useful for testing)
   */
  clear(): void {
    this.providers.clear();
  }
}

// Export singleton instance
export const offrampRegistry = OfframpProviderRegistry.getInstance();

// Export class for testing
export { OfframpProviderRegistry };
