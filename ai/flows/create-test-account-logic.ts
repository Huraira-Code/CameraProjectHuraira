
// This file is NOT a server action, it contains the internal business logic.
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getFirebaseAdmin } from '@/lib/firebase/admin';
import { createEvent } from '@/lib/events';
import { UserRecord } from 'firebase-admin/auth';
import { v4 as uuidv4 } from 'uuid';

// Define Zod schemas internally
const CreateTestAccountInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});
export type CreateTestAccountInput = z.infer<typeof CreateTestAccountInputSchema>;

const CreateTestAccountOutputSchema = z.object({
  success: z.boolean(),
  userId: z.string().optional(),
  eventId: z.string().optional(),
  error: z.string().optional(),
});
export type CreateTestAccountOutput = z.infer<typeof CreateTestAccountOutputSchema>;


// This is the internal logic function
export async function createTestAccountLogic(input: CreateTestAccountInput): Promise<CreateTestAccountOutput> {
  const { adminAuth, db } = getFirebaseAdmin();
  let user: UserRecord | undefined;
  const eventId = `test-${uuidv4()}`;
  try {
    // 1. Create user in Firebase Auth
    user = await adminAuth.createUser({
      email: input.email,
      password: input.password,
      emailVerified: true, // For demo purposes, we can assume verified
    });

    // 2. Add user to 'staff' collection with 'Client' role
    await db.collection('staff').doc(user.email!).set({
      name: `Test User ${user.uid.slice(0,5)}`,
      email: user.email,
      role: 'Client',
      eventLimit: 1, // Test users can only have one event
    });
    
    // 3. Create a test event for this user
    const now = new Date();
    const endDate = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now

    // Use the public URL for the default cover image
    const coverFileUrl = 'https://storage.googleapis.com/snapmoment-6xfqd.firebasestorage.app/assets/default-cover.webp';

    const eventResult = await createEvent({
        id: eventId,
        name: "My Test Event",
        description: "This is a temporary event to try out the features of wegwerpcamera.nl. It will be automatically deleted after 24 hours.",
        owner: user.email!,
        startDate: now.toISOString(),
        endDate: endDate.toISOString(),
        isTest: true,
        paid: true, // Test events are "paid" to unlock features
        photosPublished: false,
        unlimitedPhotos: true, // Give test users unlimited uploads
        coverImage: coverFileUrl,
        storagePathId: eventId,
    });
    
    if (!eventResult.success || !eventResult.newEvent) {
        throw new Error(eventResult.error || "Failed to create the event in the database.");
    }
    
    // Update the event with the correct cover image URL
    await db.collection('events').doc(eventId).update({
        coverImage: coverFileUrl,
        coverImageUrl: coverFileUrl
    });


    return { success: true, userId: user.uid, eventId: eventResult.newEvent.id };

  } catch (error: any) {
    // Cleanup on failure
    if (user) {
      await adminAuth.deleteUser(user.uid);
    }
    // Delete event from DB if it was created
    const eventDoc = db.collection('events').doc(eventId);
    if ((await eventDoc.get()).exists) {
        await eventDoc.delete();
    }
    
    let errorMessage = "An unknown error occurred.";
    if (error.code === 'auth/email-already-exists') {
        errorMessage = "This email address is already in use. Please try a different one or log in.";
    } else if (error.message) {
        errorMessage = error.message;
    }
    
    console.error("Test account creation failed:", errorMessage);
    return { success: false, error: errorMessage };
  }
}

// Define the Genkit flow, but do not export it
export const createTestAccountFlow = ai.defineFlow(
  {
    name: 'createTestAccountFlow',
    inputSchema: CreateTestAccountInputSchema,
    outputSchema: CreateTestAccountOutputSchema,
  },
  async (input) => {
    return await createTestAccountLogic(input);
  }
);
