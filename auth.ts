import NextAuth from "next-auth"
import type { NextAuthConfig } from "next-auth"
import Google from "next-auth/providers/google"

export const authConfig = {
    pages: {
        signIn: "/sign-in",
    },
    callbacks: {
        async signIn({ user }) {
            const email = user.email?.toLowerCase();
            
            if (!email) {
                console.log('[Auth] Sign-in denied: No email provided');
                return false;
            }

            // 检查白名单域名
            const allowedDomains = process.env.ALLOWED_EMAIL_DOMAINS?.split(',')
                .map(d => d.trim().toLowerCase()) || [];
            
            for (const domain of allowedDomains) {
                if (email.endsWith(domain)) {
                    console.log(`[Auth] Sign-in allowed: ${email} matches domain ${domain}`);
                    return true;
                }
            }

            // 检查白名单邮箱
            const allowedEmails = process.env.ALLOWED_EMAILS?.split(',')
                .map(e => e.trim().toLowerCase()) || [];
            
            if (allowedEmails.includes(email)) {
                console.log(`[Auth] Sign-in allowed: ${email} in whitelist`);
                return true;
            }

            console.log(`[Auth] Sign-in denied: ${email} not in whitelist`);
            return false;
        },
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user
            const isOnSignIn = nextUrl.pathname.startsWith("/sign-in")

            if (isLoggedIn) {
                if (isOnSignIn) {
                    return Response.redirect(new URL("/", nextUrl))
                }
                return true
            }

            if (isOnSignIn) {
                return true
            }

            return false
        },
        async jwt({ token, profile, account }) {
            if (profile) {
                const googleProfile = profile as { picture?: string };
                if (googleProfile.picture) {
                    token.picture = googleProfile.picture
                }
            }
            
            if (account?.provider === 'google' && account.providerAccountId) {
                token.googleUserId = account.providerAccountId
            }
            
            return token
        },
        async session({ session, token }) {
            if (token?.picture && session.user) {
                session.user.image = token.picture as string;
            }
            if (token?.googleUserId && session.user) {
                session.user.id = token.googleUserId as string;
            } else if (token?.sub && session.user) {
                session.user.id = token.sub;
            }
            return session
        },
    },
    providers: [
        Google({
            clientId: process.env.AUTH_GOOGLE_ID,
            clientSecret: process.env.AUTH_GOOGLE_SECRET,
        }),
    ],
    trustHost: true,
} satisfies NextAuthConfig

export const { handlers, signIn, signOut, auth } = NextAuth(authConfig)
