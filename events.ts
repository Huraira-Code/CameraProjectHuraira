
'use server';

import { adminDb, bucket, adminAuth } from '@/lib/firebase/admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { Readable } from 'stream';

type BrandingSettings = {
    companyName: string;
    logoUrl: string;
    primaryColor: string;
    textColor: string;
    backgroundColor: string;
    menuBackgroundColor: string;
};

export interface Event {
    id: string;
    name: string;
    description: string;
    coverImage: string; 
    coverImageUrl?: string; 
    owner: string;
    partnerId?: string;
    partnerBranding?: BrandingSettings;
    startDate: string; // ISO String
    endDate: string | null; // ISO String
    isTest: boolean;
    paid: boolean;
    photosPublished: boolean;
    photoUploadLimit: number; // 0 for unlimited
    activeGuests: number;
    maxGuests: number; // Maximum number of guests allowed
    photosTaken: number;
    storagePathId: string;
    livestreamDelay?: number;
    showWegwerpcameraBranding: boolean;
    createdAt?: string;
}

export interface Photo {
    id: string;
    url: string;
    message?: string;
    author?: string;
    timestamp?: string;
}

// Interface for the createEvent function to include the optional client password
export interface CreateEventData extends Omit<Event, 'activeGuests' | 'photosTaken' | 'coverImageUrl' | 'partnerBranding' | 'createdAt'> {
    clientPassword?: string;
}


/**
 * Converts a Firestore timestamp to an ISO string, handling various formats.
 * @param timestamp The timestamp to convert.
 * @returns An ISO string representation of the date.
 */
const convertTimestampToISO = (timestamp: any): string => {
    if (!timestamp) return new Date().toISOString();
    if (timestamp instanceof Timestamp) {
        return timestamp.toDate().toISOString();
    }
     if (timestamp instanceof Date) {
        return timestamp.toISOString();
    }
    if (typeof timestamp === 'string') {
        const date = new Date(timestamp);
        if (!isNaN(date.getTime())) {
            return date.toISOString();
        }
    }
    // Default fallback for unexpected formats
    return new Date().toISOString();
};


/**
 * Fetches all events and enriches them with real-time participant and photo counts.
 * This function is intended for the admin dashboard.
 */
export async function getEventsForAdmin(): Promise<Event[]> {
    try {
        const eventsCollection = adminDb.collection('events');
        const snapshot = await eventsCollection.orderBy('startDate', 'desc').get();

        if (snapshot.empty) {
            console.log("No events found in the database.");
            return [];
        }

        const eventsPromises = snapshot.docs.map(async (doc) => {
            const data = doc.data();
            const event: Event = {
                id: doc.id,
                name: data.name || 'Unnamed Event',
                description: data.description || 'No description.',
                coverImage: data.coverImage || 'https://storage.googleapis.com/snapmoment-6xfqd.firebasestorage.app/events/rene/cover/cover.webp',
                coverImageUrl: data.coverImageUrl,
                owner: data.owner || 'N/A',
                partnerId: data.partnerId,
                startDate: convertTimestampToISO(data.startDate),
                endDate: data.endDate ? convertTimestampToISO(data.endDate) : null,
                isTest: data.isTest ?? false,
                paid: data.paid ?? false,
                photosPublished: data.photosPublished ?? false,
                photoUploadLimit: data.photoUploadLimit ?? 24, // Default to 24
                storagePathId: data.storagePathId || doc.id,
                createdAt: data.createdAt ? convertTimestampToISO(data.createdAt) : undefined,
                livestreamDelay: data.livestreamDelay || 5,
                showWegwerpcameraBranding: data.showWegwerpcameraBranding ?? true,
                maxGuests: data.maxGuests || 0,
                // These will be fetched below
                activeGuests: 0,
                photosTaken: 0,
            };

            // Get participant count
            try {
                const participantsSnap = await doc.ref.collection('participants').count().get();
                event.activeGuests = participantsSnap.data().count;
            } catch (error) {
                console.warn(`Could not count participants for event ${event.id}:`, error);
            }
            
            // Get photo count from storage
            try {
                // This method is more robust for counting, especially in large buckets.
                const photosRef = adminDb.collection('events').doc(event.id).collection('photos');
                const photosSnap = await photosRef.count().get();
                event.photosTaken = photosSnap.data().count;
            } catch (dbCountError) {
                 // Fallback to storage listing if collection count fails
                try {
                    const [files] = await bucket.getFiles({ prefix: `events/${event.storagePathId}/photos/` });
                    event.photosTaken = files.length;
                } catch (storageError) {
                    console.warn(`Could not count photos for event ${event.id}:`, storageError);
                }
            }


            // Fetch the public URL for the cover image if it's not already a data URL
            if (event.coverImage && !event.coverImage.startsWith('http') && !event.coverImage.startsWith('/')) {
                try {
                    const coverFile = bucket.file(`events/${event.storagePathId}/cover/${event.coverImage}`);
                    const [url] = await coverFile.getSignedUrl({ action: 'read', expires: '03-09-2491' });
                    event.coverImageUrl = url;
                } catch(urlError) {
                    // If it fails, we just fall back to the placeholder or base image name
                    event.coverImageUrl = data.coverImage;
                }
            } else if (event.coverImage.startsWith('http') || event.coverImage.startsWith('/')) {
                 event.coverImageUrl = event.coverImage;
            }


            return event;
        });

        const events = await Promise.all(eventsPromises);
        return events;

    } catch (error) {
        console.error("Error fetching events from Firestore:", error);
        // In case of a top-level error, return an empty array to prevent crashing the UI.
        return [];
    }
}


/**
 * Retrieves a single event by its ID.
 * @param eventId The ID of the event to fetch.
 * @returns An Event object or null if not found.
 */
export async function getEventById(eventId: string): Promise<Event | null> {
    try {
        const eventDoc = await adminDb.collection('events').doc(eventId).get();
        if (!eventDoc.exists) {
            return null;
        }
        const data = eventDoc.data()!;
         const event: Event = {
            id: eventDoc.id,
            name: data.name || 'Unnamed Event',
            description: data.description || 'No description.',
            coverImage: data.coverImage || 'https://storage.googleapis.com/snapmoment-6xfqd.firebasestorage.app/events/rene/cover/cover.webp',
            coverImageUrl: data.coverImageUrl || data.coverImage,
            owner: data.owner || 'N/A',
            partnerId: data.partnerId,
            startDate: convertTimestampToISO(data.startDate),
            endDate: data.endDate ? convertTimestampToISO(data.endDate) : null,
            isTest: data.isTest ?? false,
            paid: data.paid ?? false,
            photosPublished: data.photosPublished ?? false,
            photoUploadLimit: data.photoUploadLimit ?? 24, // Default to 24
            storagePathId: data.storagePathId || eventDoc.id,
            createdAt: data.createdAt ? convertTimestampToISO(data.createdAt) : undefined,
            livestreamDelay: data.livestreamDelay || 5,
            activeGuests: data.activeGuests || 0,
            maxGuests: data.maxGuests || 0,
            photosTaken: data.photosTaken || 0,
            showWegwerpcameraBranding: data.showWegwerpcameraBranding ?? true,
        };
        
        // Fetch the public URL if coverImageUrl is not already present and not local
        if (event.coverImage && event.coverImageUrl && !event.coverImageUrl.startsWith('http') && !event.coverImageUrl.startsWith('/')) {
             try {
                // The cover image filename is now stored in coverImage field
                const fileName = event.coverImage;
                const file = bucket.file(`events/${event.storagePathId}/cover/${fileName}`);
                const [url] = await file.getSignedUrl({ action: 'read', expires: '03-09-2491' });
                event.coverImageUrl = url;
            } catch (e) {
                 // fallback to original placeholder
                event.coverImageUrl = 'https://storage.googleapis.com/snapmoment-6xfqd.firebasestorage.app/events/rene/cover/cover.webp'; // Fallback to a known safe value
            }
        }
        
         // If there's a partnerId, fetch the partner's branding
        if (event.partnerId) {
            const partnerDoc = await adminDb.collection('partners').doc(event.partnerId).get();
            if (partnerDoc.exists) {
                event.partnerBranding = partnerDoc.data()?.branding as BrandingSettings;
            }
        }

        return event;
    } catch (error) {
        console.error(`Error fetching event by ID ${eventId}:`, error);
        return null;
    }
}


export async function toggleEventPaymentStatus(eventId: string, newStatus: boolean): Promise<{ success: boolean }> {
    try {
        const eventRef = adminDb.collection("events").doc(eventId);
        await eventRef.update({
            paid: newStatus
        });
        return { success: true };
    } catch (error) {
        console.error("Error toggling payment status:", error);
        return { success: false };
    }
}

export async function publishPhotosForEvent(eventId: string, currentStatus: boolean): Promise<{ success: boolean }> {
     try {
        const eventRef = adminDb.collection("events").doc(eventId);
        await eventRef.update({
            photosPublished: !currentStatus
        });
        return { success: true };
    } catch (error) {
        console.error("Error toggling photo publish status:", error);
        return { success: false };
    }
}

export async function updateEvent(eventId: string, data: Partial<Omit<Event, 'id' | 'activeGuests' | 'photosTaken'>>): Promise<{ success: boolean }> {
    try {
        const eventRef = adminDb.collection('events').doc(eventId);
        // Convert date strings back to Timestamps for Firestore
        const dataToUpdate: any = { ...data };
        if (data.startDate) {
            dataToUpdate.startDate = Timestamp.fromDate(new Date(data.startDate));
        }
        if (data.endDate) {
            dataToUpdate.endDate = Timestamp.fromDate(new Date(data.endDate));
        }
        await eventRef.update(dataToUpdate);
        return { success: true };
    } catch (error) {
        console.error("Error updating event:", error);
        return { success: false };
    }
}


export async function deleteEvent(eventId: string): Promise<{ success: boolean }> {
    const eventRef = adminDb.collection("events").doc(eventId);
    try {
        const eventDoc = await eventRef.get();
        if (!eventDoc.exists) {
            console.log(`Event with ID ${eventId} not found for deletion.`);
            return { success: true }; // Event is already gone.
        }
        const eventData = eventDoc.data()!;

        // Delete associated storage files
        if (eventData.storagePathId) {
            const prefix = `events/${eventData.storagePathId}/`;
            try {
                await bucket.deleteFiles({ prefix });
                console.log(`Successfully deleted files in Storage for event ${eventId}`);
            } catch (storageError) {
                console.error(`Failed to delete files from Storage for event ${eventId}:`, storageError);
                // Continue to delete Firestore data regardless of storage deletion success
            }
        }
        
         // Also delete photos subcollection
        const photosRef = eventRef.collection('photos');
        const photosSnap = await photosRef.get();
        if (!photosSnap.empty) {
            const batch = adminDb.batch();
            photosSnap.docs.forEach(doc => batch.delete(doc.ref));
            await batch.commit();
            console.log(`Successfully deleted photos subcollection for event ${eventId}`);
        }

        // Delete the event document
        await eventRef.delete();
        console.log(`Successfully deleted event document ${eventId} from Firestore.`);

        // If it was a test event, check if the user should be deleted
        if (eventData.isTest && eventData.owner) {
            const ownerEmail = eventData.owner;

            // Check if the owner has any other non-test events
            const otherEventsQuery = adminDb.collection('events')
                .where('owner', '==', ownerEmail)
                .where('isTest', '==', false)
                .limit(1);

            const otherEventsSnapshot = await otherEventsQuery.get();

            if (otherEventsSnapshot.empty) {
                // No other real events found, proceed with user deletion
                try {
                    const userRecord = await adminAuth.getUserByEmail(ownerEmail);
                    await adminAuth.deleteUser(userRecord.uid);
                    console.log(`Successfully deleted auth user ${ownerEmail}.`);

                    // Also delete from 'staff' collection
                    await adminDb.collection('staff').doc(ownerEmail).delete();
                    console.log(`Successfully deleted staff record for ${ownerEmail}.`);
                    
                } catch (authError: any) {
                     if (authError.code === 'auth/user-not-found') {
                        console.log(`Auth user ${ownerEmail} not found, skipping deletion.`);
                    } else {
                        console.error(`Error deleting user ${ownerEmail}:`, authError);
                    }
                }
            } else {
                 console.log(`User ${ownerEmail} has other real events, not deleting user account.`);
            }
        }

        return { success: true };
    } catch (error) {
        console.error(`Error deleting event ${eventId} and associated data:`, error);
        return { success: false };
    }
}


/**
 * Creates a new event in Firestore after performing validation and data enrichment.
 * @param data The event data from the client-side form, may include a password for a new client.
 * @returns An object indicating success, the new event, or an error.
 */
export async function createEvent(data: CreateEventData): Promise<{ success: boolean, newEvent?: Event, error?: string }> {
    try {
        const { clientPassword, ...eventData } = data;

        // --- 1. Authorization & Limit Check (for partner creating an event) ---
        if (data.partnerId) {
            const partnerRef = adminDb.collection('partners').doc(data.partnerId);
            const partnerSnap = await partnerRef.get();
            if (!partnerSnap.exists) {
                return { success: false, error: "Invalid Partner ID. This action is not authorized." };
            }
            const partnerData = partnerSnap.data()!;
            // You could add event limit checks for partners here if needed
        }
        
        // --- 2. Create Client Auth User if password is provided ---
        let clientExists = true;
        try {
            await adminAuth.getUserByEmail(data.owner);
        } catch (error: any) {
            if (error.code === 'auth/user-not-found') {
                clientExists = false;
            } else {
                throw error; // Re-throw other auth errors
            }
        }

        if (!clientExists) {
             if (!clientPassword) {
                return { success: false, error: "The client does not exist, and no password was provided to create them." };
             }
             await adminAuth.createUser({
                 email: data.owner,
                 password: clientPassword,
                 displayName: "New Client", // A default name
             });
             console.log(`Created new auth user for ${data.owner}`);
        }


        // --- 3. Create or Verify Client DB Record ---
        const clientRef = adminDb.collection('staff').doc(data.owner);
        const clientSnap = await clientRef.get();

        if (!clientSnap.exists) {
            await clientRef.set({
                email: data.owner,
                name: "New Client",
                role: "Client",
                eventLimit: 1, // Default limit for new clients
            });
            console.log(`Created new staff/client record for ${data.owner}`);
        }

        // --- 4. Data Enrichment & Database Write ---
        const newEventRef = adminDb.collection('events').doc(eventData.id);
        
        const newEventData = {
            ...eventData,
            startDate: Timestamp.fromDate(new Date(eventData.startDate)),
            endDate: eventData.endDate ? Timestamp.fromDate(new Date(eventData.endDate)) : null,
            createdAt: FieldValue.serverTimestamp(),
            coverImage: eventData.coverImage || 'https://storage.googleapis.com/snapmoment-6xfqd.firebasestorage.app/events/rene/cover/cover.webp',
            photoUploadLimit: eventData.photoUploadLimit ?? 24,
            maxGuests: eventData.maxGuests || 25, // Default to 25 guests for client-created events
            showWegwerpcameraBranding: eventData.showWegwerpcameraBranding ?? true,
        };

        await newEventRef.set(newEventData);
        
        const newEventSnapshot = await newEventRef.get();
        const newEvent = await getEventById(newEventSnapshot.id);

        if (!newEvent) {
             return { success: false, error: "Failed to retrieve the newly created event." };
        }

        return { success: true, newEvent: newEvent! };

    } catch (error: any) {
        console.error("Error creating event:", error);
        let errorMessage = error.message || "An unknown server error occurred.";
        
        if (error.code === 'auth/email-already-exists') {
            errorMessage = "A user with this client email already exists. The event was not created. Please use a different email or manage the existing client.";
        }

        const serviceAccountEmail = "firebase-app-hosting-compute@snapmoment-6xfqd.iam.gserviceaccount.com";

        if (error.message && error.message.includes('Could not refresh access token')) {
             const requiredRole = "roles/iam.serviceAccountTokenCreator";
             const gcloudCommand = `gcloud projects add-iam-policy-binding snapmoment-6xfqd --member="serviceAccount:${serviceAccountEmail}" --role="${requiredRole}"`;
             const enableApiCommand = `gcloud services enable iamcredentials.googleapis.com --project=snapmoment-6xfqd`;

             errorMessage = `Token Refresh Failed. This is a critical IAM permission issue.

**What is wrong?**
The server cannot get an authentication token to talk to Google Cloud services. This can happen if the underlying 'IAM Credentials API' is not enabled for your project.

**How to fix this? (2 Steps)**

**Step 1: Ensure the 'Service Account Token Creator' role is set.**
Run this command in the Google Cloud Shell to make sure the role is assigned correctly:
\`\`\`
${gcloudCommand}
\`\`\`

**Step 2: Enable the IAM Credentials API.**
This API is essential. Run this command in the Cloud Shell to enable it:
\`\`\`
${enableApiCommand}
\`\`\`

After running **both** commands, wait a minute, restart the server, and try again.`;
        }


        return { success: false, error: errorMessage };
    }
}


/**
 * Uploads a photo to Firebase Storage for a specific event.
 * @param eventId The ID of the event.
 * @param photoDataUrl The photo encoded as a Base64 data URL.
 * @param message An optional message to store with the photo.
 * @param guestId A unique identifier for the guest uploading the photo.
 * @returns An object indicating success and the public URL of the uploaded photo.
 */
export async function uploadPhoto(
  eventId: string,
  photoDataUrl: string,
  message?: string,
  guestId?: string,
  authorName?: string,
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const eventRef = adminDb.collection('events').doc(eventId);
    const eventDoc = await eventRef.get();
    if (!eventDoc.exists) {
      return { success: false, error: "Event not found." };
    }
    const event = eventDoc.data() as Event;

    if (!guestId) {
      return { success: false, error: "Guest identifier is missing." };
    }

    // --- Guest & Upload Limit Checks ---
    const participantsRef = eventRef.collection('participants');
    const guestDocRef = participantsRef.doc(guestId);
    const guestDoc = await guestDocRef.get();
    
    // Check max guest limit
    if (event.maxGuests > 0) {
        const participantsSnap = await participantsRef.count().get();
        const guestCount = participantsSnap.data().count;
        if (guestCount >= event.maxGuests && !guestDoc.exists) {
             return { success: false, error: "Helaas, het feestje is vol! Het lijkt erop dat alle plekken bezet zijn. Probeer de fotograaf om te kopen met een drankje voor een exclusief plekje!" };
        }
    }

    // Check photo upload limit per guest
    // A limit of 0 means unlimited
    if (event.photoUploadLimit > 0) {
        const photosFromGuestQuery = eventRef.collection('photos').where('guestId', '==', guestId);
        const guestUploadsSnap = await photosFromGuestQuery.count().get();
        const guestUploadsCount = guestUploadsSnap.data().count;

        if (guestUploadsCount >= event.photoUploadLimit) {
            return { success: false, error: `You have reached the upload limit of ${event.photoUploadLimit} photos for this event.` };
        }
    }


    // Extract image data and format
    const matches = photoDataUrl.match(/^data:(image\/(\w+));base64,(.+)$/);
    if (!matches || matches.length !== 4) {
      return { success: false, error: "Invalid photo data format." };
    }
    const mimeType = matches[1];
    const base64Data = matches[3];
    const buffer = Buffer.from(base64Data, "base64");
    
    const photoDocRef = eventRef.collection('photos').doc(); // Create a new doc with a generated ID
    const fileName = `${photoDocRef.id}.${matches[2]}`;
    const filePath = `events/${event.storagePathId}/photos/${fileName}`;
    const file = bucket.file(filePath);
    
    // Create a writable stream and upload the buffer
    await file.save(buffer, {
        metadata: { contentType: mimeType },
        resumable: false,
    });

    // Make the file public to get a URL
    await file.makePublic();
    const publicUrl = file.publicUrl();

    // Add photo metadata to Firestore subcollection
     await photoDocRef.set({
        storagePath: filePath,
        url: publicUrl,
        guestId: guestId,
        author: authorName || 'Anonymous', // Save the author's name
        createdAt: FieldValue.serverTimestamp(),
        message: message || null
    });


    // Add guest if they are new
    if (!guestDoc.exists) {
        await guestDocRef.set({ 
          joinedAt: FieldValue.serverTimestamp(),
          name: authorName || 'Anonymous' 
        });
    }

    return { success: true, url: publicUrl };
  } catch (error: any) {
    console.error(`Error uploading photo for event ${eventId}:`, error);

    let errorMessage = error.message || "An unknown error occurred during upload.";
    const serviceAccountEmail = "firebase-app-hosting-compute@snapmoment-6xfqd.iam.gserviceaccount.com";

    if (error.code === 403 || (error.message && (error.message.includes('permission denied') || error.message.includes('does not have storage.objects.create access')))) {
        const requiredRole = "roles/storage.objectAdmin";
        const gcloudCommand = `gcloud projects add-iam-policy-binding snapmoment-6xfqd --member="serviceAccount:${serviceAccountEmail}" --role="${requiredRole}"`;

        errorMessage = `Permission Denied. The server's service account is missing the required role for Storage.

**What is wrong?**
The App Hosting service account ('${serviceAccountEmail}') that your server uses does not have the IAM role '${requiredRole}' ('Storage Object Admin'). This role is required to create, overwrite, and delete files in the bucket.

**How to fix this?**
You need to grant this role in your Google Cloud project. The easiest way is to run the following command in the Google Cloud Shell:

\`\`\`
${gcloudCommand}
\`\`\`

After running the command, wait a minute for permissions to propagate, restart the server, and try the upload again.`;
    } else if (error.message && error.message.includes('Could not refresh access token')) {
         const requiredRole = "roles/iam.serviceAccountTokenCreator";
         const gcloudCommand = `gcloud projects add-iam-policy-binding snapmoment-6xfqd --member="serviceAccount:${serviceAccountEmail}" --role="${requiredRole}"`;
         const enableApiCommand = `gcloud services enable iamcredentials.googleapis.com --project=snapmoment-6xfqd`;

         errorMessage = `Token Refresh Failed. This is a critical IAM permission issue.

**What is wrong?**
The server cannot get an authentication token to talk to Google Cloud services. This can happen if the underlying 'IAM Credentials API' is not enabled for your project or if the service account lacks the 'Service Account Token Creator' role.

**How to fix this? (2 Steps)**

**Step 1: Ensure the 'Service Account Token Creator' role is set.**
Run this command in the Google Cloud Shell to make sure the role is assigned correctly:
\`\`\`
${gcloudCommand}
\`\`\`

**Step 2: Enable the IAM Credentials API.**
This API is essential. Run this command in the Cloud Shell to enable it:
\`\`\`
${enableApiCommand}
\`\`\`

After running **both** commands, wait a minute, restart the server, and try again.`;
    } else if (error.message && (error.message.toLowerCase().includes('bucket does not exist') || error.message.toLowerCase().includes('bucket not found'))) {
        errorMessage = `Configuration Error: The specified bucket ('${bucket.name}') does not seem to exist or is not accessible. Please verify the bucket name in 'src/lib/firebase/admin.ts' and ensure the project configuration is correct.`
    }

    return { success: false, error: errorMessage };
  }
}

/**
 * Updates the cover image for a specific event.
 * @param eventId The ID of the event.
 * @param photoDataUrl The new cover image encoded as a Base64 data URL.
 * @returns An object indicating success and the public URL of the uploaded photo.
 */
export async function updateEventCoverImage(
  eventId: string,
  photoDataUrl: string
): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
        const event = await getEventById(eventId);
        if (!event) {
            return { success: false, error: "Event not found." };
        }

        const matches = photoDataUrl.match(/^data:(image\/(\w+));base64,(.+)$/);
        if (!matches || matches.length !== 4) {
            return { success: false, error: "Invalid photo data format." };
        }
        const mimeType = matches[1];
        const fileExtension = matches[2];
        const base64Data = matches[3];
        const buffer = Buffer.from(base64Data, "base64");

        const fileName = `cover.${fileExtension}`;
        const filePath = `events/${event.storagePathId}/cover/${fileName}`;
        const file = bucket.file(filePath);

        // Upload the buffer
        await file.save(buffer, {
            metadata: { contentType: mimeType },
            resumable: false,
        });

        // Make the file public and get the URL
        await file.makePublic();
        const publicUrl = file.publicUrl();

        // Update the event document in Firestore
        await adminDb.collection('events').doc(eventId).update({
            coverImage: fileName, // Store only the filename now
            coverImageUrl: publicUrl
        });

        return { success: true, url: publicUrl };

    } catch (error: any) {
        console.error(`Error updating cover image for event ${eventId}:`, error);
        return { success: false, error: error.message || "Could not update cover image." };
    }
}


/**
 * Fetches photos for a given event. Can fetch all photos or only new ones since a given timestamp.
 * @param eventId The ID of the event.
 * @param lastCheckedTimestamp Optional ISO string. If provided, only photos newer than this timestamp are fetched.
 * @returns A promise that resolves to an array of Photo objects.
 */
export async function getPhotosForEvent(eventId: string, lastCheckedTimestamp?: string | null): Promise<Photo[]> {
    try {
        const event = await getEventById(eventId);
        if (!event) {
            console.warn(`Event ${eventId} not found or has no storage path.`);
            return [];
        }

        const photosRef = adminDb.collection('events').doc(eventId).collection('photos');
        let query = photosRef.orderBy('createdAt', 'desc');

        if (lastCheckedTimestamp) {
            query = query.where('createdAt', '>', Timestamp.fromDate(new Date(lastCheckedTimestamp)));
        }

        const snapshot = await query.get();

        if (snapshot.empty) {
            return [];
        }

        const photos = snapshot.docs.map(doc => {
             const data = doc.data();
             return {
                id: doc.id,
                url: data.url,
                message: data.message || '',
                author: data.author || (data.guestId ? `Guest...${data.guestId.slice(-4)}` : 'Anonymous'),
                timestamp: convertTimestampToISO(data.createdAt),
             };
        });

        return photos;
    } catch (error) {
        console.error(`Error fetching photos for event ${eventId}:`, error);
        return [];
    }
}



/**
 * Deletes a single photo from Firestore and Firebase Storage.
 * @param eventId The ID of the event the photo belongs to.
 * @param photoId The ID of the photo document in the subcollection.
 * @returns An object indicating success or an error.
 */
export async function deletePhoto(eventId: string, photoId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const eventRef = adminDb.collection('events').doc(eventId);
    const photoRef = eventRef.collection('photos').doc(photoId);

    const photoDoc = await photoRef.get();
    if (!photoDoc.exists) {
      console.warn(`Photo document ${photoId} not found in event ${eventId}.`);
      return { success: true }; // Consider it a success if it's already gone
    }

    const photoData = photoDoc.data();
    const filePath = photoData?.storagePath;

    // Delete from Firestore first
    await photoRef.delete();

    // Then delete from Storage if a path exists
    if (filePath) {
      const file = bucket.file(filePath);
      const [exists] = await file.exists();
      if (exists) {
        await file.delete();
      } else {
        console.warn(`File ${filePath} not found in Storage, but was deleted from Firestore.`);
      }
    }
    
    return { success: true };
  } catch (error: any) {
    console.error(`Failed to delete photo ${photoId} from event ${eventId}:`, error);
    return { success: false, error: 'Could not delete the photo.' };
  }
}

/**
 * Scans a Firebase Storage path for an event and creates missing Firestore documents for photos.
 * @param eventId The ID of the event to resynchronize.
 * @returns An object with counts of processed, linked, and failed photos.
 */
export async function resyncPhotosForEvent(eventId: string): Promise<{
  success: boolean;
  message: string;
  processed?: number;
  linked?: number;
  failed?: number;
}> {
  try {
    const event = await getEventById(eventId);
    if (!event || !event.storagePathId) {
      return { success: false, message: `Event with ID '${eventId}' not found.` };
    }

    const photosPath = `events/${event.storagePathId}/photos/`;
    const [files] = await bucket.getFiles({ prefix: photosPath });

    if (files.length === 0) {
      return { success: true, message: "No photos found in Storage for this event. Nothing to do." };
    }

    const photosRef = adminDb.collection('events').doc(eventId).collection('photos');
    let linkedCount = 0;
    let failedCount = 0;

    for (const file of files) {
      const fileName = file.name.split('/').pop();
      if (!fileName) continue; // Skip directories or invalid names

      const photoId = fileName.split('.')[0];
      const photoDocRef = photosRef.doc(photoId);
      const photoDoc = await photoDocRef.get();

      if (photoDoc.exists) {
        continue; // Document already exists, skip.
      }

      try {
        await file.makePublic(); // Ensure it's public
        const publicUrl = file.publicUrl();

        await photoDocRef.set({
          storagePath: file.name,
          url: publicUrl,
          guestId: 'resynced', // Mark as resynced
          createdAt: FieldValue.serverTimestamp(),
          message: 'Resynced from storage',
        });
        linkedCount++;
      } catch (e) {
        console.error(`Failed to link photo ${file.name}:`, e);
        failedCount++;
      }
    }

    const message = `Resync complete for event '${event.name}'. Processed: ${files.length} files. Newly linked: ${linkedCount}. Failed: ${failedCount}.`;
    return { success: true, message, processed: files.length, linked: linkedCount, failed: failedCount };
  } catch (error: any) {
    console.error(`Error resyncing photos for event ${eventId}:`, error);
    return { success: false, message: error.message || 'An unknown error occurred during resync.' };
  }
}

/**
 * Activates a free event for up to 5 guests.
 * @param eventId The ID of the event to activate.
 * @param guestCount The number of guests, must be <= 5.
 * @returns An object indicating success or an error.
 */
export async function activateFreeEvent(eventId: string, guestCount: number): Promise<{ success: boolean; error?: string }> {
    if (guestCount > 5) {
        return { success: false, error: "Free tier is only available for 5 guests or fewer." };
    }
    try {
        const eventRef = adminDb.collection("events").doc(eventId);
        await eventRef.update({
            paid: true,
            isTest: false,
            maxGuests: guestCount,
        });
        return { success: true };
    } catch (error: any) {
        console.error("Error activating free event:", error);
        return { success: false, error: error.message || "Could not activate the event." };
    }
}


/**
 * Retrieves the photo upload limit for an event and the current upload count for a specific guest.
 * @param eventId The ID of the event.
 * @param guestId The unique ID of the guest.
 * @returns An object with the upload limit and the guest's current upload count.
 */
export async function getGuestUploadInfo(eventId: string, guestId: string): Promise<{
    uploadLimit: number;
    uploadCount: number;
    error?: string;
}> {
    try {
        const eventRef = adminDb.collection('events').doc(eventId);
        const eventDoc = await eventRef.get();
        if (!eventDoc.exists) {
            return { uploadLimit: 0, uploadCount: 0, error: "Event not found." };
        }
        const event = eventDoc.data() as Event;

        const photosFromGuestQuery = eventRef.collection('photos').where('guestId', '==', guestId);
        const guestUploadsSnap = await photosFromGuestQuery.count().get();
        const uploadCount = guestUploadsSnap.data().count;

        return {
            uploadLimit: event.photoUploadLimit,
            uploadCount: uploadCount
        };

    } catch (error: any) {
        console.error(`Error fetching guest upload info for event ${eventId}:`, error);
        return { uploadLimit: 0, uploadCount: 0, error: error.message };
    }
}
