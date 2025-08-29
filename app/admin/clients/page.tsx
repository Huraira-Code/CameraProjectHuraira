"use client"

import * as React from "react"
import {
  MoreHorizontal,
  PlusCircle,
  File,
  Loader2,
  LogIn,
  KeyRound,
} from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { db } from "@/lib/firebase"
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore"
import { sendPasswordResetEmail, createImpersonationToken } from "@/lib/auth-actions"
import { createClient } from "./actions"

type Client = {
  id: string; // The document ID, which is the email
  name: string;
  email: string;
  role: "Client";
  eventLimit: number;
};

export default function ClientsPage() {
    const [clients, setClients] = React.useState<Client[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [openDialog, setOpenDialog] = React.useState(false);
    const [dialogType, setDialogType] = React.useState<"add" | "edit">("add");

    const [selectedClient, setSelectedClient] = React.useState<Client | null>(null);
    
    // Form state for dialogs
    const [name, setName] = React.useState("");
    const [email, setEmail] = React.useState("");
    const [password, setPassword] = React.useState("");
    const [eventLimit, setEventLimit] = React.useState(1);
    const [dialogError, setDialogError] = React.useState<string | null>(null);

    const [saving, setSaving] = React.useState(false);

    React.useEffect(() => {
        const fetchClients = async () => {
            setLoading(true);
            try {
                const clientsQuery = query(collection(db, "staff"), where("role", "==", "Client"));
                const querySnapshot = await getDocs(clientsQuery);
                const clientsList = querySnapshot.docs.map(doc => ({ ...doc.data() as Omit<Client, 'id'>, id: doc.id }));
                setClients(clientsList);
            } catch (error) {
                console.error("Error fetching clients:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchClients();
    }, []);

    const resetDialogState = () => {
        setName("");
        setEmail("");
        setPassword("");
        setEventLimit(1);
        setDialogError(null);
        setSelectedClient(null);
    }
    
    const handleAddNew = () => {
        resetDialogState();
        setDialogType("add");
        setOpenDialog(true);
    };

    const handleEdit = (client: Client) => {
        resetDialogState();
        setSelectedClient(client);
        setName(client.name);
        setEventLimit(client.eventLimit);
        setDialogType("edit");
        setOpenDialog(true);
    };

    const handleSaveChanges = async () => {
        if (dialogType === 'edit') {
            await handleUpdateClient();
        } else {
            await handleCreateClient();
        }
    }
    
    const handleCreateClient = async () => {
        if (!name || !email || !password) {
            setDialogError("Name, email and password are required.");
            return;
        }
        setSaving(true);
        setDialogError(null);

        const result = await createClient({ name, email, password, eventLimit });

        if (result.success && result.client) {
            setClients([...clients, result.client]);
            console.log("Client created successfully.");
            setOpenDialog(false);
        } else {
            setDialogError(result.error || "Failed to create client.");
        }
        setSaving(false);
    }

    const handleUpdateClient = async () => {
        if (!selectedClient) return;
        setSaving(true);
        try {
            const clientRef = doc(db, "staff", selectedClient.id);
            await updateDoc(clientRef, { eventLimit: eventLimit });
            setClients(clients.map(c => c.id === selectedClient.id ? { ...c, eventLimit: eventLimit, name: name } : c));
            console.log(`Event limit for ${selectedClient.name} updated.`);
            setOpenDialog(false);
        } catch (error) {
            console.error("Error updating event limit:", error);
        } finally {
            setSaving(false);
        }
    };

    const handleSendResetLink = async (email: string) => {
        setSaving(true);
        const result = await sendPasswordResetEmail(email);
        if (result.success) {
            console.log("Password reset email sent successfully.");
        } else {
            console.error("Failed to send password reset email.");
        }
        setSaving(false);
    }
    
    const handleImpersonate = async (clientEmail: string) => {
        setSaving(true);
        try {
            const result = await createImpersonationToken(clientEmail);
            if(result.success && result.token) {
                 // Store the token in localStorage
                localStorage.setItem('impersonationToken', result.token);
                // Open the dashboard in a new tab
                window.open('/client/dashboard', '_blank');
            } else {
                 console.error(result.error || "Failed to get impersonation token.");
            }
        } catch (error) {
            console.error("Error during impersonation:", error);
        } finally {
            setSaving(false);
        }
    }
    
    const handleExport = () => {
        if (clients.length === 0) {
            console.log("No clients to export.");
            return;
        }

        const headers = ["Name", "Email", "Role", "Event Limit"];
        const csvRows = [
            headers.join(','),
            ...clients.map(client => 
                [
                    `"${client.name.replace(/"/g, '""')}"`,
                    client.email,
                    client.role,
                    client.eventLimit
                ].join(',')
            )
        ];

        const csvString = csvRows.join('\r\n');
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `clients-export-${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };


  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
       <div className="grid flex-1 items-start gap-4">
        <div className="flex items-center">
            <h1 className="text-lg font-semibold md:text-2xl">Clients</h1>
            <div className="ml-auto flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleExport}>
                    <File className="h-3.5 w-3.5" />
                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                    Export
                    </span>
                </Button>
                <Button size="sm" onClick={handleAddNew}>
                    <PlusCircle className="h-3.5 w-3.5" />
                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                    Add Client
                    </span>
                </Button>
            </div>
        </div>
        
            <Card>
                <CardHeader>
                    <CardTitle>Client Overview</CardTitle>
                    <CardDescription>
                        A list of all clients with their own events.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                {loading ? <div className="text-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div> : (
                   <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead className="text-right">Event Limit</TableHead>
                        <TableHead>
                            <span className="sr-only">Actions</span>
                        </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {clients.map((client) => (
                        <TableRow key={client.email}>
                            <TableCell className="font-medium">{client.name}</TableCell>
                            <TableCell>{client.email}</TableCell>
                            <TableCell>
                                <Badge variant="outline">{client.role}</Badge>
                            </TableCell>
                            <TableCell className="text-right">{client.eventLimit}</TableCell>
                            <TableCell>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                <Button
                                    aria-haspopup="true"
                                    size="icon"
                                    variant="ghost"
                                >
                                    <MoreHorizontal className="h-4 w-4" />
                                    <span className="sr-only">Toggle menu</span>
                                </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => handleEdit(client)}>Edit</DropdownMenuItem>
                                 <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleSendResetLink(client.email)} disabled={saving}>
                                    <KeyRound className="mr-2 h-4 w-4" />
                                    Send Password Reset
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleImpersonate(client.email)} disabled={saving}>
                                    <LogIn className="mr-2 h-4 w-4" />
                                    Login as Client
                                </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                            </TableCell>
                        </TableRow>
                        ))}
                    </TableBody>
                    </Table>
                )}
                </CardContent>
            </Card>
      </div>

       <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{dialogType === 'edit' ? `Edit Client: ${selectedClient?.name}` : 'Add New Client'}</DialogTitle>
            <DialogDescription>
              {dialogType === 'edit' ? "Update the client's details." : "Enter the details for the new client."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
             <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
             </div>
              {dialogType === 'add' && (
                <>
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                    </div>
                </>
              )}
             <div className="space-y-2">
                <Label htmlFor="event-limit">Event Limit</Label>
                <Input 
                    id="event-limit" 
                    type="number" 
                    value={eventLimit} 
                    onChange={(e) => setEventLimit(parseInt(e.target.value, 10))}
                />
            </div>
             {dialogError && <p className="text-sm text-destructive col-span-4 text-center">{dialogError}</p>}
          </div>
          <DialogFooter>
            <Button onClick={handleSaveChanges} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  )
}
