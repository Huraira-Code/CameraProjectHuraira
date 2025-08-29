
"use client"

import * as React from "react"
import {
  MoreHorizontal,
  PlusCircle,
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
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { collection, getDocs, doc, setDoc, writeBatch } from "firebase/firestore"
import { db } from "@/lib/firebase"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { deleteUserAndData } from "./actions"

const initialStaff = [
  {
    id: "admin@wegwerpcamera.nl",
    name: "Admin User",
    email: "admin@wegwerpcamera.nl",
    role: "Admin",
    eventLimit: 999,
  },
  {
    id: "renekatier@gmail.com",
    name: "René Katier",
    email: "renekatier@gmail.com",
    role: "Admin",
    eventLimit: 999,
  },
]

type StaffMember = {
  id: string;
  name: string;
  email: string;
  role: "Admin" | "Client";
  eventLimit: number;
};


export default function StaffPage() {
  const [staff, setStaff] = React.useState<StaffMember[]>([])
  const [open, setOpen] = React.useState(false)
  const [selectedStaff, setSelectedStaff] = React.useState<StaffMember | null>(null)
  const [name, setName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [role, setRole] = React.useState<"Admin" | "Client">("Client")
  const [eventLimit, setEventLimit] = React.useState(1)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    const fetchStaff = async () => {
      setLoading(true);
      try {
        const staffCollectionRef = collection(db, "staff");
        const querySnapshot = await getDocs(staffCollectionRef);
        
        if (querySnapshot.empty) {
            // Seed initial data if collection is empty
            const batch = writeBatch(db);
            initialStaff.forEach(member => {
                const docRef = doc(staffCollectionRef, member.email);
                batch.set(doc(staffCollectionRef, member.email), { name: member.name, email: member.email, role: member.role, eventLimit: member.eventLimit });
            });
            await batch.commit();
            setStaff(initialStaff);
            console.log("Staff collection seeded");
        } else {
            const staffList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as StaffMember[];
            setStaff(staffList);
        }
      } catch (error) {
        console.error("Error fetching staff:", error);
        console.error("Could not fetch staff data.");
      } finally {
        setLoading(false);
      }
    };
    fetchStaff();
  }, []);


  const handleEdit = (member: StaffMember) => {
    setSelectedStaff(member)
    setName(member.name)
    setEmail(member.email)
    setRole(member.role)
    setEventLimit(member.eventLimit)
    setOpen(true)
  }
  
  const handleAddNew = () => {
    setSelectedStaff(null)
    setName("")
    setEmail("")
    setRole("Client")
    setEventLimit(1)
    setOpen(true)
  }

  const handleSaveChanges = async () => {
    if (!email) {
      console.error("Email is required.");
      return;
    }
    try {
        const staffRef = doc(db, "staff", email);
        const newStaffMember = { name, email, role, eventLimit };
        await setDoc(staffRef, newStaffMember, { merge: true });

        if (selectedStaff) {
             setStaff(staff.map(member => 
                member.id === selectedStaff.id ? { ...newStaffMember, id: email } : member
            ));
        } else {
            setStaff([...staff, { ...newStaffMember, id: email }]);
        }
        console.log("Staff member saved.");
    } catch (error) {
        console.error("Error saving staff member:", error);
        console.error("Could not save staff member.");
    } finally {
        setOpen(false)
    }
  }

  const handleDelete = async (userEmail: string) => {
      setLoading(true);
      const result = await deleteUserAndData(userEmail);
      if (result.success) {
          setStaff(staff.filter(member => member.email !== userEmail));
          console.log(`User ${userEmail} and all their data has been deleted.`);
      } else {
          console.error(result.error || `Failed to delete user ${userEmail}.`);
      }
      setLoading(false);
  }


  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
       <div className="grid flex-1 items-start gap-4">
        <div className="flex items-center">
            <h1 className="text-lg font-semibold md:text-2xl">Staff & Clients</h1>
            <div className="ml-auto flex items-center gap-2">
                <Button size="sm" onClick={handleAddNew}>
                    <PlusCircle className="h-3.5 w-3.5" />
                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                    Add User
                    </span>
                </Button>
            </div>
        </div>
        <Card>
            <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>
                    Manage internal staff and external clients.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {loading ? <p>Loading users...</p> : (
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
                    {staff.map((member) => (
                    <TableRow key={member.id}>
                        <TableCell className="font-medium">{member.name}</TableCell>
                        <TableCell>{member.email}</TableCell>
                        <TableCell>
                          <Badge variant={member.role === 'Admin' ? 'default' : 'secondary'}>{member.role}</Badge>
                        </TableCell>
                        <TableCell className="text-right">{member.eventLimit}</TableCell>
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
                            <DropdownMenuItem onClick={() => handleEdit(member)}>Edit</DropdownMenuItem>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <DropdownMenuItem className="text-destructive" onSelect={(e) => e.preventDefault()}>Delete User & Data</DropdownMenuItem>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This action cannot be undone. This will permanently delete the user '{member.name}' ({member.email}), all of their associated events, and all photos within those events.
                                    </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDelete(member.email)}>Continue & Delete All Data</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
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
       <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{selectedStaff ? "Edit User" : "Add User"}</DialogTitle>
            <DialogDescription>
              {selectedStaff ? "Update the details of the user." : "Enter the details of the new user."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="col-span-3" disabled={!!selectedStaff} />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="role" className="text-right">
                    Role
                </Label>
                 <Select value={role} onValueChange={(value: "Admin" | "Client") => setRole(value)}>
                    <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Client">Client</SelectItem>
                        <SelectItem value="Admin">Admin</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="event-limit" className="text-right">
                Event Limit
              </Label>
              <Input id="event-limit" type="number" value={eventLimit} onChange={(e) => setEventLimit(parseInt(e.target.value, 10))} className="col-span-3" />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" onClick={handleSaveChanges}>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  )
}
