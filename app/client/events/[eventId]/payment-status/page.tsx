
"use client";

import * as React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, CheckCircle, AlertCircle, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useLocale } from "@/lib/locale";
import { verifyStripeSession } from "@/lib/stripe-actions";

function PaymentStatusContent() {
  const { t } = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();

  const status = searchParams.get('status');
  const sessionId = searchParams.get('session_id');
  
  const [verificationState, setVerificationState] = React.useState<'loading' | 'success' | 'error' | 'manual'>('loading');
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (status === 'success' && sessionId) {
      const verifySession = async () => {
        const result = await verifyStripeSession(sessionId);
        if (result.success) {
          setVerificationState('success');
           setTimeout(() => {
                router.push('/client/dashboard');
            }, 3000);
        } else {
          setVerificationState('error');
          setErrorMessage(result.error || t('payment_status_verify_error'));
        }
      };
      verifySession();
    } else if (status === 'cancel') {
        setVerificationState('manual');
        setErrorMessage("De betaling is geannuleerd. U kunt het opnieuw proberen vanaf de upgrade pagina.");
    } else {
        setVerificationState('error');
        setErrorMessage(t('payment_status_missing_info_error'));
    }
  }, [status, sessionId, t, router]);

  if (verificationState === 'loading') {
    return (
       <Card className="w-full max-w-md">
          <CardHeader/>
          <CardContent className="text-center flex flex-col items-center gap-4">
              <Loader2 className="h-12 w-12 text-primary animate-spin" />
              <CardTitle>{t('payment_status_loading_title')}</CardTitle>
              <CardDescription>{t('payment_status_loading_desc')}</CardDescription>
          </CardContent>
      </Card>
    )
  }

  if (verificationState === 'success') {
     return (
       <Card className="w-full max-w-md">
          <CardHeader/>
          <CardContent className="text-center flex flex-col items-center gap-4">
              <CheckCircle className="h-12 w-12 text-green-500" />
              <CardTitle>{t('payment_status_paid_title')}</CardTitle>
              <CardDescription>{t('payment_status_paid_desc')}</CardDescription>
               <Button asChild className="mt-4">
                  <Link href="/client/dashboard">{t('payment_status_paid_button')}</Link>
              </Button>
          </CardContent>
      </Card>
     )
  }

  // Error or Canceled state
  return (
      <Card className="w-full max-w-md">
          <CardHeader/>
          <CardContent className="text-center flex flex-col items-center gap-4">
              <AlertCircle className="h-12 w-12 text-destructive" />
              <CardTitle>{status === 'cancel' ? "Betaling Geannuleerd" : t('payment_status_failed_title')}</CardTitle>
              <CardDescription>{errorMessage}</CardDescription>
              <Button asChild className="mt-4" variant="outline">
                   <Link href="/client/dashboard">{t('payment_status_open_button')}</Link>
              </Button>
          </CardContent>
      </Card>
  )
}

export default function PaymentStatusPage() {
    return (
         <div className="flex items-center justify-center min-h-screen bg-muted">
            <React.Suspense fallback={<Loader2 className="h-12 w-12 animate-spin" />}>
                <PaymentStatusContent />
            </React.Suspense>
        </div>
    )
}
