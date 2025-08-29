
"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import {
    PlusCircle,
    Users,
    Image as ImageIcon,
    Loader2,
    LayoutGrid,
    List,
    MoreVertical,
    QrCode,
    Link as LinkIcon,
    Upload,
    Download,
    Eye,
    Edit,
    Trash2,
    EyeOff
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { useAuth } from "@/lib/auth";
import { getEventsForAdmin, Event, deleteEvent, publishPhotosForEvent } from "@/lib/events";
import { useLocale } from "@/lib/locale";
import { format } from "date-fns";
import QRCode from 'qrcode';


export default function PartnerDashboard() {
  const { user, partner } = useAuth();
  const { t } = useLocale();
  const [events, setEvents] = React.useState<Event[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [viewMode, setViewMode] = React.useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = React.useState<'newest' | 'oldest' | 'name'>('newest');

  const [qrCodeModalOpen, setQrCodeModalOpen] = React.useState(false);
  const [activeQrCode, setActiveQrCode] = React.useState('');
  const [activeEventForQr, setActiveEventForQr] = React.useState<Event | null>(null);

  const primaryColor = partner?.branding?.primaryColor || 'hsl(var(--primary))';

  React.useEffect(() => {
    async function fetchEvents() {
        if (!user || !user.email) {
            setLoading(false);
            return;
        };
        setLoading(true);
        // This fetches all events, we filter for the partner on the client-side.
        const allEvents = await getEventsForAdmin(); 
        const partnerEvents = allEvents.filter(event => event.partnerId === user.email);
        setEvents(partnerEvents);
        setLoading(false);
    }
    fetchEvents();
  }, [user]);
  
  const handlePublishPhotos = async (eventId: string, currentStatus: boolean) => {
    setEvents(events => events.map(e => e.id === eventId ? { ...e, photosPublished: !currentStatus } : e));
    const result = await publishPhotosForEvent(eventId, currentStatus);
     console.log(`Photos are now ${!currentStatus ? 'public' : 'private'}.`);
     if (!result.success) {
        setEvents(events => events.map(e => e.id === eventId ? { ...e, photosPublished: currentStatus } : e));
        console.error("Could not update photo gallery status.");
    }
  }

  const handleDeleteEvent = async (eventId: string) => {
     const originalEvents = events;
     setEvents(events => events.filter(e => e.id !== eventId));
     const result = await deleteEvent(eventId);
     console.log("The event and all its data have been removed.");
     if (!result.success) {
        setEvents(originalEvents);
        console.error("Could not delete the event.");
     }
  }
  
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

  const sortedEvents = React.useMemo(() => {
    return [...events].sort((a, b) => {
        switch (sortBy) {
            case 'oldest':
                return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
            case 'name':
                return a.name.localeCompare(b.name);
            case 'newest':
            default:
                return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
        }
    });
  }, [events, sortBy]);

  if (loading) {
    return <div className="text-center p-8"><Loader2 className="h-8 w-8 animate-spin mx-auto" /></div>;
  }
  
  if (events.length === 0) {
      return (
         <div className="text-center p-8 border-dashed border-2 rounded-lg">
            <h2 className="text-2xl font-semibold">No Events Found</h2>
            <p className="text-muted-foreground mt-2">Get started by creating your first event for a client.</p>
            <Button asChild className="mt-4" style={{ backgroundColor: primaryColor }}>
                <Link href="/partner/events/new">
                    <PlusCircle className="mr-2 h-4 w-4" /> Create Event
                </Link>
            </Button>
        </div>
      );
  }

  const EventActions = ({ event }: { event: Event }) => (
    <DropdownMenu>
        <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full">
                <MoreVertical className="mr-2 h-4 w-4"/> Manage & Share
            </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Manage</DropdownMenuLabel>
            <DropdownMenuItem asChild>
                <Link href={`/partner/events/${event.id}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                <span>Edit Details</span>
                </Link>
            </DropdownMenuItem>
             <AlertDialog>
                <AlertDialogTrigger asChild>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:bg-destructive focus:text-destructive-foreground">
                        <Trash2 className="mr-2 h-4 w-4" />
                        <span>Delete Event</span>
                    </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This will permanently delete the event "{event.name}" and all associated data. This action cannot be undone.
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleDeleteEvent(event.id)} className="bg-destructive hover:bg-destructive/90">Yes, delete it</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Share & Access</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => handleShowQrCode(event)}>
                <QrCode className="mr-2 h-4 w-4" />
                <span>Get QR Code</span>
            </DropdownMenuItem>
             <DropdownMenuItem onClick={() => copyToClipboard(`${window.location.origin}/event/welcome?eventId=${event.id}`, "Camera")}>
                <LinkIcon className="mr-2 h-4 w-4" />
                <span>Copy Camera Link</span>
            </DropdownMenuItem>
             <DropdownMenuItem onClick={() => copyToClipboard(`${window.location.origin}/event/${event.id}/upload`, "Upload")}>
                <Upload className="mr-2 h-4 w-4" />
                <span>Copy Upload Link</span>
            </DropdownMenuItem>
             <DropdownMenuItem asChild>
              <Link href={`/event/${event.id}/download`} target="_blank" rel="noopener noreferrer">
                <Download className="mr-2 h-4 w-4" />
                <span>Download All Photos</span>
                </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
             <DropdownMenuItem asChild>
              <Link href={`/event/${event.id}/slideshow`} target="_blank" rel="noopener noreferrer">
                <Eye className="mr-2 h-4 w-4" />
                <span>View Slideshow</span>
              </Link>
            </DropdownMenuItem>
        </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <div>
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <h1 className="text-3xl font-bold font-headline">Partner Dashboard</h1>
            <div className="flex items-center gap-2 flex-wrap">
                <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Sort by..." />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="newest">Sort by: Newest</SelectItem>
                        <SelectItem value="oldest">Sort by: Oldest</SelectItem>
                        <SelectItem value="name">Sort by: Name</SelectItem>
                    </SelectContent>
                </Select>
                <div className="flex items-center gap-2">
                    <Button variant={viewMode === 'grid' ? 'secondary' : 'outline'} size="icon" onClick={() => setViewMode('grid')}>
                        <LayoutGrid className="h-4 w-4" />
                        <span className="sr-only">Grid View</span>
                    </Button>
                     <Button variant={viewMode === 'list' ? 'secondary' : 'outline'} size="icon" onClick={() => setViewMode('list')}>
                        <List className="h-4 w-4" />
                        <span className="sr-only">List View</span>
                    </Button>
                </div>
                <Button asChild style={{ backgroundColor: primaryColor }}>
                    <Link href="/partner/events/new">
                        <PlusCircle className="mr-2 h-4 w-4" /> Create Event
                    </Link>
                </Button>
            </div>
        </div>

        {viewMode === 'grid' ? (
             <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
                {sortedEvents.map((event: Event) => (
                <Card key={event.id} className="flex flex-col">
                    <CardHeader className="p-0 relative">
                        <Image
                            alt={event.name}
                            className="aspect-video w-full rounded-t-lg object-cover"
                            height="300"
                            src={event.coverImageUrl || event.coverImage}
                            data-ai-hint="wedding couple"
                            width="600"
                        />
                         <Badge className="absolute top-4 right-4" variant={event.paid ? 'secondary' : 'destructive'}>
                            {event.paid ? "Paid" : "Unpaid"}
                        </Badge>
                    </CardHeader>
                    <CardContent className="p-6 flex-grow">
                        <CardTitle className="font-headline mb-2">{event.name}</CardTitle>
                        <CardDescription className="mb-4">
                        Owned by: <span className="font-medium">{event.owner}</span>
                        </CardDescription>
                        
                        <div className="flex justify-around text-center text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                <span>{event.activeGuests} / {event.maxGuests > 0 ? event.maxGuests : '∞'} Guests</span>
                            </div>
                            <div className="flex items-center gap-2">
                            <ImageIcon className="h-4 w-4" />
                                <span>{event.photosTaken} Photos Taken</span>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="p-6 pt-0 grid grid-cols-2 gap-2">
                        <Button onClick={() => handlePublishPhotos(event.id, event.photosPublished)} variant="outline">
                           {event.photosPublished ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
                           {event.photosPublished ? 'Unpublish' : 'Publish'}
                        </Button>
                        <EventActions event={event} />
                    </CardFooter>
                </Card>
                ))}
            </div>
        ) : (
             <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Event Name</TableHead>
                                <TableHead>Client / Owner</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead className="text-center">Published</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                             {sortedEvents.map((event) => (
                                <TableRow key={event.id}>
                                    <TableCell className="font-medium">{event.name}</TableCell>
                                    <TableCell>{event.owner}</TableCell>
                                    <TableCell>{format(new Date(event.startDate), 'PPP')}</TableCell>
                                    <TableCell className="text-center">
                                       <Badge variant={event.photosPublished ? 'secondary' : 'outline'}>
                                         {event.photosPublished ? "Yes" : "No"}
                                       </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button size="sm" variant="ghost">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-56">
                                                <DropdownMenuLabel>Manage</DropdownMenuLabel>
                                                 <DropdownMenuItem asChild>
                                                    <Link href={`/partner/events/${event.id}/edit`}>
                                                    <Edit className="mr-2 h-4 w-4" />
                                                    <span>Edit Details</span>
                                                    </Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handlePublishPhotos(event.id, event.photosPublished)}>
                                                    {event.photosPublished ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
                                                    <span>{event.photosPublished ? 'Unpublish' : 'Publish'}</span>
                                                </DropdownMenuItem>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:bg-destructive focus:text-destructive-foreground">
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            <span>Delete Event</span>
                                                        </DropdownMenuItem>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            This will permanently delete the event "{event.name}" and all associated data. This action cannot be undone.
                                                        </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleDeleteEvent(event.id)} className="bg-destructive hover:bg-destructive/90">Yes, delete it</AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuLabel>Share & Access</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => handleShowQrCode(event)}>
                                                    <QrCode className="mr-2 h-4 w-4" />
                                                    <span>Get QR Code</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => copyToClipboard(`${window.location.origin}/event/${event.id}/slideshow`, "Slideshow")}>
                                                    <LinkIcon className="mr-2 h-4 w-4" />
                                                    <span>Copy Slideshow Link</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem asChild>
                                                <Link href={`/event/${event.id}/download`} target="_blank" rel="noopener noreferrer">
                                                    <Download className="mr-2 h-4 w-4" />
                                                    <span>Download All Photos</span>
                                                    </Link>
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                             ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        )}
        <Dialog open={qrCodeModalOpen} onOpenChange={setQrCodeModalOpen}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>QR Code for {activeEventForQr?.name}</DialogTitle>
                    <DialogDescription>
                        Guests can scan this code to access the event camera.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex items-center justify-center p-4">
                    {activeQrCode ? <Image src={activeQrCode} alt="Generated QR Code" width={300} height={300} /> : <p>Generating QR Code...</p>}
                </div>
                <DialogFooter className="sm:justify-center">
                    <a href={activeQrCode} download={`${activeEventForQr?.id}-qr-code.png`}>
                        <Button>
                            <Download className="mr-2 h-4 w-4" />
                            Download
                        </Button>
                    </a>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </div>
  );
}
