
"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardDescription,
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Save, PlusCircle, Trash2 } from "lucide-react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { v4 as uuidv4 } from 'uuid';

interface PriceTier {
  id: string;
  guestCount: number;
  price: number;
}

interface PaymentSettings {
  stripeSecretKey: string;
  stripePublishableKey: string;
  stripeWebhookSecret: string;
  basePrice: number;
  priceTiers: PriceTier[];
}

const initialPriceTiers: PriceTier[] = [
    { id: uuidv4(), guestCount: 25, price: 17.99 },
    { id: uuidv4(), guestCount: 50, price: 29.99 },
    { id: uuidv4(), guestCount: 100, price: 49.99 },
    { id: uuidv4(), guestCount: 150, price: 59.99 },
    { id: uuidv4(), guestCount: 200, price: 79.99 },
    { id: uuidv4(), guestCount: 250, price: 91.99 },
    { id: uuidv4(), guestCount: 500, price: 111.99 },
];

export default function PaymentsPage() {
  const [settings, setSettings] = React.useState<PaymentSettings | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      const settingsRef = doc(db, "settings", "payments");
      const docSnap = await getDoc(settingsRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        const newSettings: PaymentSettings = {
            stripeSecretKey: data.stripeSecretKey || "",
            stripePublishableKey: data.stripePublishableKey || "",
            stripeWebhookSecret: data.stripeWebhookSecret || "",
            basePrice: data.basePrice ?? 12.99, // Fallback to 12.99
            priceTiers: (data.priceTiers || initialPriceTiers).map((t: any) => ({
                id: t.id || uuidv4(),
                guestCount: t.guestCount,
                price: t.price
            }))
        }
        setSettings(newSettings);
      } else {
        // Initialize with default values if document doesn't exist
        const defaultSettings: PaymentSettings = {
            stripeSecretKey: "",
            stripePublishableKey: "",
            stripeWebhookSecret: "",
            basePrice: 12.99,
            priceTiers: initialPriceTiers,
        };
        await setDoc(settingsRef, defaultSettings);
        setSettings(defaultSettings);
      }
      setLoading(false);
    };

    fetchSettings();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!settings) return;
    setSettings({ ...settings, [e.target.name]: e.target.value });
  };
  
  const handleBasePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!settings) return;
    setSettings({ ...settings, basePrice: parseFloat(e.target.value) || 0 });
  };

  const handleTierChange = (index: number, field: keyof Omit<PriceTier, 'id'>, value: string) => {
    if (!settings) return;
    const newTiers = [...settings.priceTiers];
    const tier = { ...newTiers[index] };
    (tier as any)[field] = parseFloat(value) || 0;
    newTiers[index] = tier;
    setSettings({ ...settings, priceTiers: newTiers });
  };
  
  const handleAddTier = () => {
    if (!settings) return;
    const newTier: PriceTier = { id: uuidv4(), guestCount: 0, price: 0 };
    setSettings({ ...settings, priceTiers: [...settings.priceTiers, newTier]});
  };
  
  const handleRemoveTier = (id: string) => {
      if (!settings) return;
      const newTiers = settings.priceTiers.filter((tier) => tier.id !== id);
      setSettings({ ...settings, priceTiers: newTiers });
  };

  const handleSaveChanges = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      const settingsRef = doc(db, "settings", "payments");
      await setDoc(settingsRef, {
          ...settings,
          priceTiers: settings.priceTiers.sort((a,b) => a.guestCount - b.guestCount)
      });
      console.log("Payment settings saved successfully.");
    } catch (error) {
      console.error("Error saving payment settings: ", error);
      console.error("Could not save settings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="grid flex-1 items-start gap-4">
        <div className="flex items-center">
          <h1 className="text-lg font-semibold md:text-2xl">
            Payment Settings
          </h1>
          <div className="ml-auto">
             <Button onClick={handleSaveChanges} disabled={saving || loading}>
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save All Changes
            </Button>
          </div>
        </div>
        {loading ? (
             <Card>
                <CardHeader>
                    <CardTitle>Loading Settings...</CardTitle>
                </CardHeader>
                <CardContent>
                    <Loader2 className="mx-auto h-8 w-8 animate-spin" />
                </CardContent>
            </Card>
        ) : settings && (
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Stripe API Keys</CardTitle>
                <CardDescription>
                  Enter your API keys from your Stripe Dashboard. These are stored securely in Firestore.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                 <div className="space-y-2">
                  <Label htmlFor="stripePublishableKey">Publishable Key (pk_...)</Label>
                  <Input
                    id="stripePublishableKey"
                    name="stripePublishableKey"
                    type="text"
                    value={settings.stripePublishableKey}
                    onChange={handleInputChange}
                    placeholder="pk_test_..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stripeSecretKey">Secret Key (sk_...)</Label>
                  <Input
                    id="stripeSecretKey"
                    name="stripeSecretKey"
                    type="password"
                    value={settings.stripeSecretKey}
                    onChange={handleInputChange}
                    placeholder="sk_test_..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stripeWebhookSecret">Webhook Signing Secret (whsec_...)</Label>
                  <Input
                    id="stripeWebhookSecret"
                    name="stripeWebhookSecret"
                    type="password"
                    value={settings.stripeWebhookSecret}
                    onChange={handleInputChange}
                    placeholder="whsec_..."
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Pricing Structure</CardTitle>
                <CardDescription>
                  Set the base price and define price tiers based on the number of guests.
                </CardDescription>
              </CardHeader>
              <CardContent>
                 <div className="space-y-2 mb-6 max-w-xs">
                  <Label htmlFor="basePrice">Base Price (€)</Label>
                  <Input
                    id="basePrice"
                    type="number"
                    value={settings.basePrice}
                    onChange={handleBasePriceChange}
                    step="0.01"
                  />
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Max. Guests</TableHead>
                      <TableHead>Total Price (€)</TableHead>
                      <TableHead>
                        <span className="sr-only">Actions</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {settings.priceTiers.map((tier, index) => (
                      <TableRow key={tier.id}>
                        <TableCell>
                          <Input
                            type="number"
                            value={tier.guestCount}
                            onChange={(e) => handleTierChange(index, "guestCount", e.target.value)}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={tier.price}
                            onChange={(e) => handleTierChange(index, "price", e.target.value)}
                            step="0.01"
                          />
                        </TableCell>
                         <TableCell>
                           <Button variant="ghost" size="icon" onClick={() => handleRemoveTier(tier.id)}>
                               <Trash2 className="h-4 w-4" />
                           </Button>
                         </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                 <Button variant="outline" size="sm" onClick={handleAddTier} className="mt-4">
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Tier
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </main>
  );
}
