
"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Download, Image as ImageIcon, Loader2, Maximize, MessageSquare, Trash2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getEventById, getPhotosForEvent, Event, Photo, deletePhoto } from "@/lib/events";
import { useParams } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function GalleryPage() {
  const params = useParams();
  const eventId = params.eventId as string;

  const [event, setEvent] = React.useState<Event | null>(null);
  const [photos, setPhotos] = React.useState<Photo[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedPhoto, setSelectedPhoto] = React.useState<Photo | null>(null);

  React.useEffect(() => {
    if (!eventId) return;

    const fetchEventData = async () => {
      setLoading(true);
      try {
        const [eventData, photosData] = await Promise.all([
          getEventById(eventId),
          getPhotosForEvent(eventId),
        ]);

        if (eventData) {
          setEvent(eventData);
        } else {
          console.error("Event not found");
        }
        setPhotos(photosData);
      } catch (error) {
        console.error("Failed to fetch event data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEventData();
  }, [eventId]);

  const handleDeletePhoto = async (photoId: string) => {
    // Optimistic UI update
    const originalPhotos = photos;
    setPhotos(photos.filter(p => p.id !== photoId));
    setSelectedPhoto(null); // Close modal on delete

    const result = await deletePhoto(eventId, photoId);

    if (!result.success) {
      // Revert on failure
      setPhotos(originalPhotos);
      console.error(result.error || "Failed to delete photo.");
    } else {
      console.log("Photo deleted successfully.");
    }
  };

  return (
    <div className="bg-background min-h-screen">
      <div className="container mx-auto p-4 md:p-8">
        <header className="flex items-start justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0 grid place-content-center bg-primary/10 text-primary w-12 h-12 rounded-lg">
              <ImageIcon className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                {event?.name || <Loader2 className="animate-spin" />}
              </h1>
              <p className="text-muted-foreground">Photo Gallery</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link href="/client/dashboard">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Link>
            </Button>
            <Button asChild>
              <Link href={`/event/${eventId}/download`}>
                <Download className="mr-2 h-4 w-4" />
                Download All ({photos.length})
              </Link>
            </Button>
          </div>
        </header>

        <main>
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : photos.length === 0 ? (
             <div className="text-center py-16 border border-dashed rounded-lg">
                <h2 className="text-xl font-semibold text-muted-foreground">No Photos Yet</h2>
                <p className="text-muted-foreground mt-2">Check back soon or be the first to upload a photo!</p>
             </div>
          ) : (
            <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
              {photos.map((photo) => (
                <button 
                  key={photo.id} 
                  className="break-inside-avoid relative group w-full block"
                  onClick={() => setSelectedPhoto(photo)}
                >
                   <Image
                      src={photo.url}
                      alt={photo.message || "Event photo"}
                      width={500}
                      height={500}
                      className="w-full h-auto rounded-lg object-cover shadow-md"
                      unoptimized // Since URLs can be from anywhere
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg flex items-center justify-center text-white">
                        <Maximize className="h-10 w-10" />
                    </div>
                </button>
              ))}
            </div>
          )}
        </main>
      </div>

      <Dialog open={!!selectedPhoto} onOpenChange={(open) => !open && setSelectedPhoto(null)}>
        <DialogContent className="max-w-4xl p-0">
          {selectedPhoto && (
            <div className="grid grid-cols-1 md:grid-cols-2">
              <div className="relative aspect-square md:aspect-auto">
                 <Image
                    src={selectedPhoto.url}
                    alt={selectedPhoto.message || 'Selected event photo'}
                    layout="fill"
                    objectFit="contain"
                    className="rounded-t-lg md:rounded-l-lg md:rounded-t-none"
                    unoptimized
                 />
              </div>
              <div className="p-6 flex flex-col">
                  <DialogHeader>
                    <DialogTitle>Photo Details</DialogTitle>
                  </DialogHeader>
                  <div className="flex-grow my-4">
                    {selectedPhoto.message ? (
                       <>
                        <h3 className="font-semibold mb-2 flex items-center gap-2"><MessageSquare className="h-4 w-4"/> Message</h3>
                        <blockquote className="border-l-2 pl-4 italic text-muted-foreground">
                            {selectedPhoto.message}
                        </blockquote>
                       </>
                    ) : (
                        <p className="text-muted-foreground">No message was left with this photo.</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-4">Uploaded by: {selectedPhoto.author}</p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 mt-auto">
                    <a href={selectedPhoto.url} download target="_blank" rel="noopener noreferrer" className="w-full">
                       <Button className="w-full">
                            <Download className="mr-2 h-4 w-4" /> Download
                       </Button>
                    </a>
                     <AlertDialog>
                      <AlertDialogTrigger asChild>
                         <Button variant="destructive" className="w-full">
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                         </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the photo from the gallery and storage.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeletePhoto(selectedPhoto.id)}
                            className="bg-destructive hover:bg-destructive/90"
                          >
                            Yes, delete photo
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
