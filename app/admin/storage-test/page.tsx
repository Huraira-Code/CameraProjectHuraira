
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, CheckCircle, XCircle, HardDrive } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { performStorageTest } from "./actions";


export default function StorageTestPage() {
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<{ success: boolean; message: string; } | null>(null);

  const handleTestClick = async () => {
    setLoading(true);
    setResult(null);
    const testResult = await performStorageTest();
    setResult(testResult);
    setLoading(false);
  };

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="grid flex-1 items-start gap-4">
        <div className="flex items-center">
          <h1 className="text-lg font-semibold md:text-2xl">
            Firebase Storage Test
          </h1>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Storage Write Permission Test</CardTitle>
            <CardDescription>
              Click the button below to perform a live test. This will attempt to write a temporary file to your Firebase Storage bucket and then make it public.
              This verifies that the server's service account has the correct IAM permissions ('Storage Object Admin' role).
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center gap-4">
            <Button
              onClick={handleTestClick}
              disabled={loading}
              size="lg"
              className="w-full max-w-xs"
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <HardDrive className="mr-2 h-4 w-4" />
              )}
              {loading ? "Running Test..." : "Run Write Test"}
            </Button>

            {result && (
              <Alert variant={result.success ? "default" : "destructive"} className="mt-4 w-full">
                {result.success ? (
                   <CheckCircle className="h-4 w-4" />
                ) : (
                   <XCircle className="h-4 w-4" />
                )}
                <AlertTitle>
                  {result.success ? "Test Succeeded" : "Test Failed"}
                </AlertTitle>
                <AlertDescription className="break-words whitespace-pre-wrap">
                    {result.message}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
