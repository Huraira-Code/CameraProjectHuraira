
"use client";

import * as React from "react";
import Image from "next/image";
import Link from 'next/link';
import { AnimatePresence, motion } from "framer-motion";
import { useInterval } from "@/hooks/use-interval";
import { Skeleton } from "@/components/ui/skeleton";
import QRCode from 'qrcode';
import { Camera } from "lucide-react";
import { getEventById, getPhotosForEvent, Event, Photo } from "@/lib/events";
import { useParams } from "next/navigation";
import { formatDistanceToNow } from 'date-fns';

export default function SlideshowPage() {
  const params = useParams();
  const eventId = params.eventId as string;

  const [eventDetails, setEventDetails] = React.useState<Event | null>(null);
  const [photos, setPhotos] = React.useState<Photo[]>([]);
  const [currentPhotoIndex, setCurrentPhotoIndex] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [qrCodeUrl, setQrCodeUrl] = React.useState('');
  const lastCheckedTimestamp = React.useRef<string | null>(null);


  const fetchInitialData = React.useCallback(async () => {
    try {
        const [event, initialPhotos] = await Promise.all([
             getEventById(eventId),
             getPhotosForEvent(eventId)
        ]);

        if (event) {
            setEventDetails(event);
        } else {
            console.error("Event not found");
        }
        
        setPhotos(initialPhotos);
        if (initialPhotos.length > 0) {
            lastCheckedTimestamp.current = initialPhotos[0].timestamp!;
        }

    } catch (e) {
      console.error("Failed to fetch initial data", e);
    }
  }, [eventId]);
  
  const fetchNewPhotos = React.useCallback(async () => {
    if (!lastCheckedTimestamp.current) return;

    try {
      const newPhotos = await getPhotosForEvent(eventId, lastCheckedTimestamp.current);
      if (newPhotos.length > 0) {
        // Add new photos to the start of the array without duplicates
        setPhotos(prevPhotos => {
            const existingPhotoIds = new Set(prevPhotos.map(p => p.id));
            const uniqueNewPhotos = newPhotos.filter(p => !existingPhotoIds.has(p.id));
            return [...uniqueNewPhotos, ...prevPhotos];
        });
        lastCheckedTimestamp.current = newPhotos[0].timestamp!;
      }
    } catch (e) {
      console.error("Failed to fetch new photos", e);
    }
  }, [eventId]);


  // Fetch initial data on mount
  React.useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchInitialData();
      setLoading(false);
    };
    loadData();
  }, [fetchInitialData]);


  // Generate QR Code
  React.useEffect(() => {
    const welcomeUrl = `${window.location.origin}/event/welcome?eventId=${eventId}`;
    QRCode.toDataURL(welcomeUrl, { width: 400, margin: 2 })
      .then(url => setQrCodeUrl(url))
      .catch(err => console.error(err));
  }, [eventId]);

  // Interval to cycle through photos
  useInterval(() => {
    if (photos.length > 0) {
      setCurrentPhotoIndex((prevIndex) => (prevIndex + 1) % photos.length);
    }
  }, eventDetails?.livestreamDelay ? eventDetails.livestreamDelay * 1000 : 5000);

  // Interval to fetch new photos
  useInterval(() => {
    fetchNewPhotos();
  }, 15000); // Check for new photos every 15 seconds


  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-gray-900 text-white">
        <div className="flex flex-col items-center gap-4">
          <Camera className="h-16 w-16 animate-pulse" />
          <p className="text-xl font-semibold">Loading Slideshow...</p>
        </div>
      </div>
    );
  }

  if (!eventDetails || !eventDetails.paid) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-gray-900 text-white">
         <div className="text-center p-8 bg-black/50 rounded-lg">
            <h2 className="text-3xl font-bold mb-2">Slideshow Unavailable</h2>
            <p className="text-lg text-muted-foreground">
              {eventDetails ? "This feature is available for paid events only." : "This event could not be found."}
            </p>
        </div>
      </div>
    );
  }

  const currentPhoto = photos[currentPhotoIndex];
  
  const getNextPhotos = (currentIndex: number, count: number, allPhotos: Photo[]): Photo[] => {
      if (allPhotos.length <= 1) {
          return [];
      }
      
      const uniqueNextPhotos = new Set<Photo>();
      let i = 1;
      while (uniqueNextPhotos.size < count && i < allPhotos.length) {
          const nextIndex = (currentIndex + i) % allPhotos.length;
          const nextPhoto = allPhotos[nextIndex];
          if (nextPhoto.id !== allPhotos[currentIndex].id) {
               uniqueNextPhotos.add(nextPhoto);
          }
          i++;
      }
      return Array.from(uniqueNextPhotos);
  };
  
  const nextPhotos = getNextPhotos(currentPhotoIndex, 3, photos);

  const branding = eventDetails.partnerBranding;

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black" style={{ backgroundColor: branding?.backgroundColor || 'black' }}>
      {/* Background Image */}
      {eventDetails.coverImageUrl && (
         <Image
            src={eventDetails.coverImageUrl}
            alt="Event background"
            layout="fill"
            objectFit="cover"
            className="absolute inset-0 z-0 scale-110 filter blur-2xl brightness-50"
            data-ai-hint="wedding couple"
          />
      )}

      {/* Powered by Branding */}
      {eventDetails.showWegwerpcameraBranding && (
        <div className="absolute bottom-4 left-4 z-20">
          <a href="https://www.wegwerpcamera.nl" target="_blank" rel="noopener noreferrer" className="text-xs text-white/50 hover:text-white/80 transition-colors">
            Powered by wegwerpcamera.nl
          </a>
        </div>
      )}


      <div className="relative z-10 grid h-full grid-cols-12 gap-6">
        {/* Left Sidebar */}
        <div className="col-span-3 h-full flex flex-col justify-center items-center p-8 bg-black/30 backdrop-blur-md text-white">
          <div className="flex flex-col items-center text-center gap-6">
            {branding?.logoUrl ? (
                <Image src={branding.logoUrl} alt={branding.companyName || 'Partner Logo'} width={150} height={75} className="object-contain" />
            ) : (
                <h1 className="text-4xl font-headline font-bold">{eventDetails.name}</h1>
            )}
             
            {qrCodeUrl ? (
                <Image src={qrCodeUrl} alt="QR Code" width={256} height={256} className="rounded-lg border-4 border-white" />
            ) : (
                <Skeleton className="h-64 w-64" />
            )}

            <div className="flex flex-col gap-2">
                 <p className="text-2xl font-semibold">Scan to join the fun!</p>
                 <p className="text-lg text-white/80">No app needed!</p>
            </div>
          </div>
        </div>

        {/* Right Photo Display */}
        <div className="col-span-9 h-full flex flex-col justify-center items-center p-8">
            {photos.length === 0 ? (
                 <div className="text-center text-white p-8 bg-black/50 rounded-lg">
                    <h2 className="text-4xl font-bold mb-4">Waiting for the first masterpiece!</h2>
                    <p className="text-xl text-muted-foreground">Scan the QR code to upload your photos.</p>
                </div>
            ) : (
                <div className="w-full h-full flex flex-col justify-center items-center gap-4">
                    {/* Main Photo Viewer */}
                    <div className="relative w-full aspect-video rounded-lg overflow-hidden shadow-2xl">
                         <AnimatePresence>
                             <motion.div
                                key={currentPhoto.id}
                                initial={{ x: 300, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                exit={{ x: -300, opacity: 0 }}
                                transition={{ duration: 0.8, ease: "easeInOut" }}
                                className="absolute inset-0"
                                >
                                <Image
                                    src={currentPhoto.url}
                                    alt={`Photo by ${currentPhoto.author}`}
                                    layout="fill"
                                    objectFit="contain"
                                />
                                 <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 text-white">
                                    {currentPhoto.message && (
                                        <p className="text-lg font-semibold drop-shadow-md">"{currentPhoto.message}"</p>
                                    )}
                                    <p className="text-sm text-white/80 drop-shadow-md">
                                        by {currentPhoto.author} - {currentPhoto.timestamp ? formatDistanceToNow(new Date(currentPhoto.timestamp), { addSuffix: true }) : ''}
                                    </p>
                                 </div>
                                </motion.div>
                         </AnimatePresence>
                    </div>

                    {/* Filmstrip */}
                    <div className="h-24 flex justify-center items-center gap-4">
                         {nextPhotos.map((photo, index) => (
                            <div key={photo.id} className={`relative w-32 aspect-video rounded-md overflow-hidden border-2 transition-all duration-500 ${index === 0 ? 'opacity-100' : 'opacity-40'}`} style={{ borderColor: branding?.primaryColor || 'white' }}>
                                <Image
                                src={photo.url}
                                alt="Upcoming photo"
                                layout="fill"
                                objectFit="cover"
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}
