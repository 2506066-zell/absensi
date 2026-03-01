import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { COOKIE_NAME, COOKIE_MAX_AGE } from '@/config';
import { SessionPayload } from '@/types';

const secretKey = process.env.JWT_SECRET || 'default-secret-change-me';
const encodedKey = new TextEncoder().encode(secretKey);

export async function createSession(payload: SessionPayload): Promise<string> {
    const token = await new SignJWT(payload as unknown as Record<string, unknown>)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(`${COOKIE_MAX_AGE}s`)
        .sign(encodedKey);

    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: COOKIE_MAX_AGE,
        path: '/',
    });

    return token;
}

export async function getSession(): Promise<SessionPayload | null> {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;

    try {
        const { payload } = await jwtVerify(token, encodedKey, {
            algorithms: ['HS256'],
        });
        return payload as unknown as SessionPayload;
    } catch {
        return null;
    }
}

export async function deleteSession(): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.delete(COOKIE_NAME);
}
