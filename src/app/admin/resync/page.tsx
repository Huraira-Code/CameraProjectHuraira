
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, RefreshCw, CheckCircle, XCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { resyncPhotosForEvent } from "@/lib/events";

export default function ResyncPage() {
  const [eventId, setEventId] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<{
    success: boolean;
    message: string;
    processed?: number;
    linked?: number;
    failed?: number;
  } | null>(null);

  const handleResync = async () => {
    if (!eventId) {
      setResult({ success: false, message: "Please enter an Event ID." });
      return;
    }
    setLoading(true);
    setResult(null);
    const resyncResult = await resyncPhotosForEvent(eventId);
    setResult(resyncResult);
    setLoading(false);
  };

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="grid flex-1 items-start gap-4">
        <div className="flex items-center">
          <h1 className="text-lg font-semibold md:text-2xl">
            Resynchronize Event Photos
          </h1>
        </div>
        <Card className="w-full max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Repair Photo Links</CardTitle>
            <CardDescription>
              This tool scans the Firebase Storage folder for an event and creates any missing database records for photos.
              Use this if photos are visible in Storage but not in the gallery.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="eventId">Event ID</Label>
              <Input
                id="eventId"
                value={eventId}
                onChange={(e) => setEventId(e.target.value)}
                placeholder="Enter the ID of the event to resync"
                disabled={loading}
              />
            </div>
            {result && (
              <Alert variant={result.success ? "default" : "destructive"} className="mt-4">
                {result.success ? (
                   <CheckCircle className="h-4 w-4" />
                ) : (
                   <XCircle className="h-4 w-4" />
                )}
                <AlertTitle>
                  {result.success ? "Resync Complete" : "Resync Failed"}
                </AlertTitle>
                <AlertDescription className="break-words whitespace-pre-wrap">
                    {result.message}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter>
            <Button onClick={handleResync} disabled={loading}>
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              {loading ? "Resyncing..." : "Start Resync"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </main>
  );
}
