
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
import { Loader2, Save, Upload, Edit } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { updateProfile, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Image from "next/image";

type BrandingSettings = {
    companyName: string;
    logoUrl: string;
    primaryColor: string;
    textColor: string;
    backgroundColor: string;
    menuBackgroundColor: string;
};

type Partner = {
  id: string;
  name: string;
  email: string;
  role: string;
  branding: BrandingSettings;
};

export default function PartnerSettingsPage() {
  const { user } = useAuth();
  const [partnerData, setPartnerData] = React.useState<Partner | null>(null);

  const [name, setName] = React.useState("");
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");

  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (user?.email) {
      const fetchPartnerData = async () => {
        setLoading(true);
        const partnerRef = doc(db, "partners", user.email!);
        const docSnap = await getDoc(partnerRef);
        if (docSnap.exists()) {
          const data = { id: docSnap.id, ...docSnap.data() } as Partner;
          setPartnerData(data);
          setName(data.name);
        } else {
          console.error("Partner data not found in Firestore.");
        }
        setLoading(false);
      };
      fetchPartnerData();
    }
  }, [user]);

  const handleNameUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !partnerData) return;
    setSaving("name");

    try {
      await updateProfile(user, { displayName: name });
      const partnerRef = doc(db, "partners", user.email!);
      await setDoc(partnerRef, { name: name }, { merge: true });
      setPartnerData({ ...partnerData, name: name });
      console.log("Name updated successfully!");
    } catch (error: any) {
      console.error("Error updating name:", error.message);
    } finally {
      setSaving(null);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !user.email) {
      console.error("User not available for password update.");
      return;
    }
    if (newPassword !== confirmPassword) {
      console.error("New passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      console.error("Password should be at least 6 characters.");
      return;
    }
    setSaving("password");

    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      console.log("Password updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      console.error("Error updating password:", error.message);
    } finally {
      setSaving(null);
    }
  };

  const handleBrandingChange = (field: keyof BrandingSettings, value: string) => {
    if (!partnerData) return;
    setPartnerData({
      ...partnerData,
      branding: { ...partnerData.branding, [field]: value },
    });
  };

  const handleLogoUpload = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const newLogoUrl = reader.result as string;
      handleBrandingChange('logoUrl', newLogoUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleBrandingSave = async () => {
    if (!user || !partnerData) return;
    setSaving("branding");

    try {
      // Note: This saves the potentially large base64 data URL.
      // A production implementation should upload to storage and save the URL.
      const partnerRef = doc(db, "partners", user.email!);
      await setDoc(partnerRef, { branding: partnerData.branding }, { merge: true });
      console.log("Branding saved successfully!");
    } catch (error: any) {
      console.error("Error saving branding:", error.message);
    } finally {
      setSaving(null);
    }
  };
  
  if (loading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin h-8 w-8" /></div>
  }

  if (!partnerData) {
     return <div className="text-center">Could not load partner data.</div>
  }

  return (
    <div className="grid gap-6">
      <Card>
        <form onSubmit={handleNameUpdate}>
          <CardHeader>
            <CardTitle>Company Name</CardTitle>
            <CardDescription>Update your public company name.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="name">Company Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            <Button type="submit" disabled={saving === 'name'}>
              {saving === 'name' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Name
            </Button>
          </CardFooter>
        </form>
      </Card>
      
       <Card>
        <CardHeader>
            <CardTitle>Whitelabel Branding</CardTitle>
            <CardDescription>Customize the look and feel of the partner portal and slideshows.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2 col-span-1 md:col-span-2 lg:col-span-3">
                <Label>Company Logo</Label>
                <div className="flex items-center gap-4">
                    <Image src={partnerData.branding.logoUrl} alt="Logo preview" width={100} height={40} className="rounded-sm bg-muted p-1 object-contain" data-ai-hint="logo" />
                    <Input id="logo-upload" type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files && handleLogoUpload(e.target.files[0])} />
                    <Button type="button" variant="outline" onClick={() => document.getElementById('logo-upload')?.click()}>
                        <Upload className="mr-2 h-4 w-4" /> Change Logo
                    </Button>
                </div>
            </div>
             <div className="space-y-2 col-span-1 md:col-span-2 lg:col-span-3">
                <Label htmlFor="companyName">Company Name (in Slideshow)</Label>
                <Input id="companyName" value={partnerData.branding.companyName} onChange={(e) => handleBrandingChange('companyName', e.target.value)} />
            </div>

            <div className="space-y-2">
                <Label htmlFor="primaryColor">Primary Color</Label>
                <div className="flex items-center gap-2">
                    <Input 
                        type="color" 
                        value={partnerData.branding.primaryColor} 
                        onChange={(e) => handleBrandingChange('primaryColor', e.target.value)}
                        className="p-1 h-10 w-10 cursor-pointer"
                    />
                    <Input id="primaryColor" value={partnerData.branding.primaryColor} onChange={(e) => handleBrandingChange('primaryColor', e.target.value)} />
                </div>
            </div>
             <div className="space-y-2">
                <Label htmlFor="textColor">Text & Icon Color</Label>
                <div className="flex items-center gap-2">
                    <Input 
                        type="color" 
                        value={partnerData.branding.textColor} 
                        onChange={(e) => handleBrandingChange('textColor', e.target.value)}
                        className="p-1 h-10 w-10 cursor-pointer"
                    />
                    <Input id="textColor" value={partnerData.branding.textColor} onChange={(e) => handleBrandingChange('textColor', e.target.value)} />
                </div>
            </div>
             <div className="space-y-2">
                <Label htmlFor="menuBackgroundColor">Menu Background Color</Label>
                <div className="flex items-center gap-2">
                    <Input 
                        type="color" 
                        value={partnerData.branding.menuBackgroundColor} 
                        onChange={(e) => handleBrandingChange('menuBackgroundColor', e.target.value)}
                        className="p-1 h-10 w-10 cursor-pointer"
                    />
                    <Input id="menuBackgroundColor" value={partnerData.branding.menuBackgroundColor} onChange={(e) => handleBrandingChange('menuBackgroundColor', e.target.value)} />
                </div>
            </div>
            <div className="space-y-2">
                <Label htmlFor="backgroundColor">Main Background Color</Label>
                <div className="flex items-center gap-2">
                    <Input 
                        type="color" 
                        value={partnerData.branding.backgroundColor} 
                        onChange={(e) => handleBrandingChange('backgroundColor', e.target.value)}
                        className="p-1 h-10 w-10 cursor-pointer"
                    />
                    <Input id="backgroundColor" value={partnerData.branding.backgroundColor} onChange={(e) => handleBrandingChange('backgroundColor', e.target.value)} />
                </div>
            </div>
            
        </CardContent>
        <CardFooter className="border-t px-6 py-4">
            <Button onClick={handleBrandingSave} disabled={saving === 'branding'}>
                {saving === 'branding' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save Branding Settings
            </Button>
        </CardFooter>
      </Card>

      <Card>
        <form onSubmit={handlePasswordUpdate}>
          <CardHeader>
            <CardTitle>Password</CardTitle>
            <CardDescription>Change your password. You will be logged out after a successful change.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Current Password</Label>
              <Input id="current-password" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input id="new-password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input id="confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
            </div>
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            <Button type="submit" disabled={saving === 'password'}>
              {saving === 'password' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Edit className="mr-2 h-4 w-4" />}
              Change Password
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
