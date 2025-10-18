import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();

    // Get the admin password from environment variables
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword) {
      console.error('ADMIN_PASSWORD not set in environment variables');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Verify the password
    if (password === adminPassword) {
      // Set a secure cookie to maintain authentication
      const cookieStore = await cookies();
      cookieStore.set('admin-authenticated', 'true', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24, // 24 hours
        path: '/', // Changed from '/admin' to '/' to work with /api/admin routes
      });

      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Password verification error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}

// Optional: Add a GET endpoint to check authentication status
export async function GET() {
  try {
    const cookieStore = await cookies();
    const isAuthenticated = cookieStore.get('admin-authenticated')?.value === 'true';

    return NextResponse.json({ authenticated: isAuthenticated });
  } catch (error) {
    console.error('Authentication check error:', error);
    return NextResponse.json({ authenticated: false });
  }
}
