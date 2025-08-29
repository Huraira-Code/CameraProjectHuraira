
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
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { updateProfile, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
import { useLocale } from "@/lib/locale";

export default function SettingsPage() {
  const { user } = useAuth();
  const { t } = useLocale();
  const [name, setName] = React.useState("");
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [loadingName, setLoadingName] = React.useState(false);
  const [loadingPassword, setLoadingPassword] = React.useState(false);

  React.useEffect(() => {
    if (user?.displayName) {
      setName(user.displayName);
    }
  }, [user]);

  const handleNameUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoadingName(true);

    try {
      await updateProfile(user, { displayName: name });
      console.log("Name updated successfully!");
    } catch (error: any) {
      console.error("Error updating name:", error.message);
    } finally {
      setLoadingName(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !user.email) {
        console.error("User not available for password update.");
        return;
    };
    if (newPassword !== confirmPassword) {
      console.error("New passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
        console.error("Password should be at least 6 characters.");
        return;
    }

    setLoadingPassword(true);

    try {
        const credential = EmailAuthProvider.credential(user.email, currentPassword);
        await reauthenticateWithCredential(user, credential);
        await updatePassword(user, newPassword);
        console.log("Password updated successfully!");
        // Clear password fields after successful update
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
    } catch (error: any) {
        console.error("Error updating password:", error.message);
    } finally {
        setLoadingPassword(false);
    }
  };


  return (
    <div className="grid gap-6">
        <Card>
            <form onSubmit={handleNameUpdate}>
                <CardHeader>
                    <CardTitle>{t('client_settings_name_title')}</CardTitle>
                    <CardDescription>{t('client_settings_name_desc')}</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        <Label htmlFor="name">{t('client_settings_name_label')}</Label>
                        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
                    </div>
                </CardContent>
                <CardFooter className="border-t px-6 py-4">
                    <Button type="submit" disabled={loadingName}>
                        {loadingName && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {t('client_settings_name_button')}
                    </Button>
                </CardFooter>
            </form>
        </Card>
         <Card>
            <form onSubmit={handlePasswordUpdate}>
                <CardHeader>
                    <CardTitle>{t('client_settings_password_title')}</CardTitle>
                    <CardDescription>{t('client_settings_password_desc')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="current-password">{t('client_settings_password_current_label')}</Label>
                        <Input id="current-password" type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="new-password">{t('client_settings_password_new_label')}</Label>
                        <Input id="new-password" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="confirm-password">{t('client_settings_password_confirm_label')}</Label>
                        <Input id="confirm-password" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
                    </div>
                </CardContent>
                <CardFooter className="border-t px-6 py-4">
                    <Button type="submit" disabled={loadingPassword}>
                        {loadingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {t('client_settings_password_button')}
                    </Button>
                </CardFooter>
            </form>
        </Card>
    </div>
  );
}
