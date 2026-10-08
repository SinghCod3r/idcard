"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"
import { School } from "@/types"

const formSchema = z.object({
  name: z.string().min(2, {
    message: "School name must be at least 2 characters.",
  }),
  code: z.string().min(2, {
    message: "School code must be at least 2 characters.",
  }).toUpperCase(),
  contact_email: z.string().email().optional().or(z.literal("")),
  contact_phone: z.string().optional(),
  address: z.string().optional(),
})

interface SchoolFormProps {
  initialData?: School
}

export function SchoolForm({ initialData }: SchoolFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || "",
      code: initialData?.code || "",
      contact_email: initialData?.contact_email || "",
      contact_phone: initialData?.contact_phone || "",
      address: initialData?.address || "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true)
    setError(null)

    const supabase = createClient()

    try {
      if (initialData) {
        // Update
        const { error } = await supabase
          .from("schools")
          .update({
            ...values,
            contact_email: values.contact_email || null,
          })
          .eq("id", initialData.id)

        if (error) throw error
      } else {
        // Create
        const { error } = await supabase
          .from("schools")
          .insert({
            ...values,
            contact_email: values.contact_email || null,
          })

        if (error) throw error
      }

      router.push("/dashboard/schools")
      router.refresh()
    } catch (e: any) {
      if (e.code === '23505') {
        setError("A school with this code already exists.")
      } else {
        setError(e.message || "An error occurred while saving the school.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-white p-6 rounded-lg border">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>School Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Springfield High" disabled={isLoading} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>School Code *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. SPHS" disabled={isLoading} {...field} />
                  </FormControl>
                  <FormDescription>
                    A unique short code for this school.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="contact_email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Email</FormLabel>
                  <FormControl>
                    <Input placeholder="admin@springfield.edu" type="email" disabled={isLoading} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="contact_phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Phone</FormLabel>
                  <FormControl>
                    <Input placeholder="+1 234 567 8900" disabled={isLoading} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Address</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Full school address" 
                    className="resize-none" 
                    disabled={isLoading} 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {error && (
            <div className="p-3 bg-red-50 text-red-500 text-sm rounded-md font-medium border border-red-200">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/dashboard/schools")}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {initialData ? "Save Changes" : "Create School"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}

