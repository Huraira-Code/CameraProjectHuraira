
"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader2 } from "lucide-react";
import { WegwerpcameraLogo } from "@/components/snapmoment-logo";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { createTestAccount, type CreateTestAccountInput } from "@/ai/flows/createTestAccount";

export default function TestLoginPage() {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const router = useRouter();

  const handleCreateTestAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const input: CreateTestAccountInput = { email, password };
      const result = await createTestAccount(input);

      if (!result.success) {
        throw new Error(result.error || "Failed to create test account.");
      }

      // Automatically log the user in after successful creation
      await signInWithEmailAndPassword(auth, email, password);
      
      console.log("Test account created and logged in successfully!");
      router.push("/client/dashboard");

    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/20">
      <Button asChild variant="ghost" className="absolute top-4 left-4">
        <Link href="/">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Link>
      </Button>
      <div className="w-full max-w-md p-4">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <WegwerpcameraLogo />
          </Link>
        </div>
        <form onSubmit={handleCreateTestAccount}>
          <Card>
            <CardHeader>
              <CardTitle>Try a Free 24-Hour Demo</CardTitle>
              <CardDescription>
                Create a temporary account to explore the features. No credit card required.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  placeholder="Create a password (min. 6 characters)"
                />
              </div>

              {error && (
                 <Alert variant="destructive">
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Demo Event
              </Button>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
}
