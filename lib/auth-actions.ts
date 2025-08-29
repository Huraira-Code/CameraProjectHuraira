
'use server';

import { Resend } from 'resend';
import { adminAuth } from '@/lib/firebase/admin';
import ForgotPasswordEmail from '@/emails/forgot-password-email';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendPasswordResetEmail(email: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if the user exists first
    try {
        await adminAuth.getUserByEmail(email);
    } catch (error: any) {
        if (error.code === 'auth/user-not-found') {
            // To prevent user enumeration, we act as if the email was sent successfully.
            console.log(`Password reset requested for non-existent user: ${email}`);
            return { success: true };
        }
        throw error; // Re-throw other auth errors
    }

    // Generate a password reset link
    const link = await adminAuth.generatePasswordResetLink(email);

    // Send the email using Resend
    const { data, error } = await resend.emails.send({
      from: 'Wegwerpcamera.nl <noreply@wegwerpcamera.nl>',
      to: [email],
      subject: 'Reset uw wachtwoord voor Wegwerpcamera.nl',
      react: ForgotPasswordEmail({ validationLink: link }),
    });

    if (error) {
      console.error('Resend API error:', error);
      throw new Error(error.message);
    }

    return { success: true };
  } catch (error: any) {
    console.error('Failed to send password reset email:', error);
    return { success: false, error: error.message || 'An unknown error occurred.' };
  }
}


export async function createImpersonationToken(email: string): Promise<{ success: boolean; token?: string, error?: string }> {
    try {
        const user = await adminAuth.getUserByEmail(email);
        const customToken = await adminAuth.createCustomToken(user.uid);
        return { success: true, token: customToken };
    } catch(error: any) {
        console.error(`Failed to create impersonation token for ${email}:`, error);
        return { success: false, error: error.message || "Could not create token." };
    }
}
