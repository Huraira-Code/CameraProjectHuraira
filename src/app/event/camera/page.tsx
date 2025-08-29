
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Camera, RefreshCcw, Loader2, UploadCloud, X, CheckCircle, AlertCircle, ArrowLeft, Zap, ZapOff, Film, Upload } from "lucide-react";
import Image from "next/image";
import { getEventById, Event, uploadPhoto } from "@/lib/events";
import Link from "next/link";
import { useParams } from "next/navigation";
import { v4 as uuidv4 } from 'uuid';

// --- Client-side Storage Helpers ---

const getGuestId = (): string => {
  if (typeof window === 'undefined') return '';
  let guestId = localStorage.getItem('guestId');
  if (!guestId) {
    guestId = uuidv4();
    localStorage.setItem('guestId', guestId);
  }
  return guestId;
};

interface StoredPhoto {
  id: string;
  dataUrl: string;
}

const savePhotoToLocalFilmRoll = (eventId: string, photo: StoredPhoto) => {
    if (typeof window === 'undefined') return;
    const key = `filmRoll_${eventId}`;
    let roll: StoredPhoto[] = [];
    try {
      const stored = localStorage.getItem(key);
      if(stored) roll = JSON.parse(stored);
    } catch(e) {
        console.error("Could not parse film roll", e)
    }
    roll.push(photo);
    localStorage.setItem(key, JSON.stringify(roll));
}


export default function CameraPage() {
  const params = useParams();
  const eventId = params.eventId as string;
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const trackRef = React.useRef<MediaStreamTrack | null>(null);

  const [hasCameraPermission, setHasCameraPermission] = React.useState<boolean | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [takenPhoto, setTakenPhoto] = React.useState<string | null>(null);

  const [isUploading, setIsUploading] = React.useState(false);
  const [uploadStatus, setUploadStatus] = React.useState<{ success: boolean; message: string } | null>(null);
  
  const [hasFlash, setHasFlash] = React.useState(false);
  const [isFlashOn, setIsFlashOn] = React.useState(false);
  const [eventDetails, setEventDetails] = React.useState<Event | null>(null);
  const [loadingEvent, setLoadingEvent] = React.useState(true);

  const startCamera = React.useCallback(async () => {
    try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            throw new Error("Camera API not supported by this browser.");
        }
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        setHasCameraPermission(true);

        const videoTrack = stream.getVideoTracks()[0];
        trackRef.current = videoTrack;
        
        if (typeof videoTrack.getCapabilities === 'function') {
            const capabilities = videoTrack.getCapabilities();
            if (capabilities.torch) {
                setHasFlash(true);
            }
        }
        
        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          video.play().catch(e => console.error("Video play failed:", e));
        }
      } catch (error) {
        console.error("Error accessing camera:", error);
        setHasCameraPermission(false);
        setError("Camera permission was denied. Please enable it in your browser settings.");
      }
  }, []);

  React.useEffect(() => {
    if (!eventId) return;
    
    getEventById(eventId)
        .then(details => {
            if (details) {
                setEventDetails(details);
            } else {
                setError("Event not found.");
            }
        })
        .catch(() => setError("Could not load event details."))
        .finally(() => setLoadingEvent(false));

  }, [eventId]);


  React.useEffect(() => {
    startCamera();
    
    return () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
        }
    }
  }, [startCamera]);
  
  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");

      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        const photoDataUrl = canvas.toDataURL("image/jpeg", 1.0);
        
        setTakenPhoto(photoDataUrl);
      }
    }
  };

  const handleUpload = async () => {
    if (!takenPhoto) return;
    setIsUploading(true);
    setUploadStatus(null);
    const guestId = getGuestId();
    try {
        const result = await uploadPhoto(eventId, takenPhoto, "Uploaded from camera", guestId);
        if (result.success) {
            setUploadStatus({ success: true, message: "Photo uploaded successfully!" });
        } else {
            throw new Error(result.error || "Upload failed");
        }
    } catch (error: any) {
        console.error(error);
        setUploadStatus({ success: false, message: error.message || "An error occurred during upload." });
    } finally {
        setIsUploading(false);
        setTimeout(() => {
            resetPhoto();
            setUploadStatus(null);
        }, 2000);
    }
  };
  
  const resetPhoto = () => {
    setTakenPhoto(null);
    setUploadStatus(null);
  };
  
  const toggleFlash = () => {
      if (trackRef.current && hasFlash) {
          const newFlashState = !isFlashOn;
          trackRef.current.applyConstraints({
              advanced: [{ torch: newFlashState }]
          }).then(() => {
              setIsFlashOn(newFlashState);
          }).catch(e => console.error("Could not toggle flash:", e));
      }
  };
  
  return (
    <div className="relative min-h-screen bg-black text-white flex flex-col">
        <header className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-20 bg-black/30">
            <Button asChild variant="ghost" size="icon" className="text-white hover:bg-white/20 hover:text-white">
                <Link href={`/event/welcome?eventId=${eventId}`}>
                     <ArrowLeft />
                     <span className="sr-only">Back to Welcome</span>
                </Link>
            </Button>
            <h1 className="text-xl font-bold">Camera</h1>
            {hasFlash ? (
                <Button onClick={toggleFlash} variant="ghost" size="icon" className="text-white hover:bg-white/20 hover:text-white">
                    {isFlashOn ? <Zap /> : <ZapOff />}
                    <span className="sr-only">Toggle Flash</span>
                </Button>
            ) : <div className="w-10"></div>}
        </header>

      <main className="flex-grow flex flex-col items-center justify-center p-4 -mt-16">
        <div className="relative w-full max-w-lg aspect-[9/16] bg-gray-900 rounded-2xl overflow-hidden shadow-2xl">
          {hasCameraPermission === null && <Loader2 className="h-16 w-16 animate-spin absolute inset-1/2 -translate-x-1/2 -translate-y-1/2" />}

          {hasCameraPermission === false && (
            <div className="flex flex-col items-center justify-center h-full p-4">
                 <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Camera Access Denied</AlertTitle>
                    <AlertDescription>
                        {error || "Please enable camera permissions in your browser settings to use this feature."}
                    </AlertDescription>
                </Alert>
            </div>
          )}

          {hasCameraPermission && !takenPhoto && (
            <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
          )}

          {takenPhoto && (
            <Image src={takenPhoto} alt="Taken photo" layout="fill" objectFit="cover" />
          )}
          
          <canvas ref={canvasRef} className="hidden"></canvas>
        </div>
      </main>

      <footer className="p-6 bg-black/50 z-20">
         <div className="w-full max-w-lg mx-auto flex justify-center items-center gap-4">
           {!takenPhoto ? (
             <Button
                onClick={takePhoto}
                disabled={!hasCameraPermission}
                className="w-20 h-20 rounded-full bg-white text-black hover:bg-gray-200 border-4 border-black ring-4 ring-white"
                aria-label="Take Photo"
              >
                <Camera className="h-8 w-8" />
             </Button>
          ) : (
            <div className="w-full max-w-lg flex justify-around items-center">
                 <Button onClick={resetPhoto} disabled={isUploading} variant="outline" size="lg" className="rounded-full h-16 w-16 p-0">
                    <RefreshCcw className="h-7 w-7"/>
                    <span className="sr-only">Retake</span>
                </Button>
                 <Button onClick={handleUpload} disabled={isUploading} size="lg" className="rounded-full h-20 w-20 p-0 text-white bg-green-600 hover:bg-green-700">
                    {isUploading ? <Loader2 className="h-8 w-8 animate-spin"/> : <UploadCloud className="h-8 w-8"/>}
                     <span className="sr-only">Upload</span>
                 </Button>
            </div>
          )}
         </div>

         <div className="mt-6 border-t border-white/20 pt-4 flex justify-center gap-4">
            <Button asChild variant="link" className="text-white/80 hover:text-white">
                <Link href={`/event/${eventId}/upload`}>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload from Device
                </Link>
            </Button>
             <Button asChild variant="link" className="text-white/80 hover:text-white">
                <Link href={`/event/${eventId}/review`}>
                    <Film className="mr-2 h-4 w-4" />
                    View & Upload Photos
                </Link>
            </Button>
         </div>
      </footer>

      <AlertDialog open={!!uploadStatus} onOpenChange={() => setUploadStatus(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <div className="flex justify-center mb-4">
                        {uploadStatus?.success ? <CheckCircle className="h-16 w-16 text-green-500" /> : <AlertCircle className="h-16 w-16 text-destructive" />}
                    </div>
                    <AlertDialogTitle className="text-center">
                        {uploadStatus?.success ? "Upload Successful!" : "Upload Failed"}
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-center">
                        {uploadStatus?.message}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogAction onClick={() => setUploadStatus(null)}>Close</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </div>
  );
}

