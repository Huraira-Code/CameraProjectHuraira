
'use server';

import { getFirebaseAdmin } from "@/lib/firebase/admin";
import { UserRecord } from "firebase-admin/auth";

interface CreateClientInput {
    name: string;
    email: string;
    password?: string;
    eventLimit: number;
}

type Client = {
  id: string; // The document ID, which is the email
  name: string;
  email: string;
  role: "Client";
  eventLimit: number;
};


export async function createClient(input: CreateClientInput): Promise<{ success: boolean; client?: Client, error?: string }> {
    const { adminAuth, db } = getFirebaseAdmin();
    let user: UserRecord | undefined;
    
    if (!input.password) {
        return { success: false, error: "Password is required to create a new client." };
    }

    try {
        // 1. Create user in Firebase Auth
        user = await adminAuth.createUser({
            email: input.email,
            password: input.password,
            displayName: input.name,
            emailVerified: true, // We can assume verified for admin-created accounts
        });

        // 2. Add user to 'staff' collection with 'Client' role
        const clientData: Omit<Client, 'id'> = {
            name: input.name,
            email: input.email,
            role: 'Client',
            eventLimit: input.eventLimit,
        };
        await db.collection('staff').doc(user.email!).set(clientData);
        
        const newClient: Client = {
            ...clientData,
            id: user.email!,
        }
        
        return { success: true, client: newClient };

    } catch (error: any) {
        // Cleanup on failure
        if (user) {
            await adminAuth.deleteUser(user.uid);
        }
        
        let errorMessage = "An unknown error occurred.";
        if (error.code === 'auth/email-already-exists') {
            errorMessage = "This email address is already in use by another account.";
        } else if (error.message) {
            errorMessage = error.message;
        }
        
        console.error("Client creation failed:", errorMessage);
        return { success: false, error: errorMessage };
    }
}
