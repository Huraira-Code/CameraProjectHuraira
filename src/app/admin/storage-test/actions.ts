
'use server';

import { bucket } from '@/lib/firebase/admin';

export async function performStorageTest(): Promise<{ success: boolean; message: string; }> {
    try {
        if (!bucket || !bucket.name) {
            throw new Error("Firebase Admin SDK's Storage object is not initialized. Check server logs for initialization errors.");
        }

        const fileName = `storage-test-${Date.now()}.txt`;
        const file = bucket.file(fileName);

        // Gebruik een minimale, niet-hervatbare upload om de basisconnectiviteit te testen.
        await file.save("This is a test file to verify write permissions.", {
            contentType: "text/plain",
            resumable: false, 
        });

        await file.makePublic();
        const publicUrl = file.publicUrl();

        console.log(`Success! File created at: ${publicUrl}`);
        // Optioneel: Ruim het testbestand op na een korte vertraging
        setTimeout(() => file.delete().catch(console.error), 30000);

        return { success: true, message: `Testbestand '${fileName}' succesvol aangemaakt en openbaar gemaakt in bucket '${bucket.name}'. URL: ${publicUrl}` };

    } catch (error: any) {
        console.error("Storage test failed:", error);

        let errorMessage = error.message || "An unknown error occurred.";
        
        // Dit is het serviceaccount dat wordt gebruikt door Firebase App Hosting SSR.
        const serviceAccountEmail = "firebase-app-hosting-compute@snapmoment-6xfqd.iam.gserviceaccount.com";
        
        if (error.code === 403 || (error.message && (error.message.includes('permission denied') || error.message.includes('does not have storage.objects.create access')))) {
            const requiredRole = "roles/storage.objectAdmin";
            const gcloudCommand = `gcloud projects add-iam-policy-binding snapmoment-6xfqd --member="serviceAccount:${serviceAccountEmail}" --role="${requiredRole}"`;

            errorMessage = `Permission Denied. Het serviceaccount van de server mist de juiste rechten voor Storage.

**Wat is er mis?**
Het App Hosting serviceaccount ('${serviceAccountEmail}') dat door uw server wordt gebruikt, heeft de IAM-rol '${requiredRole}' ('Storage Object Admin') niet. Deze rol is vereist om bestanden te maken, te overschrijven en te verwijderen in de bucket.

**Hoe los ik dit op?**
U moet deze rol toekennen in uw Google Cloud-project. De eenvoudigste manier is om het volgende commando uit te voeren in de Google Cloud Shell:

\`\`\`
${gcloudCommand}
\`\`\`

Nadat u het commando heeft uitgevoerd, wacht u een minuut (het kan even duren voordat de rechten zijn doorgevoerd), start u de server opnieuw op en voert u deze test nogmaals uit.`;
        } else if (error.message && error.message.includes('Could not refresh access token')) {
             const requiredRole = "roles/iam.serviceAccountTokenCreator";
             const gcloudCommand = `gcloud projects add-iam-policy-binding snapmoment-6xfqd --member="serviceAccount:${serviceAccountEmail}" --role="${requiredRole}"`;
             const enableApiCommand = `gcloud services enable iamcredentials.googleapis.com --project=snapmoment-6xfqd`;

             errorMessage = `Token Refresh Failed. Dit is een kritiek IAM-permissieprobleem, zelfs als de rollen correct lijken.

**Wat is er mis?**
De server kan geen authenticatietoken verkrijgen om met Google Cloud-services te communiceren. Hoewel u de juiste rollen heeft ingesteld, kan dit ook gebeuren als de onderliggende 'IAM Credentials API' niet is ingeschakeld voor uw project.

**Hoe los ik dit op? (2 Stappen)**

**Stap 1: Zorg ervoor dat de 'Service Account Token Creator'-rol is ingesteld.**
Voer dit commando uit in de Google Cloud Shell om er zeker van te zijn dat de rol correct is toegewezen:
\`\`\`
${gcloudCommand}
\`\`\`

**Stap 2: Schakel de IAM Credentials API in.**
Deze API is essentieel. Voer dit commando uit in de Cloud Shell om deze in te schakelen:
\`\`\`
${enableApiCommand}
\`\`\`

Nadat u **beide** commando's heeft uitgevoerd, wacht u een minuut, start u de server opnieuw op en voert u deze test nogmaals uit.`;

        } else if (error.message.includes('getaddrinfo ENOTFOUND')) {
             errorMessage = "Network Error. Could not connect to Google Cloud Storage. Ensure the server has outbound internet access and that the Storage API is enabled in your Google Cloud project.";
        } else if (error.message.includes('Bucket not found')) {
            errorMessage = `De opgegeven bucket '${bucket.name}' bestaat niet. Verifieer de bucketnaam in 'src/lib/firebase/admin.ts'.`;
        }

        return { success: false, message: `Failed to write to bucket. Reason: ${errorMessage}` };
    }
}

    