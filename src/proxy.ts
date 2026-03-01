import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { COOKIE_NAME } from '@/config';

const protectedPaths = ['/dashboard', '/attendance', '/admin'];
const secretKey = process.env.JWT_SECRET || 'default-secret-change-me';
const encodedKey = new TextEncoder().encode(secretKey);

export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    const isProtected = protectedPaths.some((path) =>
        pathname.startsWith(path)
    );

    if (!isProtected) {
        return NextResponse.next();
    }

    const token = request.cookies.get(COOKIE_NAME)?.value;

    if (!token) {
        return NextResponse.redirect(new URL('/', request.url));
    }

    try {
        await jwtVerify(token, encodedKey, { algorithms: ['HS256'] });
        return NextResponse.next();
    } catch {
        return NextResponse.redirect(new URL('/', request.url));
    }
}

export const config = {
    matcher: ['/dashboard/:path*', '/attendance/:path*', '/admin/:path*'],
};
