
"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  MoreHorizontal,
  PlusCircle,
  QrCode,
  Link as LinkIcon,
  Upload,
  Download,
  Share,
  Eye,
  Edit,
  Mail,
  Users,
  Image as ImageIcon,
  CheckCircle2,
  XCircle,
  Loader2,
  Zap,
  CreditCard,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
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
import { useAuth } from "@/lib/auth";
import { getEventsForAdmin, Event, updateEventCoverImage } from "@/lib/events"; // Re-using getEventsForAdmin for mock data structure consistency
import QRCode from 'qrcode';
import { useLocale } from "@/lib/locale";


export default function ClientDashboard() {
  const { user } = useAuth();
  const { t } = useLocale();
  const [events, setEvents] = React.useState<Event[]>([]);
  const [loading, setLoading] = React.useState(true);
  const fileInputRefs = React.useRef<Record<string, HTMLInputElement | null>>({});

  const [qrCodeModalOpen, setQrCodeModalOpen] = React.useState(false);
  const [activeQrCode, setActiveQrCode] = React.useState('');
  const [activeEventForQr, setActiveEventForQr] = React.useState<Event | null>(null);

  React.useEffect(() => {
    async function fetchEvents() {
        if (!user || !user.email) {
            setLoading(false);
            return;
        };
        setLoading(true);
        // This fetches all events, we filter client-side for this dashboard
        const allEvents = await getEventsForAdmin(); 
        const userEvents = allEvents.filter(event => event.owner === user.email);
        setEvents(userEvents);
        setLoading(false);
    }
    fetchEvents();
  }, [user]);

  const handleCoverImageChange = async (e: React.ChangeEvent<HTMLInputElement>, eventId: string) => {
      if (!e.target.files || e.target.files.length === 0) return;
      const file = e.target.files[0];
      
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = async () => {
          const base64data = reader.result as string;
          
          setEvents(prevEvents => prevEvents.map(event => 
              event.id === eventId ? { ...event, coverImageUrl: base64data, isUploadingCover: true } as any : event
          ));

          const result = await updateEventCoverImage(eventId, base64data);
          
          if (result.success && result.url) {
               setEvents(prevEvents => prevEvents.map(event => 
                  event.id === eventId ? { ...event, coverImageUrl: result.url, isUploadingCover: false } as any : event
              ));
               console.log("Cover image updated successfully.");
          } else {
              console.error(result.error || "Failed to upload cover image.");
              // Revert optimistic update
              const originalEvent = (await getEventsForAdmin()).find(e => e.id === eventId);
               setEvents(prevEvents => prevEvents.map(event => 
                  event.id === eventId ? originalEvent || event : event
              ));
          }
      };
  };

  const handleShowQrCode = (event: Event) => {
    const welcomeUrl = `${window.location.origin}/event/welcome?eventId=${event.id}`;
    setActiveEventForQr(event);
    QRCode.toDataURL(welcomeUrl, { width: 400, margin: 2 })
      .then(url => {
        setActiveQrCode(url);
        setQrCodeModalOpen(true);
      })
      .catch(err => {
        console.error(err);
        console.error("Could not generate QR code.");
      });
  };

  const copyToClipboard = (text: string, subject: string) => {
    navigator.clipboard.writeText(text).then(() => {
        console.log(`${subject} link has been copied.`);
    }, (err) => {
        console.error("Could not copy link to clipboard.");
    });
  };


  if (loading) {
    return <div className="text-center p-8"><Loader2 className="h-8 w-8 animate-spin mx-auto" /></div>;
  }
  
  if (events.length === 0) {
      return (
         <div className="text-center p-8 border-dashed border-2 rounded-lg">
            <h2 className="text-2xl font-semibold">{t('client_dashboard_no_events_title')}</h2>
            <p className="text-muted-foreground mt-2">{t('client_dashboard_no_events_desc')}</p>
            <Button asChild className="mt-4">
                <Link href="/client/events/new">
                    <PlusCircle className="mr-2 h-4 w-4" /> {t('client_dashboard_create_event_button')}
                </Link>
            </Button>
        </div>
      );
  }

  return (
    <div>
        <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold font-headline">{t('client_dashboard_title')}</h1>
            <Button asChild>
                <Link href="/client/events/new">
                    <PlusCircle className="mr-2 h-4 w-4" /> {t('client_dashboard_create_event_button')}
                </Link>
            </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
            {events.map((event: any) => ( // Using any to accommodate isUploadingCover
            <Card key={event.id} className="flex flex-col">
                 {event.isTest && (
                     <div className="p-4 bg-amber-100 dark:bg-amber-900/50 border-b border-amber-300 dark:border-amber-800">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Zap className="h-5 w-5 text-amber-600" />
                                <div className="font-semibold">
                                    <p>{t('client_dashboard_test_event_banner')}</p>
                                </div>
                            </div>
                            <Button asChild>
                                <Link href={`/client/events/${event.id}/upgrade`}>{t('client_dashboard_upgrade_button')}</Link>
                            </Button>
                        </div>
                    </div>
                )}
                <CardHeader className="p-0 relative">
                    <Image
                        alt="Cover image"
                        className="aspect-video w-full rounded-t-lg object-cover"
                        height="300"
                        src={event.coverImageUrl || event.coverImage}
                        data-ai-hint="wedding couple"
                        width="600"
                    />
                     <Badge className="absolute top-4 right-4" variant={event.paid ? 'secondary' : 'destructive'}>
                        {event.paid ? t('client_dashboard_paid_badge') : t('client_dashboard_unpaid_badge')}
                    </Badge>
                </CardHeader>
                <CardContent className="p-6 flex-grow">
                    <CardTitle className="font-headline mb-2">{event.name}</CardTitle>
                    <CardDescription className="mb-4">{event.description}</CardDescription>
                    
                    <div className="flex justify-around text-center text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            <span>{event.activeGuests} / {event.maxGuests > 0 ? event.maxGuests : '∞'} Guests</span>
                        </div>
                        <div className="flex items-center gap-2">
                           <ImageIcon className="h-4 w-4" />
                            <span>{event.photosTaken} {t('client_dashboard_photos_taken')}</span>
                        </div>
                    </div>

                </CardContent>
                <CardFooter className="p-6 pt-0 grid grid-cols-2 gap-2">
                   {event.paid ? (
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button>
                                <CheckCircle2 className="mr-2 h-4 w-4" /> {t('client_dashboard_publish_photos_button')}
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                <AlertDialogTitle>{t('client_dashboard_publish_dialog_title')}</AlertDialogTitle>
                                <AlertDialogDescription>
                                {t('client_dashboard_publish_dialog_desc')}
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                                <AlertDialogAction>{t('publish')}</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                   ) : (
                        <Button asChild>
                            <Link href={`/client/events/${event.id}/upgrade`}>
                                <CreditCard className="mr-2 h-4 w-4" /> Upgrade & Betaal
                            </Link>
                        </Button>
                   )}

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline">
                               <MoreHorizontal className="h-4 w-4" /> {t('client_dashboard_more_actions_button')}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel>{t('client_dashboard_manage_menu_label')}</DropdownMenuLabel>
                             <DropdownMenuItem asChild>
                               <Link href={`/client/events/${event.id}/edit`}>
                                <Edit className="mr-2 h-4 w-4" />
                                <span>{t('client_dashboard_edit_details_menu_item')}</span>
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={(e) => { e.preventDefault(); fileInputRefs.current[event.id]?.click(); }} disabled={event.isUploadingCover}>
                               <input type="file" ref={ref => fileInputRefs.current[event.id] = ref} onChange={(e) => handleCoverImageChange(e, event.id)} className="hidden" accept="image/*"/>
                               {event.isUploadingCover ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ImageIcon className="mr-2 h-4 w-4" />}
                                <span>{event.isUploadingCover ? t('client_dashboard_uploading_menu_item') : t('client_dashboard_replace_cover_menu_item')}</span>
                            </DropdownMenuItem>
                             <DropdownMenuItem asChild>
                                <a href="mailto:support@wegwerpcamera.nl">
                                    <Mail className="mr-2 h-4 w-4" />
                                    <span>{t('client_dashboard_contact_support_menu_item')}</span>
                                </a>
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />
                            <DropdownMenuLabel>{t('client_dashboard_share_menu_label')}</DropdownMenuLabel>
                             <DropdownMenuItem onClick={() => handleShowQrCode(event)} disabled={!event.paid}>
                                <QrCode className="mr-2 h-4 w-4" />
                                <span>{t('client_dashboard_show_qr_menu_item')}</span>
                            </DropdownMenuItem>
                             <DropdownMenuItem onClick={() => copyToClipboard(`${window.location.origin}/event/welcome?eventId=${event.id}`, "Camera")} disabled={!event.paid}>
                                <LinkIcon className="mr-2 h-4 w-4" />
                                <span>{t('client_dashboard_copy_camera_link_menu_item')}</span>
                            </DropdownMenuItem>
                             <DropdownMenuItem onClick={() => copyToClipboard(`${window.location.origin}/event/${event.id}/upload`, "Upload")} disabled={!event.paid}>
                                <Upload className="mr-2 h-4 w-4" />
                                <span>{t('client_dashboard_copy_upload_link_menu_item')}</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild disabled={!event.paid}>
                               <Link href={`/event/${event.id}/download`} target="_blank" rel="noopener noreferrer">
                                <Download className="mr-2 h-4 w-4" />
                                <span>{t('client_dashboard_download_photos_menu_item')}</span>
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                             <DropdownMenuLabel>{t('client_dashboard_view_menu_label')}</DropdownMenuLabel>
                            <DropdownMenuItem asChild disabled={!event.paid}>
                               <Link href={`/event/${event.id}/gallery`} target="_blank" rel="noopener noreferrer">
                                <ImageIcon className="mr-2 h-4 w-4" />
                                <span>{t('client_dashboard_view_gallery_menu_item')}</span>
                                </Link>
                            </DropdownMenuItem>
                             <DropdownMenuItem onClick={() => copyToClipboard(`${window.location.origin}/event/${event.id}/slideshow`, "Slideshow")} disabled={!event.paid}>
                                <Share className="mr-2 h-4 w-4" />
                                <span>{t('client_dashboard_share_slideshow_menu_item')}</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild disabled={!event.paid}>
                               <Link href={`/event/${event.id}/slideshow`} target="_blank" rel="noopener noreferrer">
                                <Eye className="mr-2 h-4 w-4" />
                                <span>{t('client_dashboard_live_view_menu_item')}</span>
                                </Link>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </CardFooter>
            </Card>
            ))}
        </div>
        <Dialog open={qrCodeModalOpen} onOpenChange={setQrCodeModalOpen}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{t('client_dashboard_qr_dialog_title')} {activeEventForQr?.name}</DialogTitle>
                    <DialogDescription>
                        {t('client_dashboard_qr_dialog_desc')}
                    </DialogDescription>
                </DialogHeader>
                <div className="flex items-center justify-center p-4">
                    {activeQrCode ? <Image src={activeQrCode} alt="Generated QR Code" width={300} height={300} /> : <p>Generating QR Code...</p>}
                </div>
                <DialogFooter className="sm:justify-center">
                    <a href={activeQrCode} download={`${activeEventForQr?.id}-qr-code.png`}>
                        <Button>
                            <Download className="mr-2 h-4 w-4" />
                            {t('download')}
                        </Button>
                    </a>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </div>
  );
}
