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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"

const formSchema = z.object({
  school_id: z.string().uuid({ message: "Please select a school." }),
  academic_session_id: z.string().uuid({ message: "Please select an academic session." }),
  class_id: z.string().uuid({ message: "Please select a class." }),
  section_id: z.string().uuid().optional().or(z.literal("")),
  full_name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  admission_number: z.string().min(1, { message: "Admission number is required." }),
  date_of_birth: z.string().optional().or(z.literal("")),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional().or(z.literal("")),
  blood_group: z.string().optional().or(z.literal("")),
  father_name: z.string().optional().or(z.literal("")),
  mother_name: z.string().optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
})

interface StudentFormProps {
  schools: any[]
}

export function StudentForm({ schools }: StudentFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  
  // Dependent dropdown data
  const [sessions, setSessions] = React.useState<any[]>([])
  const [classes, setClasses] = React.useState<any[]>([])
  const [sections, setSections] = React.useState<any[]>([])

  const supabase = createClient()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      school_id: schools.length === 1 ? schools[0].id : "",
      full_name: "",
      admission_number: "",
    },
  })

  const watchSchool = form.watch("school_id")
  const watchClass = form.watch("class_id")

  // Fetch sessions and classes when school changes
  React.useEffect(() => {
    if (!watchSchool) {
      setSessions([])
      setClasses([])
      return
    }

    const fetchData = async () => {
      const [{ data: sData }, { data: cData }] = await Promise.all([
        supabase.from("academic_sessions").select("*").eq("school_id", watchSchool).eq("is_active", true),
        supabase.from("classes").select("*").eq("school_id", watchSchool).order("order_index")
      ])
      setSessions(sData || [])
      setClasses(cData || [])
    }
    
    fetchData()
  }, [watchSchool, supabase])

  // Fetch sections when class changes
  React.useEffect(() => {
    if (!watchClass) {
      setSections([])
      return
    }

    const fetchSections = async () => {
      const { data } = await supabase.from("sections").select("*").eq("class_id", watchClass)
      setSections(data || [])
    }

    fetchSections()
  }, [watchClass, supabase])

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true)
    setError(null)

    try {
      const { data: userResp } = await supabase.auth.getUser()
      
      const insertData = {
        ...values,
        date_of_birth: values.date_of_birth || null,
        gender: values.gender || null,
        section_id: values.section_id || null,
        created_by: userResp?.user?.id
      }

      const { error } = await supabase
        .from("students")
        .insert(insertData)

      if (error) throw error

      router.push("/dashboard/students")
      router.refresh()
    } catch (e: any) {
      if (e.code === '23505') {
        setError("A student with this admission number already exists in this session.")
      } else {
        setError(e.message || "An error occurred while saving.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-white p-6 rounded-lg border">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          
          {/* Academic Section */}
          <div>
            <h3 className="text-lg font-medium mb-4 pb-2 border-b">Academic Placement</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <FormField
                control={form.control}
                name="school_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>School *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading || schools.length === 1}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select school" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {schools.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="academic_session_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Session *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading || !watchSchool || sessions.length === 0}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select session" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {sessions.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="class_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Class *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading || !watchSchool || classes.length === 0}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select class" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="section_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Section</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading || !watchClass || sections.length === 0}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select section" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {sections.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Personal Details */}
          <div>
            <h3 className="text-lg font-medium mb-4 pb-2 border-b">Student Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="full_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" disabled={isLoading} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="admission_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Admission Number *</FormLabel>
                    <FormControl>
                      <Input placeholder="ADM-2023-001" disabled={isLoading} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="date_of_birth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date of Birth</FormLabel>
                    <FormControl>
                      <Input type="date" disabled={isLoading} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gender</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="MALE">Male</SelectItem>
                        <SelectItem value="FEMALE">Female</SelectItem>
                        <SelectItem value="OTHER">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="blood_group"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Blood Group</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. O+" disabled={isLoading} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="+1 234 567 8900" disabled={isLoading} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-500 text-sm rounded-md font-medium border border-red-200">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/dashboard/students")}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save & Next (Photo)
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}

