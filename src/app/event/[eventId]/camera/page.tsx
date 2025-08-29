
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Camera, RefreshCcw, Loader2, UploadCloud, CheckCircle, AlertCircle, ArrowLeft, Zap, ZapOff, Film, Upload } from "lucide-react";
import Image from "next/image";
import { uploadPhoto, getGuestUploadInfo } from "@/lib/events";
import Link from "next/link";
import { useParams } from "next/navigation";
import { v4 as uuidv4 } from 'uuid';
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useLocale } from "@/lib/locale";
import { Badge } from "@/components/ui/badge";


const getGuestId = (): string => {
  if (typeof window === 'undefined') return '';
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

export default function CameraPage() {
  const params = useParams();
  const { t } = useLocale();
  const eventId = params.eventId as string;
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const trackRef = React.useRef<MediaStreamTrack | null>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const [hasCameraPermission, setHasCameraPermission] = React.useState<boolean | null>(null);
  const [takenPhoto, setTakenPhoto] = React.useState<string | null>(null);
  const [photoMessage, setPhotoMessage] = React.useState("");
  const [isUploading, setIsUploading] = React.useState(false);
  const [uploadStatus, setUploadStatus] = React.useState<{ success: boolean; message: string } | null>(null);
  const [hasFlash, setHasFlash] = React.useState(false);
  const [isFlashOn, setIsFlashOn] = React.useState(false);
  const [uploadLimit, setUploadLimit] = React.useState(0);
  const [uploadCount, setUploadCount] = React.useState(0);
  const [isLoadingInfo, setIsLoadingInfo] = React.useState(true);


  const fetchUploadInfo = React.useCallback(async () => {
        const guestId = getGuestId();
        if (!eventId || !guestId) return;
        setIsLoadingInfo(true);
        const info = await getGuestUploadInfo(eventId, guestId);
        if (!info.error) {
            setUploadLimit(info.uploadLimit);
            setUploadCount(info.uploadCount);
        }
        setIsLoadingInfo(false);
    }, [eventId]);

  const startCamera = React.useCallback(async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                facingMode: "environment",
                width: { ideal: 1920 },
                height: { ideal: 1080 }
            } 
        });
        setHasCameraPermission(true);

        const videoTrack = stream.getVideoTracks()[0];
        trackRef.current = videoTrack;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        if (typeof videoTrack.getCapabilities === 'function') {
             const capabilities = videoTrack.getCapabilities();
             if (capabilities.torch) {
                setHasFlash(true);
            }
        }
      } catch (error) {
        console.error("Error accessing camera:", error);
        setHasCameraPermission(false);
      }
  }, []);

  React.useEffect(() => {
    startCamera();
    fetchUploadInfo();
    
    return () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
        }
    }
  }, [startCamera, fetchUploadInfo]);

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");

      if (context) {
        const videoWidth = video.videoWidth;
        const videoHeight = video.videoHeight;
        canvas.width = videoWidth;
        canvas.height = videoHeight;
        
        context.drawImage(video, 0, 0, videoWidth, videoHeight);
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
    const guestName = getGuestName();
    try {
        const result = await uploadPhoto(eventId, takenPhoto, photoMessage, guestId, guestName || 'Anonymous');
        if (result.success) {
            setUploadStatus({ success: true, message: t('camera_upload_success_message') });
            setUploadCount(prev => prev + 1); // Optimistic update of the count
        } else {
            throw new Error(result.error || t('camera_upload_generic_error'));
        }
    } catch (error: any) {
        console.error(error);
        setUploadStatus({ success: false, message: error.message || t('camera_upload_generic_error') });
    } finally {
        setIsUploading(false);
        // Automatically close dialog after successful upload
        setTimeout(() => {
            resetPhoto();
        }, 2000);
    }
  };

  const resetPhoto = () => {
    setTakenPhoto(null);
    setPhotoMessage("");
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
  
  const remainingUploads = uploadLimit > 0 ? uploadLimit - uploadCount : Infinity;
  const canUpload = remainingUploads > 0;


  const PhotoCounter = () => {
    if (isLoadingInfo) return <div className="h-6 w-16 bg-white/20 rounded-full animate-pulse" />;
    if (uploadLimit === 0) {
        return <Badge variant="secondary" className="bg-white/20 text-white border-none text-lg">∞</Badge>;
    }
    return <Badge variant="secondary" className="bg-white/20 text-white border-none text-lg">{remainingUploads}/{uploadLimit}</Badge>;
  }


  return (
    <div className="bg-black min-h-screen text-white flex flex-col p-4 overflow-hidden">
      <header className="flex items-center justify-between z-20 flex-shrink-0">
        <Button asChild variant="ghost" size="icon">
          <Link href={`/event/welcome?eventId=${eventId}`}>
            <ArrowLeft />
            <span className="sr-only">{t('camera_back_to_welcome')}</span>
          </Link>
        </Button>
        <h1 className="text-xl font-bold">{t('camera_title')}</h1>
        {hasFlash ? (
          <Button onClick={toggleFlash} variant="ghost" size="icon">
            {isFlashOn ? <Zap /> : <ZapOff />}
            <span className="sr-only">{t('camera_toggle_flash')}</span>
          </Button>
        ) : <div className="w-10"></div>}
      </header>

      {/* Main Container */}
      <main className="flex-grow flex flex-col landscape:flex-row items-center justify-center overflow-hidden gap-4 py-2">
        
        {/* Camera View */}
        <div className="w-full landscape:w-7/12 h-full flex flex-col items-center justify-center">
          <div className="w-full h-full flex items-center justify-center">
            {hasCameraPermission === null && <Loader2 className="h-16 w-16 animate-spin" />}
            {hasCameraPermission === false && (
            <div className="flex flex-col items-center justify-center h-full p-4">
                <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>{t('camera_access_denied_title')}</AlertTitle>
                <AlertDescription>
                    {t('camera_access_denied_desc')}
                </AlertDescription>
                </Alert>
            </div>
            )}
            <div className={cn("relative w-full max-w-full max-h-[70vh] landscape:max-h-full aspect-[9/16] landscape:aspect-video rounded-lg overflow-hidden")}>
              <video
                  ref={videoRef}
                  className={cn(
                      "w-full h-full object-cover transition-opacity duration-300",
                      hasCameraPermission ? "opacity-100" : "opacity-0 hidden"
                  )}
                  autoPlay
                  playsInline
                  muted
              />
              <canvas ref={canvasRef} className="hidden"></canvas>
            </div>
          </div>
        </div>
        
        {/* Side Controls - only in landscape */}
        <aside className="hidden landscape:flex flex-col flex-shrink-0 items-center justify-center gap-4 w-auto">
             <Button asChild variant="outline" className="rounded-full h-12 w-12 p-0 bg-white/10 border-white/20 text-white hover:bg-white/20">
                <Link href={`/event/${eventId}/upload`}>
                    <Upload className="h-5 w-5" />
                    <span className="sr-only">{t('camera_upload_from_device')}</span>
                </Link>
            </Button>
            <div className="flex flex-col items-center gap-2">
                 {!canUpload && !isLoadingInfo ? (
                    <div className="p-2 bg-red-900/50 border border-red-500/50 rounded-lg text-center">
                        <p className="text-xs font-bold">Rolletje vol!</p>
                    </div>
                ) : (
                    <Button
                        onClick={takePhoto}
                        disabled={!hasCameraPermission || !canUpload}
                        className="w-16 h-16 rounded-full bg-white text-black hover:bg-gray-200 border-4 border-black ring-4 ring-white disabled:bg-gray-400 disabled:cursor-not-allowed"
                        aria-label={t('camera_take_photo_label')}
                        >
                        <Camera className="h-8 w-8" />
                    </Button>
                )}
                 <PhotoCounter />
            </div>
             <Button asChild variant="outline" className="rounded-full h-12 w-12 p-0 bg-white/10 border-white/20 text-white hover:bg-white/20">
                <Link href={`/event/${eventId}/review`}>
                    <Film className="h-5 w-5" />
                    <span className="sr-only">{t('camera_view_and_upload')}</span>
                </Link>
            </Button>
        </aside>
      </main>

      {/* Footer / Bottom Controls - only in portrait */}
       <footer className="w-full flex-shrink-0 py-2 landscape:hidden">
          <div className="w-full max-w-md mx-auto">
              {!canUpload && !isLoadingInfo ? (
                <div className="my-4">
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Je fotorolletje is vol!</AlertTitle>
                        <AlertDescription>
                            Je hebt de uploadlimiet voor dit evenement bereikt.
                        </AlertDescription>
                    </Alert>
                </div>
              ) : null}
            <div className="flex items-center justify-around">
                <Button asChild variant="outline" className="rounded-full h-14 w-14 p-0 bg-white/10 border-white/20 text-white hover:bg-white/20">
                <Link href={`/event/${eventId}/upload`}>
                    <Upload className="h-6 w-6" />
                    <span className="sr-only">{t('camera_upload_from_device')}</span>
                </Link>
                </Button>
                <div className="flex flex-col items-center gap-2">
                    <Button
                    onClick={takePhoto}
                    disabled={!hasCameraPermission || !canUpload}
                    className="w-20 h-20 rounded-full bg-white text-black hover:bg-gray-200 border-4 border-black ring-4 ring-white disabled:bg-gray-400 disabled:cursor-not-allowed"
                    aria-label={t('camera_take_photo_label')}
                    >
                    <Camera className="h-10 w-10" />
                    </Button>
                    <PhotoCounter />
                </div>
                <Button asChild variant="outline" className="rounded-full h-14 w-14 p-0 bg-white/10 border-white/20 text-white hover:bg-white/20">
                <Link href={`/event/${eventId}/review`}>
                    <Film className="h-6 w-6" />
                    <span className="sr-only">{t('camera_view_and_upload')}</span>
                </Link>
                </Button>
            </div>
          </div>
        </footer>

      {/* Confirmation Dialog */}
      <Dialog open={!!takenPhoto} onOpenChange={(open) => !open && resetPhoto()}>
        <DialogContent onOpenAutoFocus={(e) => e.preventDefault()} className="max-w-md w-full">
            <DialogHeader>
                <DialogTitle>{t('camera_confirm_dialog_title')}</DialogTitle>
                <DialogDescription>{t('camera_confirm_dialog_desc')}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
                <div className="relative aspect-square w-full rounded-md overflow-hidden">
                    {takenPhoto && <Image src={takenPhoto} alt="Confirmation preview" layout="fill" objectFit="contain" />}
                </div>
                 <Textarea
                    ref={textareaRef}
                    placeholder={t('camera_confirm_dialog_placeholder')}
                    value={photoMessage}
                    onChange={(e) => setPhotoMessage(e.target.value)}
                    className="bg-background"
                    rows={2}
                />
            </div>
            <DialogFooter className="grid grid-cols-2 gap-4">
                 <Button onClick={resetPhoto} disabled={isUploading} variant="outline">
                    <RefreshCcw className="mr-2 h-4 w-4" />
                    {t('camera_confirm_dialog_retake_button')}
                </Button>
                <Button onClick={handleUpload} disabled={isUploading} className="bg-green-600 hover:bg-green-700">
                {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
                {t('camera_confirm_dialog_upload_button')}
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>


      <AlertDialog open={!!uploadStatus} onOpenChange={() => setUploadStatus(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex justify-center mb-4">
              {uploadStatus?.success ? <CheckCircle className="h-16 w-16 text-green-500" /> : <AlertCircle className="h-16 w-16 text-destructive" />}
            </div>
            <AlertDialogTitle className="text-center">
              {uploadStatus?.success ? t('camera_upload_success_title') : t('camera_upload_failed_title')}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              {uploadStatus?.message}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setUploadStatus(null)}>{t('camera_close_button')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
