
"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import {
    PlusCircle,
    Trash2,
    Users,
    Image as ImageIcon,
    Eye,
    EyeOff,
    Edit,
    MoreVertical,
    QrCode,
    Link as LinkIcon,
    Download,
    Upload,
    Loader2,
    LayoutGrid,
    List,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import QRCode from 'qrcode';

import { Event, getEventsForAdmin, toggleEventPaymentStatus, publishPhotosForEvent, deleteEvent, createEvent } from "@/lib/events"


const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];


export default function Dashboard() {
  const [events, setEvents] = React.useState<Event[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [qrCodeModalOpen, setQrCodeModalOpen] = React.useState(false);
  const [activeQrCode, setActiveQrCode] = React.useState('');
  const [activeEventForQr, setActiveEventForQr] = React.useState<Event | null>(null);
  const [viewMode, setViewMode] = React.useState<'grid' | 'list'>('grid');

  const [eventTypeFilter, setEventTypeFilter] = React.useState("all");
  const [monthFilter, setMonthFilter] = React.useState("all");
  const [yearFilter, setYearFilter] = React.useState("all");

  React.useEffect(() => {
    async function fetchEvents() {
        setLoading(true);
        const fetchedEvents = await getEventsForAdmin();
        setEvents(fetchedEvents);
        setLoading(false);
    }
    fetchEvents();
  }, []);

  const availableYears = React.useMemo(() => {
    const years = new Set(events.map(event => new Date(event.startDate).getFullYear().toString()));
    return Array.from(years).sort((a,b) => parseInt(b) - parseInt(a));
  }, [events]);


  const filteredEvents = React.useMemo(() => {
    return events.filter(event => {
      const eventDate = new Date(event.startDate);
      const eventMonth = eventDate.getMonth();
      const eventYear = eventDate.getFullYear();

      const typeMatch = eventTypeFilter === 'all' || (eventTypeFilter === 'test' && event.isTest) || (eventTypeFilter === 'real' && !event.isTest);
      const monthMatch = monthFilter === 'all' || eventMonth === parseInt(monthFilter);
      const yearMatch = yearFilter === 'all' || eventYear === parseInt(yearFilter);

      return typeMatch && monthMatch && yearMatch;
    });
  }, [events, eventTypeFilter, monthFilter, yearFilter]);

  const categorizedEvents = React.useMemo(() => {
    const now = new Date();
    const active: Event[] = [];
    const upcoming: Event[] = [];
    const archived: Event[] = [];

    filteredEvents.forEach(event => {
        const startDate = new Date(event.startDate);
        const endDate = event.endDate ? new Date(event.endDate) : new Date(startDate.getTime() + 24 * 60 * 60 * 1000);
        
        if (endDate < now) {
            archived.push(event);
        } else if (startDate > now) {
            upcoming.push(event);
        } else {
            active.push(event);
        }
    });

    return { active, upcoming, archived };
  }, [filteredEvents]);
  
  const handleTogglePayment = async (eventId: string, currentStatus: boolean) => {
    // Optimistic update
    setEvents(events => events.map(e => e.id === eventId ? { ...e, paid: !currentStatus } : e));
    
    const result = await toggleEventPaymentStatus(eventId, !currentStatus);
    console.log(`Event marked as ${!currentStatus ? 'Paid' : 'Unpaid'}.`);
    if (!result.success) {
        // Revert on failure
        setEvents(events => events.map(e => e.id === eventId ? { ...e, paid: currentStatus } : e));
        console.error("Could not update payment status.");
    }
  };
  
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

  const handleCleanupTestEvents = () => {
    const testEvents = events.filter(event => event.isTest);
    if(testEvents.length === 0) {
        console.log("No test events to clean up.");
        return;
    }

    const testEventCount = testEvents.length;
    const realEvents = events.filter(event => !event.isTest);
    setEvents(realEvents);

    testEvents.forEach(async event => {
        await deleteEvent(event.id);
    });
    
    console.log(`${testEventCount} test event(s) have been removed.`);
  }

    const EventGrid = ({ events }: { events: Event[] }) => (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
             {events.length > 0 ? (
                events.map((event) => (
                    <Card key={event.id}>
                        <CardHeader className="p-0 relative">
                             <Image
                                alt={event.name}
                                className="aspect-video w-full rounded-t-lg object-cover"
                                height="200"
                                src={event.coverImageUrl || event.coverImage}
                                data-ai-hint="wedding couple"
                                width="400"
                            />
                             <Badge className="absolute top-2 right-2" variant={event.paid ? 'secondary' : 'destructive'}>
                                {event.paid ? "Paid" : "Unpaid"}
                            </Badge>
                             {event.isTest && <Badge className="absolute top-2 left-2" variant="outline">Test</Badge>}
                        </CardHeader>
                        <CardContent className="p-4">
                            <CardTitle className="text-lg font-semibold">{event.name}</CardTitle>
                            <CardDescription className="text-sm">{event.description}</CardDescription>
                             <div className="mt-4 flex justify-between text-xs text-muted-foreground">
                                <div className="flex items-center gap-1">
                                    <Users className="h-3 w-3" />
                                    <span>{event.activeGuests} / {event.maxGuests > 0 ? event.maxGuests : '∞'} Guests</span>
                                </div>
                                <div className="flex items-center gap-1">
                                   <ImageIcon className="h-3 w-3" />
                                    <span>{event.photosTaken} Photos</span>
                                </div>
                            </div>
                            <div className="text-xs text-muted-foreground mt-2">
                              {format(new Date(event.startDate), "PPP")}
                            </div>
                        </CardContent>
                         <CardFooter className="p-4 pt-0 grid grid-cols-2 gap-2">
                             <Button onClick={() => handleTogglePayment(event.id, event.paid)} variant={event.paid ? "destructive" : "default"}>
                                {event.paid ? 'Mark as Unpaid' : 'Mark as Paid'}
                            </Button>
                            <Button onClick={() => handlePublishPhotos(event.id, event.photosPublished)} disabled={!event.paid} variant="outline">
                               {event.photosPublished ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
                               {event.photosPublished ? 'Unpublish' : 'Publish'}
                            </Button>
                            <div className="col-span-2">
                                <EventActions event={event} />
                            </div>
                        </CardFooter>
                    </Card>
                ))
            ) : (
                 <div className="text-center py-8 text-muted-foreground col-span-full">
                    No events match your criteria.
                </div>
            )}
        </div>
    );
    
    const EventList = ({ events }: { events: Event[] }) => (
         <Card>
            <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead className="w-[80px]">Status</TableHead>
                    <TableHead>Event</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                {events.length > 0 ? events.map((event) => (
                    <TableRow key={event.id}>
                        <TableCell>
                           <Badge variant={event.paid ? 'secondary' : 'destructive'}>
                                {event.paid ? "Paid" : "Unpaid"}
                            </Badge>
                        </TableCell>
                        <TableCell>
                            <div className="font-medium">{event.name}</div>
                            <div className="text-sm text-muted-foreground">{event.isTest ? "Test Event" : "Real Event"}</div>
                        </TableCell>
                        <TableCell>{event.owner}</TableCell>
                        <TableCell>{format(new Date(event.startDate), 'PPP')}</TableCell>
                        <TableCell className="text-right">
                           <EventActions event={event} />
                        </TableCell>
                    </TableRow>
                )) : (
                    <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">
                            No events match your criteria.
                        </TableCell>
                    </TableRow>
                )}
                </TableBody>
            </Table>
        </Card>
    );

    const EventActions = ({ event }: { event: Event }) => (
         <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4"/>
                    <span className="sr-only">Manage Event</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Manage</DropdownMenuLabel>
                <DropdownMenuItem asChild>
                    <Link href={`/admin/events/${event.id}/edit`}>
                    <Edit className="mr-2 h-4 w-4" />
                    <span>Edit Details</span>
                    </Link>
                </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handlePublishPhotos(event.id, event.photosPublished)} disabled={!event.paid}>
                        {event.photosPublished ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
                        <span>{event.photosPublished ? 'Unpublish Gallery' : 'Publish Gallery'}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleTogglePayment(event.id, event.paid)}>
                         <span>{event.paid ? 'Mark as Unpaid' : 'Mark as Paid'}</span>
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
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex items-center">
        <h1 className="text-lg font-semibold md:text-2xl">Admin Dashboard</h1>
        <div className="ml-auto flex items-center gap-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-1">
                  <Trash2 className="h-3.5 w-3.5" />
                  <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                    Cleanup Test Events
                  </span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently remove all events marked as 'Test'. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleCleanupTestEvents}>Continue</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          <Button size="sm" className="h-8 gap-1" asChild>
            <Link href="/admin/events/new">
              <PlusCircle className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                New Event
              </span>
            </Link>
          </Button>

        </div>
      </div>
      <Tabs defaultValue="active">
        <div className="flex items-center">
          <TabsList>
            <TabsTrigger value="active">Active ({categorizedEvents.active.length})</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming ({categorizedEvents.upcoming.length})</TabsTrigger>
            <TabsTrigger value="archived">Archived ({categorizedEvents.archived.length})</TabsTrigger>
          </TabsList>
           <div className="ml-auto flex items-center gap-2">
             <div className="hidden items-center gap-2 md:flex">
                <Button variant={viewMode === 'grid' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('grid')}><LayoutGrid className="h-4 w-4" /></Button>
                <Button variant={viewMode === 'list' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('list')}><List className="h-4 w-4" /></Button>
            </div>
            <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
              <SelectTrigger className="h-8 w-[160px]">
                <SelectValue placeholder="Filter by Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Events</SelectItem>
                <SelectItem value="real">Real Events</SelectItem>
                <SelectItem value="test">Test Events</SelectItem>
              </SelectContent>
            </Select>
            <Select value={monthFilter} onValueChange={setMonthFilter}>
              <SelectTrigger className="h-8 w-[140px]">
                <SelectValue placeholder="Filter by Month" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Months</SelectItem>
                {monthNames.map((month, index) => (
                  <SelectItem key={index} value={index.toString()}>{month}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={yearFilter} onValueChange={setYearFilter}>
              <SelectTrigger className="h-8 w-[120px]">
                <SelectValue placeholder="Filter by Year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                {availableYears.map(year => (
                  <SelectItem key={year} value={year}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
         <div className="mt-4">
            {loading ? (
                <div className="text-center py-8 text-muted-foreground col-span-full"><Loader2 className="h-8 w-8 animate-spin mx-auto" /></div>
            ) : (
            <>
                <TabsContent value="active">
                    {viewMode === 'grid' ? <EventGrid events={categorizedEvents.active} /> : <EventList events={categorizedEvents.active} />}
                </TabsContent>
                <TabsContent value="upcoming">
                    {viewMode === 'grid' ? <EventGrid events={categorizedEvents.upcoming} /> : <EventList events={categorizedEvents.upcoming} />}
                </TabsContent>
                <TabsContent value="archived">
                    {viewMode === 'grid' ? <EventGrid events={categorizedEvents.archived} /> : <EventList events={categorizedEvents.archived} />}
                </TabsContent>
            </>
            )}
        </div>
      </Tabs>

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

    </main>
  )
}
