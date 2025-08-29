
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Loader2, Mail, Zap, ShoppingCart } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getEventById, type Event, activateFreeEvent, updateEvent } from "@/lib/events";
import { useLocale } from "@/lib/locale";
import { Slider } from "@/components/ui/slider";
import { createCheckoutSession } from "@/lib/stripe-actions";
import { loadStripe } from '@stripe/stripe-js';

interface PriceTier {
  id: string;
  guestCount: number;
  price: number;
}

interface PaymentSettings {
  basePrice: number;
  priceTiers: PriceTier[];
  stripePublishableKey: string;
}

export default function UpgradeEventPage() {
  const { t } = useLocale();
  const params = useParams();
  const router = useRouter();
  const eventId = params.eventId as string;

  const [event, setEvent] = React.useState<Event | null>(null);
  const [settings, setSettings] = React.useState<PaymentSettings | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [isRequesting, setIsRequesting] = React.useState(false);
  const [isActivatingFree, setIsActivatingFree] = React.useState(false);

  React.useEffect(() => {
    if (!eventId) return;

    const fetchInitialData = async () => {
      setLoading(true);
      try {
        const eventData = await getEventById(eventId);
        const settingsRef = doc(db, "settings", "payments");
        const settingsSnap = await getDoc(settingsRef);

        if (!settingsSnap.exists()) {
          throw new Error("Payment settings not configured.");
        }
        
        const paymentSettingsData = settingsSnap.data();
        const paymentSettings: PaymentSettings = {
            basePrice: paymentSettingsData.basePrice || 0,
            priceTiers: paymentSettingsData.priceTiers || [],
            stripePublishableKey: paymentSettingsData.stripePublishableKey || ''
        }
        
        const sortedTiers = paymentSettings.priceTiers?.sort((a,b) => a.guestCount - b.guestCount) || [];
        
        setEvent(eventData);
        setSettings({ ...paymentSettings, priceTiers: sortedTiers });

      } catch (error) {
        console.error("Error fetching data:", error);
        setSettings(null); // Set to null on error
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [eventId]);
  
  const handleGuestLimitChange = (value: number[]) => {
    if (!event) return;
    setEvent({ ...event, maxGuests: value[0] });
  };
  
  const { priceTier, totalCalculatedPrice } = React.useMemo(() => {
    if (!settings || !event) {
        return { priceTier: null, totalCalculatedPrice: 0 };
    }
    
    const guestCount = event.maxGuests;

    if (guestCount <= 5) {
        return { priceTier: null, totalCalculatedPrice: 0 };
    }
    
    const { priceTiers, basePrice } = settings;

    // Use basePrice as the default if no tiers are defined.
    if (!priceTiers || priceTiers.length === 0) {
        return { priceTier: null, totalCalculatedPrice: basePrice || 0 };
    }
    
    let suitableTier = priceTiers.find(tier => tier.guestCount >= guestCount);
    
    if (!suitableTier) {
       suitableTier = priceTiers[priceTiers.length - 1];
    }
    
    const total = suitableTier ? suitableTier.price : basePrice;

    return {
        priceTier: suitableTier || null,
        totalCalculatedPrice: total,
    };

  }, [settings, event]);

  const handleActivateFreeTier = async () => {
    if (!event) return;
    setIsActivatingFree(true);
    const result = await activateFreeEvent(eventId, event.maxGuests);
    if (result.success) {
        console.log("Free event activated successfully!");
        router.push("/client/dashboard");
    } else {
        console.error(result.error || "Failed to activate free event.");
        setIsActivatingFree(false);
    }
  }

  const handleStripeCheckout = async () => {
    if (!event || totalCalculatedPrice <= 0 || !settings?.stripePublishableKey) {
        console.error("Missing event data, price, or Stripe key for checkout.");
        return;
    }
    setIsRequesting(true);
    try {
        // First, save the new guest count to the event
        await updateEvent(event.id, { maxGuests: event.maxGuests });

        const { sessionId, error } = await createCheckoutSession({
            eventId: event.id,
            eventName: event.name,
            priceInEur: totalCalculatedPrice,
            guestCount: event.maxGuests,
        });

        if (error || !sessionId) {
            throw new Error(error || "Could not create checkout session.");
        }

        const stripe = await loadStripe(settings.stripePublishableKey);
        if (!stripe) {
            throw new Error("Stripe.js failed to load.");
        }
        
        const { error: stripeError } = await stripe.redirectToCheckout({ sessionId });

        if (stripeError) {
             throw new Error(stripeError.message);
        }

    } catch (err: any) {
        console.error("Stripe checkout failed:", err.message);
    } finally {
        setIsRequesting(false);
    }
  };


  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!event || !settings) {
    return (
      <div className="text-center p-8">
        <p>{t('upgrade_load_error')}</p>
         <p className="text-sm text-muted-foreground">Configureer prijscategorieën en Stripe API sleutels in het admin-dashboard om deze pagina te gebruiken.</p>
      </div>
    );
  }
  
  const isFreeTier = event.maxGuests <= 5;
  const canUseStripe = settings.stripePublishableKey && settings.stripePublishableKey.startsWith('pk_');

  return (
    <div className="flex justify-center items-start py-12 px-4">
      <Card className="w-full max-w-3xl">
        <CardHeader>
          <CardTitle className="text-3xl">{t('upgrade_title')}</CardTitle>
          <CardDescription>
            {t('upgrade_desc_1')} "{event.name}" {t('upgrade_desc_2')}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-8">
            <div className="space-y-4">
                <div className="flex justify-between items-baseline">
                    <Label htmlFor="guest-slider" className="text-lg font-medium">{t('upgrade_guest_slider_label')}</Label>
                    <span className="font-bold text-2xl text-primary">{event.maxGuests} {t('upgrade_guests')}</span>
                </div>
                 <Slider
                    id="guest-slider"
                    min={5}
                    max={500}
                    step={5}
                    value={[event.maxGuests]}
                    onValueChange={handleGuestLimitChange}
                />
            </div>
          <div className="space-y-4">
            <h3 className="text-lg font-medium">{t('upgrade_price_calculation_title')}</h3>
            <Table>
               <TableHeader>
                    <TableRow>
                        <TableHead>{t('upgrade_table_header_desc')}</TableHead>
                        <TableHead className="text-right">{t('upgrade_table_header_price')}</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isFreeTier ? (
                         <TableRow>
                            <TableCell>
                               Gratis Pakket (tot 5 gasten)
                            </TableCell>
                            <TableCell className="text-right">
                               €0.00
                            </TableCell>
                        </TableRow>
                    ) : (
                        <>
                            {priceTier && (
                                <TableRow>
                                    <TableCell>
                                        Pakket voor maximaal {priceTier.guestCount} gasten
                                    </TableCell>
                                    <TableCell className="text-right">
                                     €{priceTier.price.toFixed(2)}
                                    </TableCell>
                                </TableRow>
                            )}
                             {!priceTier && settings.basePrice > 0 && (
                                 <TableRow>
                                    <TableCell>
                                       Basisprijs
                                    </TableCell>
                                    <TableCell className="text-right">
                                     €{settings.basePrice.toFixed(2)}
                                    </TableCell>
                                </TableRow>
                            )}
                        </>
                    )}
                     <TableRow className="bg-muted/50 font-bold">
                        <TableCell>{t('upgrade_total_price_label')}</TableCell>
                        <TableCell className="text-right text-xl">
                            €{totalCalculatedPrice.toFixed(2)}
                        </TableCell>
                    </TableRow>
                </TableBody>
            </Table>
          </div>
        </CardContent>
        <CardFooter>
            {isFreeTier ? (
                 <Button onClick={handleActivateFreeTier} disabled={isActivatingFree} size="lg" className="w-full">
                    {isActivatingFree ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Zap className="mr-2 h-4 w-4" />
                    )}
                    {isActivatingFree ? "Activeren..." : "Gratis Activeren"}
                </Button>
            ) : (
                <Button onClick={handleStripeCheckout} disabled={isRequesting || !canUseStripe} size="lg" className="w-full">
                    {isRequesting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    )}
                    {isRequesting ? "Verwerken..." : `Betaal & Activeer (€${totalCalculatedPrice.toFixed(2)})`}
                </Button>
            )}
        </CardFooter>
        {!canUseStripe && !isFreeTier && (
            <CardFooter className="flex-col items-start text-sm text-muted-foreground pt-4 border-t">
                <p>Online betalingen zijn momenteel niet geconfigureerd.</p>
                <p>Neem contact op met de beheerder om dit evenement handmatig te activeren.</p>
            </CardFooter>
        )}
      </Card>
    </div>
  );
}

    