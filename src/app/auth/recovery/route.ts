import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Dedicated callback route for PASSWORD RECOVERY flow.
 * Supabase replaces query params when appending `code`, so we use
 * a separate route that always redirects to /reset-password.
 */
export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const token_hash = searchParams.get('token_hash')
    const type = searchParams.get('type')

    const supabase = await createClient()

    // Handle PKCE flow (code-based)
    if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error) {
            return NextResponse.redirect(`${origin}/reset-password`)
        }
    }

    // Handle token_hash flow (magic link / OTP)
    if (token_hash && type) {
        const { error } = await supabase.auth.verifyOtp({
            type: type as 'recovery',
            token_hash,
        })
        if (!error) {
            return NextResponse.redirect(`${origin}/reset-password`)
        }
    }

    // If nothing worked, redirect back to forgot-password with error
    return NextResponse.redirect(`${origin}/forgot-password?error=invalid_or_expired_link`)
}
