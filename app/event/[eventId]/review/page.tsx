
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, UploadCloud, ArrowLeft, Image as ImageIcon, X, AlertCircle, CheckCircle, Trash2, Camera } from "lucide-react";
import Link from "next/link";
import { uploadPhoto } from "@/lib/events";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { Textarea } from "@/components/ui/textarea";
import { v4 as uuidv4 } from 'uuid';

interface StoredPhoto {
  id: string;
  dataUrl: string;
  message?: string;
}

const getGuestId = (): string => {
  if (typeof window === 'undefined') return '';
  let guestId = localStorage.getItem('guestId');
  if (!guestId) {
    guestId = uuidv4();
    localStorage.setItem('guestId', guestId);
  }
  return guestId;
};

const getLocalFilmRoll = (eventId: string): StoredPhoto[] => {
    if (typeof window === 'undefined') return [];
    const key = `filmRoll_${eventId}`;
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : [];
}

const saveLocalFilmRoll = (eventId: string, roll: StoredPhoto[]) => {
     if (typeof window === 'undefined') return;
     localStorage.setItem(`filmRoll_${eventId}`, JSON.stringify(roll));
}

const clearLocalFilmRoll = (eventId: string) => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(`filmRoll_${eventId}`);
}

export default function ReviewPage() {
    const params = useParams();
    const router = useRouter();
    const eventId = params.eventId as string;

    const [filmRoll, setFilmRoll] = React.useState<StoredPhoto[]>([]);
    const [isUploading, setIsUploading] = React.useState(false);
    const [uploadProgress, setUploadProgress] = React.useState(0);
    const [uploadResult, setUploadResult] = React.useState<{ success: boolean; message: string } | null>(null);

    React.useEffect(() => {
        if (eventId) {
            setFilmRoll(getLocalFilmRoll(eventId));
        }
    }, [eventId]);

    const handleRemovePhoto = (photoId: string) => {
        const newRoll = filmRoll.filter(p => p.id !== photoId);
        setFilmRoll(newRoll);
        saveLocalFilmRoll(eventId, newRoll);
    }
    
    const handleMessageChange = (photoId: string, message: string) => {
        const newRoll = filmRoll.map(p => p.id === photoId ? {...p, message} : p);
        setFilmRoll(newRoll);
        saveLocalFilmRoll(eventId, newRoll);
    }

    const handleUpload = async () => {
        if (filmRoll.length === 0) return;

        setIsUploading(true);
        setUploadProgress(0);
        setUploadResult(null);

        let successfulUploads = 0;
        let failedUploads = 0;
        let finalMessage = "";

        const guestId = getGuestId();

        for (let i = 0; i < filmRoll.length; i++) {
            const photo = filmRoll[i];
            try {
                const result = await uploadPhoto(eventId, photo.dataUrl, photo.message, guestId);
                if (result.success) {
                    successfulUploads++;
                } else {
                    finalMessage = result.error || 'An unknown error occurred.';
                    failedUploads = filmRoll.length - i;
                    break; 
                }
            } catch (error: any) {
                console.error(`Failed to upload photo ${photo.id}:`, error);
                finalMessage = error.message;
                failedUploads = filmRoll.length - i;
                break;
            }
            setUploadProgress(((i + 1) / filmRoll.length) * 100);
        }
        
        setIsUploading(false);
        
        if (failedUploads === 0) {
            clearLocalFilmRoll(eventId);
            setUploadResult({
                success: true,
                message: `${successfulUploads} photo(s) uploaded successfully! You can close this page.`
            });
             setTimeout(() => {
                setFilmRoll([]);
             }, 3000);
        } else {
            setUploadResult({
                success: false,
                message: `Upload failed: ${finalMessage}. Please try again.`
            });
        }
    };


  return (
    <div className="flex flex-col min-h-screen bg-muted/40">
        <header className="p-4 flex items-center bg-background border-b sticky top-0 z-10">
             <Button asChild variant="outline" size="icon">
                <Link href={`/event/${eventId}/camera`}>
                     <ArrowLeft />
                     <span className="sr-only">Back to Camera</span>
                </Link>
            </Button>
            <div className="flex-1 ml-4">
                 <h1 className="text-xl font-bold">Review Your Photos</h1>
                 <p className="text-sm text-muted-foreground">{filmRoll.length} photo(s) ready to upload.</p>
            </div>
            <Button onClick={handleUpload} disabled={isUploading || filmRoll.length === 0}>
                {isUploading ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                    <UploadCloud className="mr-2 h-5 w-5" />
                )}
                {isUploading ? `Uploading... (${Math.round(uploadProgress)}%)` : `Upload All`}
            </Button>
        </header>

        <main className="flex-grow p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                {uploadResult && (
                    <Alert variant={uploadResult.success ? "default" : "destructive"} className="mb-8">
                         {uploadResult.success ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                        <AlertTitle>{uploadResult.success ? "Upload Complete" : "Upload Failed"}</AlertTitle>
                        <AlertDescription>{uploadResult.message}</AlertDescription>
                    </Alert>
                )}
                
                {filmRoll.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {filmRoll.map((photo) => (
                            <div key={photo.id} className="relative group border rounded-lg p-3 space-y-3 bg-card shadow-sm">
                                <div className="relative">
                                     <Image src={photo.dataUrl} alt={`Review photo ${photo.id}`} width={300} height={300} className="w-full h-auto aspect-square object-cover rounded-md"/>
                                    <Button
                                        variant="destructive"
                                        size="icon"
                                        className="absolute -top-2 -right-2 h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={() => handleRemovePhoto(photo.id)}
                                        aria-label="Delete photo"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                                <Textarea 
                                    placeholder="Add a message... (optional)"
                                    value={photo.message || ""}
                                    onChange={(e) => handleMessageChange(photo.id, e.target.value)}
                                    rows={2}
                                />
                            </div>
                        ))}
                    </div>
                ) : (
                    !isUploading && (
                         <div className="text-center py-16 border border-dashed rounded-lg">
                            <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                            <h2 className="mt-4 text-xl font-semibold text-muted-foreground">No Photos to Review</h2>
                            <p className="text-muted-foreground mt-2">Photos you take with the event camera will appear here.</p>
                            <Button asChild className="mt-4">
                                <Link href={`/event/${eventId}/camera`}>
                                    <Camera className="mr-2 h-4 w-4" />
                                    Open Camera
                                </Link>
                            </Button>
                         </div>
                    )
                )}
            </div>
        </main>
    </div>
  );
}

