
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import JSZip from 'jszip';

const ZipPhotosInputSchema = z.object({
  photoUrls: z.array(z.string().url()).describe('An array of public URLs for the photos to be zipped.'),
});
export type ZipPhotosInput = z.infer<typeof ZipPhotosInputSchema>;

const ZipPhotosOutputSchema = z.object({
  zipAsBase64: z.string().describe('The generated ZIP file encoded as a Base64 string.'),
});
export type ZipPhotosOutput = z.infer<typeof ZipPhotosOutputSchema>;

async function fetchPhoto(url: string): Promise<ArrayBuffer> {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to fetch photo from ${url}: ${response.statusText}`);
    }
    return response.arrayBuffer();
}

const zipPhotosFlow = ai.defineFlow(
  {
    name: 'zipPhotosFlow',
    inputSchema: ZipPhotosInputSchema,
    outputSchema: ZipPhotosOutputSchema,
  },
  async ({ photoUrls }) => {
    const zip = new JSZip();
    
    // Fetch all photos in parallel
    const photoPromises = photoUrls.map(async (url, index) => {
        try {
            const photoData = await fetchPhoto(url);
            // Get filename from URL
            const urlParts = url.split('?')[0].split('/');
            const fileName = urlParts.pop() || `photo_${index + 1}.jpg`;
            zip.file(fileName, photoData);
        } catch (error) {
            console.error(`Skipping photo due to error: ${error}`);
            // Optionally, you could log this to a results array to inform the user
        }
    });

    await Promise.all(photoPromises);

    const zipAsBase64 = await zip.generateAsync({ type: 'base64' });

    return {
      zipAsBase64,
    };
  }
);


export async function zipPhotos(input: ZipPhotosInput): Promise<ZipPhotosOutput> {
  return zipPhotosFlow(input);
}
