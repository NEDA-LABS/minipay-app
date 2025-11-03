import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Protected routes that require wallet connection
const PROTECTED_ROUTES = [
  '/dashboard',
  '/payments',
  '/payment-link',
  '/stablecoins',
];

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const search = request.nextUrl.searchParams;
  // Check if the requested path is a protected route
  const isProtectedRoute = PROTECTED_ROUTES.some(route => 
    request.nextUrl.pathname.startsWith(route)
  );

  // Special case for payment-link route to prevent redirect loops
  const isPaymentLinkRoute = request.nextUrl.pathname.startsWith('/payment-link');
  
  // Skip middleware check for payment-link route if coming from another page
  // This prevents redirect loops when navigating to payment-link
  if (isPaymentLinkRoute) {
    // Check if the request has a referer from the same host or if there's a wallet_connected cookie
    const hasInternalReferer = request.headers.get('referer')?.includes(request.headers.get('host') || '');
    const hasWalletCookie = request.cookies.get('wallet_connected')?.value === 'true';
    
    if (hasInternalReferer || hasWalletCookie) {
      console.log('Middleware: Allowing access to payment-link from internal navigation or with wallet cookie');
      return NextResponse.next();
    }
  }

  // If root path and Minipay detected, redirect straight to dashboard
  if (pathname === '/') {
    const userAgent = request.headers.get('user-agent') || '';
    const isMinipayUA = userAgent.includes('MiniPay') || userAgent.includes('Opera Mini');
    const hasMinipayQuery = search.get('minipay') === '1';
    if (isMinipayUA || hasMinipayQuery || request.headers.get('x-minipay') === 'true') {
      const url = new URL('/dashboard', request.url);
      url.searchParams.set('minipay', '1');
      return NextResponse.redirect(url);
    }
  }

  if (isProtectedRoute) {
    // Check for Minipay user agent - allow direct access
    const userAgent = request.headers.get('user-agent') || '';
    const isMinipay = userAgent.includes('MiniPay') || 
                      userAgent.includes('Opera Mini') ||
                      request.headers.get('x-minipay') === 'true' ||
                      search.get('minipay') === '1';
    
    if (isMinipay) {
      console.log('Middleware: Minipay detected, allowing direct access');
      return NextResponse.next();
    }

    // For regular browsers, check wallet connection cookie
    const walletConnected = request.cookies.get('wallet_connected');
    
    // If wallet is not connected, redirect to home page
    if (!walletConnected || walletConnected.value !== 'true') {
      console.log('Middleware: No wallet connection detected, redirecting to home');
      const url = new URL('/', request.url);
      url.searchParams.set('walletRequired', 'true');
      return NextResponse.redirect(url);
    }
    
    // Log successful authentication
    console.log('Middleware: Wallet connection verified, allowing access to protected route');
  }

  return NextResponse.next();
}

// Configure the middleware to run on specific paths
export const config = {
  matcher: [
    '/',
    '/dashboard/:path*',
    '/payments/:path*',
    '/payment-link/:path*',
    '/stablecoins/:path*',
  ],
};

