
'use server';

import { adminDb } from "@/lib/firebase/admin";
import Stripe from 'stripe';
import { Resend } from 'resend';
import PaymentSuccessEmail from "@/emails/payment-success-email";

const resend = new Resend(process.env.RESEND_API_KEY);


interface CheckoutSessionInput {
    eventId: string;
    eventName: string;
    priceInEur: number;
    guestCount: number;
}

interface PaymentSettings {
  stripeSecretKey: string;
}

export async function createCheckoutSession(
  input: CheckoutSessionInput
): Promise<{ sessionId?: string; error?: string; }> {
    try {
        // 1. Get Stripe Secret Key from secure server-side settings
        const settingsRef = adminDb.collection("settings").doc("payments");
        const settingsSnap = await settingsRef.get();

        if (!settingsSnap.exists) {
            throw new Error("Stripe settings are not configured in the admin panel.");
        }
        
        const settings = settingsSnap.data() as PaymentSettings;
        const stripeSecretKey = settings.stripeSecretKey;

        if (!stripeSecretKey || !stripeSecretKey.startsWith('sk_')) {
            throw new Error("Stripe Secret Key is not configured or is invalid.");
        }

        const stripe = new Stripe(stripeSecretKey, {
            apiVersion: '2024-06-20',
        });
        
        const successUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/client/events/${input.eventId}/payment-status?status=success&session_id={CHECKOUT_SESSION_ID}`;
        const cancelUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/client/events/${input.eventId}/payment-status?status=cancel`;


        // 2. Create a Stripe Checkout Session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card', 'ideal'],
            line_items: [
                {
                    price_data: {
                        currency: 'eur',
                        product_data: {
                            name: `Upgrade Event: ${input.eventName}`,
                            description: `Pakket voor maximaal ${input.guestCount} gasten.`,
                            metadata: {
                                eventId: input.eventId,
                            }
                        },
                        unit_amount: Math.round(input.priceInEur * 100), // Amount in cents
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: successUrl,
            cancel_url: cancelUrl,
            metadata: {
                eventId: input.eventId,
            },
            payment_intent_data: {
                metadata: {
                    eventId: input.eventId,
                }
            }
        });

        if (!session.id) {
            throw new Error("Could not create a Stripe session ID.");
        }

        return { sessionId: session.id };

    } catch (error: any) {
        console.error("Error creating Stripe checkout session:", error);
        return { error: error.message || "An unknown server error occurred." };
    }
}

export async function verifyStripeSession(sessionId: string): Promise<{ success: boolean; eventId?: string; error?: string }> {
     try {
        const settingsRef = adminDb.collection("settings").doc("payments");
        const settingsSnap = await settingsRef.get();
        
        if (!settingsSnap.exists) {
             throw new Error("Stripe settings are not configured.");
        }

        const settings = settingsSnap.data() as PaymentSettings;
        const stripeSecretKey = settings.stripeSecretKey;
         if (!stripeSecretKey) {
            throw new Error("Stripe Secret Key is not configured.");
        }

        const stripe = new Stripe(stripeSecretKey);
        const session = await stripe.checkout.sessions.retrieve(sessionId);

        if (session.payment_status === 'paid' && session.metadata?.eventId) {
            const eventId = session.metadata.eventId;
            const eventRef = adminDb.collection("events").doc(eventId);
            const eventDoc = await eventRef.get();
            
            // Check if the event exists and if it's already been marked as paid.
            if (eventDoc.exists && eventDoc.data()?.paid === true) {
                console.log(`Payment for event ${eventId} has already been processed.`);
                return { success: true, eventId: eventId };
            }

            // If not paid, update and send the email.
            await eventRef.update({ paid: true, isTest: false });

            // Send confirmation email
            if (eventDoc.exists) {
                const eventData = eventDoc.data();
                if (eventData?.owner && eventData?.name) {
                     try {
                        const dashboardUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/client/dashboard`;
                        await resend.emails.send({
                            from: 'Wegwerpcamera.nl <noreply@wegwerpcamera.nl>',
                            to: [eventData.owner],
                            subject: `Betalingsbevestiging voor uw evenement: ${eventData.name}`,
                            react: PaymentSuccessEmail({ 
                                eventName: eventData.name, 
                                dashboardLink: dashboardUrl 
                            }),
                        });
                        console.log(`Payment confirmation email sent for event ${eventId} to ${eventData.owner}`);
                    } catch (emailError) {
                        console.error(`Failed to send payment confirmation email for event ${eventId}:`, emailError);
                        // Do not fail the whole transaction if email fails.
                    }
                }
            }

            return { success: true, eventId: eventId };
        } else {
            return { success: false, error: "Payment not successful or session invalid." };
        }

    } catch (error: any) {
        console.error("Error verifying Stripe session:", error);
        return { success: false, error: error.message };
    }
}
