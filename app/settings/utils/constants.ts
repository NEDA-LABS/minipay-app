export const TABS = [
  'profile',
  // 'payment',
  // 'security',
  // 'notifications',
  // 'api',
  // 'kyc',
] as const;
  
  export type TabId = typeof TABS[number];