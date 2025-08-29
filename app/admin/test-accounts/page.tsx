
"use client"

import * as React from "react"
import {
  MoreHorizontal,
  PlusCircle,
  Trash2,
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"

const testAccounts = [
  {
    email: "demo-123@example.com",
    eventName: "Summer Festival Gala",
    expires: "in 12 hours",
  },
  {
    email: "demo-456@example.com",
    eventName: "Tech Conference 2024",
    expires: "in 23 hours",
  },
]

export default function TestAccountsPage() {
  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
       <div className="grid flex-1 items-start gap-4">
        <div className="flex items-center">
            <h1 className="text-lg font-semibold md:text-2xl">Test Accounts</h1>
            <div className="ml-auto flex items-center gap-2">
                <Button variant="destructive" size="sm">
                    <Trash2 className="h-3.5 w-3.5" />
                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                    Cleanup Expired
                    </span>
                </Button>
                <Button size="sm">
                    <PlusCircle className="h-3.5 w-3.5" />
                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                    Generate Test Account
                    </span>
                </Button>
            </div>
        </div>
        <Card>
            <CardHeader>
                <CardTitle>Active Demo Accounts</CardTitle>
                <CardDescription>
                    A list of all active test accounts. They are automatically removed after 24 hours.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Event Name</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>
                        <span className="sr-only">Actions</span>
                    </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {testAccounts.map((account) => (
                    <TableRow key={account.email}>
                        <TableCell className="font-medium">{account.email}</TableCell>
                        <TableCell>{account.eventName}</TableCell>
                        <TableCell>{account.expires}</TableCell>
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
                            <DropdownMenuItem>View Event</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">Delete Now</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        </TableCell>
                    </TableRow>
                    ))}
                </TableBody>
                </Table>
            </CardContent>
        </Card>
      </div>
    </main>
  )
}
