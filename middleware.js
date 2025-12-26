// middleware.js - Route Protection + Security Headers
import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";

// Security Headers
const securityHeaders = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=*, microphone=*, geolocation=()',
};

export async function middleware(request) {
    const { pathname } = request.nextUrl;

    // Helper to add security headers to response
    const addSecurityHeaders = (response) => {
        Object.entries(securityHeaders).forEach(([key, value]) => {
            response.headers.set(key, value);
        });
        return response;
    };

    // Public routes that don't require authentication
    const publicPaths = ['/login', '/api/auth', '/api/setup'];
    const isPublicPath = publicPaths.some(path => pathname.startsWith(path));

    // Static files and assets don't need auth
    if (
        pathname.startsWith('/_next') ||
        pathname.startsWith('/favicon') ||
        pathname.includes('.') // files with extensions
    ) {
        return addSecurityHeaders(NextResponse.next());
    }

    // Allow public paths
    if (isPublicPath) {
        return addSecurityHeaders(NextResponse.next());
    }

    // Use env secret, with fallback for development only
    const secret = process.env.NEXTAUTH_SECRET || (process.env.NODE_ENV === 'development' ? 'dev-secret-key-change-in-production' : undefined);

    // Check for session token
    const token = await getToken({
        req: request,
        secret: secret,
    });

    // Protected routes - redirect to login if no token
    const protectedPaths = ['/dashboard', '/schedule', '/print'];
    const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path));

    if (isProtectedPath && !token) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('callbackUrl', pathname);
        return addSecurityHeaders(NextResponse.redirect(loginUrl));
    }

    // If user is logged in and trying to access login page, redirect to dashboard
    if (pathname === '/login' && token) {
        return addSecurityHeaders(NextResponse.redirect(new URL('/dashboard', request.url)));
    }

    return addSecurityHeaders(NextResponse.next());
}

// Only run middleware on specific routes
export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes) - handled separately
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
};
