
'use server';

import { getFirebaseAdmin } from "@/lib/firebase/admin";
import { UserRecord } from "firebase-admin/auth";

type PartnerRole = "Company" | "Affiliate";

type BrandingSettings = {
    companyName: string;
    logoUrl: string;
    primaryColor: string;
    textColor: string;
    backgroundColor: string;
    menuBackgroundColor: string;
};

type Partner = {
  id: string;
  name: string;
  email: string;
  role: PartnerRole;
  activeEvents: number;
  subscription: string;
  branding: BrandingSettings;
};

interface CreatePartnerInput {
    name: string;
    email: string;
    password?: string;
    role: PartnerRole;
}

export async function createPartner(input: CreatePartnerInput): Promise<{ success: boolean; partner?: Partner, error?: string }> {
    const { adminAuth, db } = getFirebaseAdmin();
    let user: UserRecord | undefined;
    
    if (!input.password) {
        return { success: false, error: "Password is required for a new partner." };
    }

    try {
        // 1. Create user in Firebase Auth
        user = await adminAuth.createUser({
            email: input.email,
            password: input.password,
            displayName: input.name,
            emailVerified: true, 
        });

        // 2. Create partner document in Firestore
        const newPartner: Omit<Partner, 'id'> = {
            name: input.name,
            email: input.email,
            role: input.role,
            activeEvents: 0,
            subscription: "1 Event / month", // Default subscription
            branding: {
                companyName: input.name,
                logoUrl: "https://placehold.co/100x40.png",
                primaryColor: "#000000",
                textColor: "#ffffff",
                backgroundColor: "#f9fafb", // Default light grey for main content
                menuBackgroundColor: "#ffffff", // Default white for menu
            },
        };
        
        const partnerRef = db.collection("partners").doc(input.email);
        await partnerRef.set(newPartner);

        const createdPartner: Partner = {
            ...newPartner,
            id: input.email,
        }

        return { success: true, partner: createdPartner };

    } catch (error: any) {
        // Cleanup on failure
        if (user) {
            await adminAuth.deleteUser(user.uid);
        }

        let errorMessage = "An unknown error occurred during partner creation.";
        if (error.code === 'auth/email-already-exists') {
            errorMessage = "This email address is already in use by another account.";
        } else if (error.message) {
            errorMessage = error.message;
        }
        
        console.error("Partner creation failed:", errorMessage);
        return { success: false, error: errorMessage };
    }
}
