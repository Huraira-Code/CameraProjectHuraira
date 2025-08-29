
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, UploadCloud, ArrowLeft, Image as ImageIcon, X, AlertCircle, CheckCircle } from "lucide-react";
import Link from "next/link";
import { uploadPhoto } from "@/lib/events";
import Image from "next/image";
import { useParams } from "next/navigation";
import { Textarea } from "@/components/ui/textarea";
import { v4 as uuidv4 } from 'uuid';

interface FileWithPreview extends File {
    preview: string;
    message: string;
}

// Helper function to get or create a guest ID
const getGuestId = (): string => {
  let guestId = localStorage.getItem('guestId');
  if (!guestId) {
    guestId = uuidv4();
    localStorage.setItem('guestId', guestId);
  }
  return guestId;
};

const getGuestName = (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('guestName');
}

export default function UploadPage() {
    const params = useParams();
    const eventId = params.eventId as string;
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const [selectedFiles, setSelectedFiles] = React.useState<FileWithPreview[]>([]);
    const [isUploading, setIsUploading] = React.useState(false);
    const [uploadProgress, setUploadProgress] = React.useState(0);
    const [uploadResult, setUploadResult] = React.useState<{ success: boolean; message: string } | null>(null);

    React.useEffect(() => {
        // Cleanup previews on unmount
        return () => {
            selectedFiles.forEach(file => URL.revokeObjectURL(file.preview));
        };
    }, [selectedFiles]);

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            const files = Array.from(event.target.files);
            const newFilesWithPreview: FileWithPreview[] = files.map(file => Object.assign(file, {
                preview: URL.createObjectURL(file),
                message: "",
            }));
            setSelectedFiles(newFilesWithPreview);
            setUploadResult(null);
        }
    };
    
    const handleRemoveFile = (index: number) => {
        const newFiles = [...selectedFiles];
        URL.revokeObjectURL(newFiles[index].preview); // Clean up memory
        newFiles.splice(index, 1);
        setSelectedFiles(newFiles);
    }
    
    const handleMessageChange = (index: number, message: string) => {
        const newFiles = [...selectedFiles];
        newFiles[index].message = message;
        setSelectedFiles(newFiles);
    }

    const toDataURL = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    const handleUpload = async () => {
        if (selectedFiles.length === 0) return;

        setIsUploading(true);
        setUploadProgress(0);
        setUploadResult(null);

        let successfulUploads = 0;
        let failedUploads = 0;
        let finalMessage = "";

        const guestId = getGuestId();
        const guestName = getGuestName();

        for (let i = 0; i < selectedFiles.length; i++) {
            const file = selectedFiles[i];
            try {
                const dataUrl = await toDataURL(file);
                // Pass message and guestId to uploadPhoto function
                const result = await uploadPhoto(eventId, dataUrl, file.message, guestId, guestName || 'Anonymous');
                if (result.success) {
                    successfulUploads++;
                } else {
                    // Stop on first error to show the message
                    finalMessage = result.error || 'An unknown error occurred.';
                    failedUploads = selectedFiles.length - i;
                    break; 
                }
            } catch (error: any) {
                console.error(`Failed to upload ${file.name}:`, error);
                finalMessage = error.message;
                failedUploads = selectedFiles.length - i;
                break;
            }
            setUploadProgress(((i + 1) / selectedFiles.length) * 100);
        }
        
        setIsUploading(false);
        // Only clear files if all uploads were successful
        if (failedUploads === 0) {
            setSelectedFiles([]);
        }
        
        setUploadResult({
            success: failedUploads === 0,
            message: finalMessage || `${successfulUploads} photo(s) uploaded successfully.`
        });

    };


  return (
    <div className="flex flex-col min-h-screen bg-muted/40">
        <header className="p-4 flex items-center bg-background border-b">
             <Button asChild variant="outline" size="icon">
                <Link href={`/event/welcome?eventId=${eventId}`}>
                     <ArrowLeft />
                     <span className="sr-only">Back to Welcome</span>
                </Link>
            </Button>
            <h1 className="text-xl font-bold ml-4">Upload Photos</h1>
        </header>

        <main className="flex-grow p-4 md:p-8">
            <div className="max-w-4xl mx-auto">
                <div
                    className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-primary hover:bg-primary/10 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                >
                    <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
                    <h2 className="mt-4 text-xl font-semibold">Click to select photos</h2>
                    <p className="mt-1 text-sm text-muted-foreground">You can upload multiple images at once.</p>
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileSelect}
                    />
                </div>
                
                {selectedFiles.length > 0 && (
                    <div className="mt-8">
                        <h3 className="text-lg font-semibold mb-4">Selected Photos ({selectedFiles.length}):</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                            {selectedFiles.map((file, index) => (
                                <div key={file.preview} className="relative group border rounded-lg p-3 space-y-2">
                                    <div className="relative">
                                         <Image src={file.preview} alt={`Preview ${index}`} width={200} height={200} className="w-full h-auto aspect-square object-cover rounded-md"/>
                                        <Button
                                            variant="destructive"
                                            size="icon"
                                            className="absolute -top-2 -right-2 h-7 w-7 rounded-full"
                                            onClick={() => handleRemoveFile(index)}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <Textarea 
                                        placeholder="Add a message... (optional)"
                                        value={file.message}
                                        onChange={(e) => handleMessageChange(index, e.target.value)}
                                        rows={2}
                                    />
                                </div>
                            ))}
                        </div>
                        <div className="mt-8 text-center">
                            <Button onClick={handleUpload} disabled={isUploading || selectedFiles.length === 0} size="lg">
                                {isUploading ? (
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                ) : (
                                    <ImageIcon className="mr-2 h-5 w-5" />
                                )}
                                {isUploading ? `Uploading... (${Math.round(uploadProgress)}%)` : `Upload ${selectedFiles.length} Photo(s)`}
                            </Button>
                        </div>
                    </div>
                )}
                
                {uploadResult && (
                    <Alert variant={uploadResult.success ? "default" : "destructive"} className="mt-8">
                         {uploadResult.success ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                        <AlertTitle>{uploadResult.success ? "Upload Complete" : "Upload Finished with Errors"}</AlertTitle>
                        <AlertDescription>{uploadResult.message}</AlertDescription>
                    </Alert>
                )}

            </div>
        </main>
    </div>
  );
}
