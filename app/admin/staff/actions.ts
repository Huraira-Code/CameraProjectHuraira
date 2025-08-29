
'use server';

import { getFirebaseAdmin } from "@/lib/firebase/admin";
import { deleteEvent } from "@/lib/events";

export async function deleteUserAndData(email: string): Promise<{ success: boolean; error?: string }> {
    const { adminAuth, db } = getFirebaseAdmin();

    try {
        // 1. Get user from Auth to get UID
        const userRecord = await adminAuth.getUserByEmail(email);
        const uid = userRecord.uid;

        // 2. Find and delete all events owned by this user
        const eventsQuery = db.collection('events').where('owner', '==', email);
        const eventsSnapshot = await eventsQuery.get();

        if (!eventsSnapshot.empty) {
            console.log(`Found ${eventsSnapshot.size} event(s) to delete for user ${email}...`);
            const deletePromises = eventsSnapshot.docs.map(doc => deleteEvent(doc.id));
            await Promise.all(deletePromises);
            console.log(`All events for user ${email} have been deleted.`);
        }

        // 3. Delete the user from Firestore staff collection
        await db.collection('staff').doc(email).delete();
        console.log(`Deleted staff document for ${email}.`);

        // 4. Delete the user from Firebase Authentication
        await adminAuth.deleteUser(uid);
        console.log(`Successfully deleted auth user ${email} (UID: ${uid}).`);

        return { success: true };

    } catch (error: any) {
        console.error(`Failed to delete user and all data for ${email}:`, error);
        
        if (error.code === 'auth/user-not-found') {
            // If user doesn't exist in Auth, maybe they are just in the staff collection.
            // Try deleting from staff collection anyway.
            try {
                 await db.collection('staff').doc(email).delete();
                 console.log(`Deleted orphan staff record for ${email}.`);
                 return { success: true };
            } catch (dbError) {
                console.error(`Failed to delete orphan staff record for ${email}:`, dbError);
                return { success: false, error: "User not found in Auth, and failed to delete from database." };
            }
        }
        
        return { success: false, error: error.message || 'An unknown error occurred.' };
    }
}
