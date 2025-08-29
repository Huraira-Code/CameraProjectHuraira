"use client"

import * as React from "react"
import Image from "next/image"
import {
  MoreHorizontal,
  PlusCircle,
  ChevronDown,
  Upload,
  Building,
  Calendar,
  Sparkles,
  Save,
  Edit,
  Trash2,
  Loader2,
  LogIn,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
} from "@/components/ui/alert-dialog"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { collection, getDocs, doc, setDoc, deleteDoc, writeBatch } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useLocale } from "@/lib/locale"
import { createPartner } from "./actions"
import { createImpersonationToken } from "@/lib/auth-actions"


type PartnerRole = "Company" | "Affiliate";

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
  role: PartnerRole;
  activeEvents: number;
  subscription: string;
  branding: BrandingSettings;
};

const initialPartners: Partner[] = [
  {
    id: "info@jaiklach.nl",
    name: "Ja ik lach, Photobooths",
    email: "info@jaiklach.nl",
    role: "Company",
    activeEvents: 1,
    subscription: "5 Events / month",
    branding: {
        companyName: "Ja ik lach, Photobooths",
        logoUrl: "https://placehold.co/100x40/a2d947/000000?text=Ja%2C%0Aik+lach!",
        primaryColor: "#f59e0b",
        textColor: "#000000",
        backgroundColor: "#ffffff",
        menuBackgroundColor: '#f1f5f9',
    }
  },
]

const subscriptionOptions = [
    "1 Event / month",
    "5 Events / month",
    "10 Events / month",
    "25 Events / month",
    "50 Events / month",
    "Unlimited Events",
];

export default function PartnersPage() {
    const { t } = useLocale();
    const [partners, setPartners] = React.useState<Partner[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [saving, setSaving] = React.useState(false);
    const [openDialog, setOpenDialog] = React.useState(false);
    const [selectedPartner, setSelectedPartner] = React.useState<Partner | null>(null);

    // Form state for the dialog
    const [name, setName] = React.useState("");
    const [email, setEmail] = React.useState("");
    const [password, setPassword] = React.useState("");
    const [role, setRole] = React.useState<PartnerRole>("Company");
    const [dialogError, setDialogError] = React.useState<string | null>(null);


    React.useEffect(() => {
        const fetchPartners = async () => {
            setLoading(true);
            try {
                const partnersCollectionRef = collection(db, "partners");
                const querySnapshot = await getDocs(partnersCollectionRef);
                
                if (querySnapshot.empty) {
                    const batch = writeBatch(db);
                    initialPartners.forEach(partner => {
                        const docRef = doc(partnersCollectionRef, partner.id);
                        batch.set(doc(partnersCollectionRef, partner.id), {
                            name: partner.name,
                            email: partner.email,
                            role: partner.role,
                            activeEvents: partner.activeEvents,
                            subscription: partner.subscription,
                            branding: partner.branding,
                        });
                    });
                    await batch.commit();
                    setPartners(initialPartners);
                    console.log("Partner collection seeded");
                } else {
                    const partnersList = querySnapshot.docs.map(doc => ({ ...doc.data() as Omit<Partner, 'id'>, id: doc.id }));
                    setPartners(partnersList);
                }
            } catch (error) {
                console.error("Error fetching partners:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchPartners();
    }, []);

    const handleAddNew = () => {
        setSelectedPartner(null);
        setName("");
        setEmail("");
        setPassword("");
        setRole("Company");
        setDialogError(null);
        setOpenDialog(true);
    }
    
    const handleEdit = (partner: Partner) => {
        setSelectedPartner(partner);
        setName(partner.name);
        setEmail(partner.email);
        setPassword(""); // Don't pre-fill password for security
        setRole(partner.role);
        setDialogError(null);
        setOpenDialog(true);
    }

    const handleDelete = async (partnerId: string) => {
        try {
            // Note: This does not delete the Firebase Auth user. That should be handled separately if needed.
            await deleteDoc(doc(db, "partners", partnerId));
            setPartners(partners.filter(p => p.id !== partnerId));
            console.log(`Partner with ID ${partnerId} deleted.`);
        } catch (error) {
            console.error("Error deleting partner:", error);
        }
    }

    const handleSaveChanges = async () => {
        if (!name || !email) {
            setDialogError("Name and email are required.");
            return;
        }

        setSaving(true);
        setDialogError(null);

        try {
            if (selectedPartner) {
                // Editing existing partner
                const updatedPartnerData = { ...selectedPartner, name, email, role };
                const { id, ...dataToSave } = updatedPartnerData;
                await setDoc(doc(db, "partners", selectedPartner.id), dataToSave);
                setPartners(partners.map(p => p.id === selectedPartner.id ? updatedPartnerData : p));
                console.log(`Partner ${selectedPartner.name} updated.`);
                // Note: Password changes for existing users would need a separate, more secure flow.
            } else {
                // Adding new partner via server action
                if (!password) {
                    setDialogError("Password is required for new partners.");
                    setSaving(false);
                    return;
                }
                const result = await createPartner({ name, email, password, role });
                if (result.success && result.partner) {
                    setPartners([...partners, result.partner]);
                    console.log(`New partner ${name} added successfully.`);
                } else {
                    throw new Error(result.error || "Failed to create partner.");
                }
            }
             setOpenDialog(false);
        } catch (error: any) {
            console.error("Error saving partner:", error);
            setDialogError(error.message);
        } finally {
            setSaving(false);
        }
    }
    
    const handleImpersonate = async (partnerEmail: string) => {
        setSaving(true);
        try {
            const result = await createImpersonationToken(partnerEmail);
            if(result.success && result.token) {
                 // Store the token in localStorage
                localStorage.setItem('impersonationToken', result.token);
                // Open the dashboard in a new tab
                window.open('/partner/dashboard', '_blank');
            } else {
                 console.error(result.error || "Failed to get impersonation token.");
            }
        } catch (error) {
            console.error("Error during impersonation:", error);
        } finally {
            setSaving(false);
        }
    }
    
    const handleBrandingChange = (partnerId: string, field: keyof BrandingSettings, value: string) => {
        setPartners(partners.map(p => 
            p.id === partnerId ? { ...p, branding: { ...p.branding, [field]: value } } : p
        ));
    };

    const handleLogoUpload = (partnerId: string, file: File) => {
        // This part would require uploading to a storage service (like Firebase Storage)
        // and getting a URL back. For now, we'll use a local data URL for preview.
        const reader = new FileReader();
        reader.onloadend = () => {
            const newLogoUrl = reader.result as string;
            handleBrandingChange(partnerId, 'logoUrl', newLogoUrl);
            console.log(`Logo for partner ID ${partnerId} updated locally. Click 'Save Branding' to persist.`);
        };
        reader.readAsDataURL(file);
    };

    const saveBranding = async (partnerId: string) => {
        const partner = partners.find(p => p.id === partnerId);
        if (!partner) return;
        
        setSaving(true);
        try {
            // Note: If logoUrl is a data URL, it should be uploaded to storage first.
            // This implementation saves the data URL directly to Firestore, which is not ideal for large images.
            await setDoc(doc(db, "partners", partnerId), partner, { merge: true });
            console.log(`Branding saved for ${partner.name}.`);
        } catch(error) {
            console.error("Error saving branding:", error);
        } finally {
            setSaving(false);
        }
    }

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
       <div className="grid flex-1 items-start gap-4">
        <div className="flex items-center">
            <h1 className="text-lg font-semibold md:text-2xl">{t('partners_page_title')}</h1>
            <div className="ml-auto flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={handleAddNew}>
                    <PlusCircle className="h-3.5 w-3.5" />
                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                    {t('partners_page_add_partner_button')}
                    </span>
                </Button>
            </div>
        </div>
        <Card>
            <CardHeader>
                <CardTitle>{t('partners_page_card_title')}</CardTitle>
                <CardDescription>
                    {t('partners_page_card_desc')}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {loading ? <Loader2 className="animate-spin" /> : partners.map((partner) => (
                    <Collapsible key={partner.id} className="border-b last:border-b-0 py-4 group">
                        <div className="flex items-center gap-4">
                             <Image src={partner.branding.logoUrl} alt={`${partner.name} logo`} width={40} height={40} className="rounded-sm" data-ai-hint="logo" />
                             <div className="flex-1">
                                <p className="font-medium">{partner.name}</p>
                                <p className="text-sm text-muted-foreground">{partner.email}</p>
                             </div>
                             <Badge variant={partner.role === 'Company' ? 'secondary' : 'outline'} className="w-24 justify-center">{partner.role}</Badge>
                             <div className="flex items-center gap-2 text-sm text-muted-foreground w-28">
                                <Calendar className="h-4 w-4" />
                                <span>{partner.activeEvents} {t('partners_page_active_events')}</span>
                             </div>
                             <Select defaultValue={partner.subscription} onValueChange={(value) => setPartners(partners.map(p => p.id === partner.id ? {...p, subscription: value} : p))}>
                                <SelectTrigger className="w-48">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {subscriptionOptions.map(option => (
                                        <SelectItem key={option} value={option}>{option}</SelectItem>
                                    ))}
                                </SelectContent>
                             </Select>
                             <div className="flex items-center">
                                 <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>{t('actions')}</DropdownMenuLabel>
                                        <DropdownMenuItem onClick={() => handleEdit(partner)}>
                                            <Edit className="mr-2 h-4 w-4"/>
                                            {t('edit_details')}
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleImpersonate(partner.email)} disabled={saving}>
                                            <LogIn className="mr-2 h-4 w-4" />
                                            Login as Partner
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:bg-destructive focus:text-destructive-foreground">
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    <span>{t('delete_partner')}</span>
                                                </DropdownMenuItem>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                <AlertDialogTitle>{t('are_you_sure')}</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    {t('delete_partner_confirmation')} "{partner.name}". {t('cannot_be_undone')}
                                                </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDelete(partner.id)}>{t('yes_delete_it')}</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </DropdownMenuContent>
                                 </DropdownMenu>
                                 <CollapsibleTrigger asChild>
                                    <Button variant="ghost" size="sm" className="w-9 p-0">
                                        <ChevronDown className="h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                                        <span className="sr-only">{t('toggle')}</span>
                                    </Button>
                                 </CollapsibleTrigger>
                             </div>
                        </div>
                        <CollapsibleContent className="mt-4 pl-14">
                           <div className="bg-muted p-6 rounded-lg">
                             <h4 className="font-semibold text-base mb-4">{t('partners_page_branding_title')}</h4>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor={`companyName-${partner.id}`}>{t('partners_page_company_name_label')}</Label>
                                    <Input id={`companyName-${partner.id}`} value={partner.branding.companyName} onChange={(e) => handleBrandingChange(partner.id, 'companyName', e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label>{t('partners_page_company_logo_label')}</Label>
                                     <div className="flex items-center gap-4">
                                         <Image src={partner.branding.logoUrl} alt="Logo preview" width={40} height={40} className="rounded-sm bg-white" data-ai-hint="logo" />
                                         <Input id={`logo-${partner.id}`} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files && handleLogoUpload(partner.id, e.target.files[0])} />
                                         <Button variant="outline" onClick={() => document.getElementById(`logo-${partner.id}`)?.click()}>
                                             <Upload className="mr-2 h-4 w-4" />
                                             {t('partners_page_choose_file_button')}
                                        </Button>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                     <Label htmlFor={`primaryColor-${partner.id}`}>{t('partners_page_primary_color_label')}</Label>
                                     <div className="flex items-center gap-2">
                                        <div className="h-10 w-10 rounded-md border" style={{backgroundColor: partner.branding.primaryColor}} />
                                        <Input id={`primaryColor-${partner.id}`} value={partner.branding.primaryColor} onChange={(e) => handleBrandingChange(partner.id, 'primaryColor', e.target.value)} />
                                     </div>
                                </div>
                                <div className="space-y-2">
                                     <Label htmlFor={`textColor-${partner.id}`}>Text & Icon Color</Label>
                                     <div className="flex items-center gap-2">
                                        <div className="h-10 w-10 rounded-md border" style={{backgroundColor: partner.branding.textColor}} />
                                        <Input id={`textColor-${partner.id}`} value={partner.branding.textColor} onChange={(e) => handleBrandingChange(partner.id, 'textColor', e.target.value)} />
                                    </div>
                                </div>
                                 <div className="space-y-2">
                                     <Label htmlFor={`backgroundColor-${partner.id}`}>{t('partners_page_background_color_label')}</Label>
                                     <div className="flex items-center gap-2">
                                        <div className="h-10 w-10 rounded-md border" style={{backgroundColor: partner.branding.backgroundColor}} />
                                        <Input id={`backgroundColor-${partner.id}`} value={partner.branding.backgroundColor} onChange={(e) => handleBrandingChange(partner.id, 'backgroundColor', e.target.value)} />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                     <Label htmlFor={`menuBackgroundColor-${partner.id}`}>Menu Background Color</Label>
                                     <div className="flex items-center gap-2">
                                        <div className="h-10 w-10 rounded-md border" style={{backgroundColor: partner.branding.menuBackgroundColor}} />
                                        <Input id={`menuBackgroundColor-${partner.id}`} value={partner.branding.menuBackgroundColor} onChange={(e) => handleBrandingChange(partner.id, 'menuBackgroundColor', e.target.value)} />
                                    </div>
                                </div>
                             </div>
                             <div className="flex justify-end mt-6">
                                <Button onClick={() => saveBranding(partner.id)} disabled={saving}>
                                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                    {t('partners_page_save_branding_button')}
                                </Button>
                             </div>
                           </div>
                        </CollapsibleContent>
                    </Collapsible>
                ))}
            </CardContent>
        </Card>
      </div>

       <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{selectedPartner ? t('partners_page_edit_partner_title') : t('partners_page_add_partner_title')}</DialogTitle>
            <DialogDescription>
              {selectedPartner ? t('partners_page_edit_partner_desc') : t('partners_page_add_partner_desc')}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                {t('partners_page_name_label')}
              </Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                {t('partners_page_email_label')}
              </Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="col-span-3" disabled={!!selectedPartner} />
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="password" className="text-right">
                {t('partners_page_password_label')}
              </Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="col-span-3" placeholder={selectedPartner ? t('partners_page_password_placeholder_edit') : t('partners_page_password_placeholder_add')} />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="role" className="text-right">
                    {t('partners_page_role_label')}
                </Label>
                 <Select value={role} onValueChange={(value: PartnerRole) => setRole(value)}>
                    <SelectTrigger className="col-span-3">
                        <SelectValue placeholder={t('partners_page_role_placeholder')} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Company">{t('partners_page_role_company')}</SelectItem>
                        <SelectItem value="Affiliate">{t('partners_page_role_affiliate')}</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            {dialogError && <p className="text-sm text-destructive col-span-4 text-center">{dialogError}</p>}
          </div>
          <DialogFooter>
            <Button type="submit" onClick={handleSaveChanges} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('save_changes')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  )
}
