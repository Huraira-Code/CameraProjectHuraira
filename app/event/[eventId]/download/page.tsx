
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Loader2, Image as ImageIcon } from "lucide-react";
import type { ZipPhotosInput, ZipPhotosOutput } from "@/ai/flows/zip-photos";
import { getEventById, getPhotosForEvent, Event, Photo } from "@/lib/events";
import { useParams } from "next/navigation";


export default function DownloadPage() {
  const params = useParams();
  const eventId = params.eventId as string;

  const [loading, setLoading] = React.useState(false);
  const [event, setEvent] = React.useState<Event | null>(null);
  const [photos, setPhotos] = React.useState<Photo[]>([]);

  React.useEffect(() => {
    if (!eventId) return;

    const fetchEventData = async () => {
        setLoading(true);
        try {
            const [eventData, photosData] = await Promise.all([
                getEventById(eventId),
                getPhotosForEvent(eventId),
            ]);

            setEvent(eventData);
            setPhotos(photosData);
        } catch (error) {
            console.error("Failed to fetch event data:", error);
        } finally {
            setLoading(false);
        }
    };

    fetchEventData();
  }, [eventId]);


  const handleDownload = async () => {
    setLoading(true);
    console.log("Preparing your download... This may take a moment for large galleries.");

    try {
        const photoUrls = photos.map(p => p.url);
        const input: ZipPhotosInput = { photoUrls };

        const response = await fetch('/api/flows/zipPhotos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(input)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API call failed: ${response.statusText} - ${errorText}`);
        }

        const result: ZipPhotosOutput = await response.json();

        if (result.zipAsBase64) {
            // Create a link and trigger the download
            const link = document.createElement('a');
            link.href = `data:application/zip;base64,${result.zipAsBase64}`;
            link.download = `${event?.name.replace(/\s+/g, '_') || 'event'}-photos.zip`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            console.log("Download Started! Your photos are being downloaded.");
        } else {
             throw new Error("Flow did not return zip data.");
        }

    } catch (error) {
        console.error("Failed to zip and download photos:", error);
        console.error("An error occurred while preparing your photos. Please try again.");
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/40">
        <Card className="w-full max-w-md">
            <CardHeader>
                <CardTitle>Download All Photos</CardTitle>
                <CardDescription>
                    {loading && !event ? "Loading event details..." : `Download all photos from ${event?.name || 'this event'} as a single ZIP file.`}
                </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
                <div className="flex items-center justify-center gap-4 text-2xl font-bold p-8">
                    <ImageIcon className="h-8 w-8" />
                    <span>{photos.length} Photos</span>
                </div>
                 <Button onClick={handleDownload} disabled={loading || photos.length === 0} size="lg" className="w-full">
                    {loading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Download className="mr-2 h-4 w-4" />
                    )}
                    {loading ? "Zipping Photos..." : "Download All"}
                </Button>
            </CardContent>
        </Card>
    </div>
  );
}
