/**
 * Initialize and register all offramp providers
 * 
 * This file is responsible for:
 * 1. Importing all provider implementations
 * 2. Registering them with the registry
 * 3. Setting priorities
 * 4. Enabling/disabling based on environment
 */

import { offrampRegistry } from './OfframpProviderRegistry';
import { payrampProvider } from '../payramp/PayrampProvider';
import { idrxProvider } from '../idrx/IDRXProvider';

/**
 * Initialize all offramp providers
 * Call this once at app startup
 */
export function initializeOfframpProviders(): void {
  console.log('🚀 Initializing offramp providers...');

  // Register Payramp (priority: 10)
  // Higher priority for East African countries
  offrampRegistry.register(payrampProvider, 10, true);

  // Register IDRX (priority: 10)
  // Only provider for Indonesia
  offrampRegistry.register(idrxProvider, 10, true);

  // Log statistics
  const stats = offrampRegistry.getStats();
  console.log('✓ Offramp providers initialized:', stats);
  console.log(`  - Total providers: ${stats.total}`);
  console.log(`  - Enabled providers: ${stats.enabled}`);
  stats.providers.forEach(p => {
    console.log(`    • ${p.name} (${p.id}): ${p.countries} countries, ${p.chains} chains, ${p.tokens} tokens`);
  });
}

/**
 * Get provider for a specific combination
 * Convenience function that wraps registry.selectProvider
 */
export function getProviderFor(country: string, chain: number, token: string) {
  return offrampRegistry.selectProvider(country, chain, token);
}

/**
 * Check if a combination is supported by any provider
 */
export function isOfframpSupported(country: string, chain: number, token: string): boolean {
  return offrampRegistry.isSupported(country, chain, token);
}
