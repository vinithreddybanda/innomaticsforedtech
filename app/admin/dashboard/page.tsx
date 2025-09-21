"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash2, BarChart3, FileText, Users, LogOut, Search, Filter } from "lucide-react"
import { useRouter } from "next/navigation"
import { AgCharts } from "ag-charts-react"
import type { AgChartOptions } from "ag-charts-community"

interface Job {
  id: string
  title: string
  description: string
  jd_file_url: string
  jd_file_name: string
  created_at: string
}

interface Application {
  id: string
  job_id: string
  full_name: string
  resume_file_url: string
  resume_file_name: string
  score: number
  verdict: string
  matched_skills: string[]
  missing_skills: string[]
  created_at: string
  jobs: { title: string }
}

export default function AdminDashboard() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [applications, setApplications] = useState<Application[]>([])
  const [filteredApplications, setFilteredApplications] = useState<Application[]>([])
  const [newJobTitle, setNewJobTitle] = useState("")
  const [newJobDescription, setNewJobDescription] = useState("")
  const [newJobFile, setNewJobFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showAddJob, setShowAddJob] = useState(false)

  const [searchTerm, setSearchTerm] = useState("")
  const [verdictFilter, setVerdictFilter] = useState("all")
  const [jobFilter, setJobFilter] = useState("all")
  const [scoreFilter, setScoreFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("all")

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // Check admin session
    const adminSession = localStorage.getItem("admin_session")
    if (!adminSession) {
      router.push("/admin/login")
      return
    }

    fetchJobs()
    fetchApplications()
  }, [])

  useEffect(() => {
    filterApplications()
  }, [applications, searchTerm, verdictFilter, jobFilter, scoreFilter, dateFilter])

  const fetchJobs = async () => {
    const { data, error } = await supabase.from("jobs").select("*").order("created_at", { ascending: false })

    if (data) {
      setJobs(data)
    }
  }

  const fetchApplications = async () => {
    const { data, error } = await supabase
      .from("applications")
      .select(`
        *,
        jobs (title)
      `)
      .order("created_at", { ascending: false })

    if (data) {
      setApplications(data)
    }
  }

  const filterApplications = () => {
    let filtered = applications

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (app) =>
          app.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          app.jobs.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          app.matched_skills.some((skill) => skill.toLowerCase().includes(searchTerm.toLowerCase())) ||
          app.missing_skills.some((skill) => skill.toLowerCase().includes(searchTerm.toLowerCase())),
      )
    }

    // Verdict filter
    if (verdictFilter !== "all") {
      filtered = filtered.filter((app) => app.verdict === verdictFilter)
    }

    // Job filter
    if (jobFilter !== "all") {
      filtered = filtered.filter((app) => app.job_id === jobFilter)
    }

    // Score filter
    if (scoreFilter !== "all") {
      if (scoreFilter === "high") {
        filtered = filtered.filter((app) => app.score >= 80)
      } else if (scoreFilter === "medium") {
        filtered = filtered.filter((app) => app.score >= 50 && app.score < 80)
      } else if (scoreFilter === "low") {
        filtered = filtered.filter((app) => app.score < 50)
      }
    }

    // Date filter
    if (dateFilter !== "all") {
      const now = new Date()
      const filterDate = new Date()

      if (dateFilter === "today") {
        filterDate.setHours(0, 0, 0, 0)
      } else if (dateFilter === "week") {
        filterDate.setDate(now.getDate() - 7)
      } else if (dateFilter === "month") {
        filterDate.setMonth(now.getMonth() - 1)
      }

      filtered = filtered.filter((app) => new Date(app.created_at) >= filterDate)
    }

    setFilteredApplications(filtered)
  }

  const handleFileUpload = async (file: File, bucket: string) => {
    const fileExt = file.name.split(".").pop()
    const fileName = `${Date.now()}.${fileExt}`

    const { data, error } = await supabase.storage.from(bucket).upload(fileName, file)

    if (error) throw error

    const {
      data: { publicUrl },
    } = supabase.storage.from(bucket).getPublicUrl(fileName)

    return publicUrl
  }

  const handleAddJob = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newJobFile) return

    setIsSubmitting(true)

    try {
      // Upload JD file
      const jdUrl = await handleFileUpload(newJobFile, "job-descriptions")

      // Create job record
      const { error } = await supabase.from("jobs").insert({
        title: newJobTitle,
        description: newJobDescription,
        jd_file_url: jdUrl,
        jd_file_name: newJobFile.name,
      })

      if (error) throw error

      // Reset form and refresh
      setNewJobTitle("")
      setNewJobDescription("")
      setNewJobFile(null)
      setShowAddJob(false)
      fetchJobs()
    } catch (error) {
      console.error("Job creation error:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteJob = async (jobId: string) => {
    if (!confirm("Are you sure you want to delete this job?")) return

    const { error } = await supabase.from("jobs").delete().eq("id", jobId)

    if (!error) {
      fetchJobs()
      fetchApplications()
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("admin_session")
    router.push("/admin/login")
  }

  const openFile = (url: string) => {
    window.open(url, "_blank")
  }

  const totalApplications = applications.length
  const highVerdictApplications = applications.filter((app) => app.verdict === "High").length
  const mediumVerdictApplications = applications.filter((app) => app.verdict === "Medium").length
  const lowVerdictApplications = applications.filter((app) => app.verdict === "Low").length

  const last7DaysApplications = applications.filter((app) => {
    const appDate = new Date(app.created_at)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    return appDate >= sevenDaysAgo
  }).length

  const averageScore =
    applications.length > 0
      ? Math.round(applications.reduce((sum, app) => sum + app.score, 0) / applications.length)
      : 0

  const verdictChartData = [
    { name: "High", value: highVerdictApplications, color: "#10b981" },
    { name: "Medium", value: mediumVerdictApplications, color: "#f59e0b" },
    { name: "Low", value: lowVerdictApplications, color: "#ef4444" },
  ]

  const jobApplicationsData = jobs.map((job) => ({
    name: job.title.length > 15 ? job.title.substring(0, 15) + "..." : job.title,
    applications: applications.filter((app) => app.job_id === job.id).length,
  }))

  const dailyApplicationsData = Array.from({ length: 7 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (6 - i))
    const dayApplications = applications.filter((app) => {
      const appDate = new Date(app.created_at)
      return appDate.toDateString() === date.toDateString()
    }).length

    return {
      name: date.toLocaleDateString("en-US", { weekday: "short" }),
      applications: dayApplications,
    }
  })

  const scoreDistributionData = [
    { range: "90-100", count: applications.filter((app) => app.score >= 90).length },
    { range: "80-89", count: applications.filter((app) => app.score >= 80 && app.score < 90).length },
    { range: "70-79", count: applications.filter((app) => app.score >= 70 && app.score < 80).length },
    { range: "60-69", count: applications.filter((app) => app.score >= 60 && app.score < 70).length },
    { range: "50-59", count: applications.filter((app) => app.score >= 50 && app.score < 60).length },
    { range: "0-49", count: applications.filter((app) => app.score < 50).length },
  ]

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Admin Dashboard</h1>
              <p className="text-zinc-400">
                <button 
                  onClick={() => router.push('/')}
                  className="hover:text-white hover:scale-105 transition-all duration-200 cursor-pointer"
                >
                  Innomatics Research Labs
                </button>
                {" - Placements Team"}
              </p>
            </div>
            <Button
              variant="outline"
              className="border-zinc-700 text-white hover:bg-zinc-800 bg-transparent"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-zinc-900 border-zinc-800">
            <TabsTrigger value="overview" className="data-[state=active]:bg-zinc-800">
              <BarChart3 className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="jobs" className="data-[state=active]:bg-zinc-800">
              <FileText className="h-4 w-4 mr-2" />
              Jobs
            </TabsTrigger>
            <TabsTrigger value="applications" className="data-[state=active]:bg-zinc-800">
              <Users className="h-4 w-4 mr-2" />
              Applications
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-zinc-400">Total Applications</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">{totalApplications}</div>
                </CardContent>
              </Card>

              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-zinc-400">Last 7 Days</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">{last7DaysApplications}</div>
                </CardContent>
              </Card>

              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-zinc-400">High Suitability</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-400">{highVerdictApplications}</div>
                </CardContent>
              </Card>

              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-zinc-400">Average Score</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">{averageScore}</div>
                </CardContent>
              </Card>

              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-zinc-400">Active Jobs</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">{jobs.length}</div>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {/* Verdict Distribution Donut Chart */}
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-white">Resume Score Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div style={{ height: 300 }}>
                    <AgCharts 
                      options={{
                        data: verdictChartData,
                        series: [{
                          type: 'donut',
                          angleKey: 'value',
                          calloutLabelKey: 'name',
                          sectorLabelKey: 'value',
                          calloutLabel: {
                            enabled: true,
                            color: '#ffffff'
                          },
                          sectorLabel: {
                            enabled: true,
                            color: '#ffffff',
                            fontWeight: 'bold'
                          },
                          fills: verdictChartData.map(d => d.color),
                          innerRadiusRatio: 0.6,
                        }],
                        background: {
                          fill: 'transparent'
                        },
                        legend: {
                          enabled: true,
                          position: 'bottom',
                          item: {
                            label: {
                              color: '#ffffff'
                            }
                          }
                        }
                      } as AgChartOptions}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Applications by Job */}
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-white">Applications by Job</CardTitle>
                </CardHeader>
                <CardContent>
                  <div style={{ height: 300 }}>
                    <AgCharts 
                      options={{
                        data: jobApplicationsData,
                        series: [{
                          type: 'bar',
                          xKey: 'name',
                          yKey: 'applications',
                          fill: '#10b981'
                        }],
                        axes: [
                          {
                            type: 'category',
                            position: 'bottom',
                            label: {
                              color: '#9ca3af',
                              rotation: -45
                            }
                          },
                          {
                            type: 'number',
                            position: 'left',
                            label: {
                              color: '#9ca3af'
                            }
                          }
                        ],
                        background: {
                          fill: 'transparent'
                        }
                      } as AgChartOptions}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Daily Applications Trend */}
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-white">Daily Applications (Last 7 Days)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div style={{ height: 300 }}>
                    <AgCharts 
                      options={{
                        data: dailyApplicationsData,
                        series: [{
                          type: 'line',
                          xKey: 'name',
                          yKey: 'applications',
                          stroke: '#3b82f6',
                          strokeWidth: 3,
                          marker: {
                            enabled: true,
                            fill: '#3b82f6',
                            stroke: '#ffffff',
                            strokeWidth: 2,
                            size: 8
                          }
                        }],
                        axes: [
                          {
                            type: 'category',
                            position: 'bottom',
                            label: {
                              color: '#9ca3af'
                            }
                          },
                          {
                            type: 'number',
                            position: 'left',
                            label: {
                              color: '#9ca3af'
                            }
                          }
                        ],
                        background: {
                          fill: 'transparent'
                        }
                      } as AgChartOptions}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Score Distribution */}
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-white">Score Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div style={{ height: 300 }}>
                    <AgCharts 
                      options={{
                        data: scoreDistributionData,
                        series: [{
                          type: 'bar',
                          xKey: 'range',
                          yKey: 'count',
                          fill: '#f59e0b'
                        }],
                        axes: [
                          {
                            type: 'category',
                            position: 'bottom',
                            label: {
                              color: '#9ca3af'
                            }
                          },
                          {
                            type: 'number',
                            position: 'left',
                            label: {
                              color: '#9ca3af'
                            }
                          }
                        ],
                        background: {
                          fill: 'transparent'
                        }
                      } as AgChartOptions}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Jobs Tab */}
          <TabsContent value="jobs" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Job Management</h2>
              <Dialog open={showAddJob} onOpenChange={setShowAddJob}>
                <DialogTrigger asChild>
                  <Button className="bg-white text-black hover:bg-zinc-200">
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Job
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
                  <DialogHeader>
                    <DialogTitle>Add New Job</DialogTitle>
                    <DialogDescription className="text-zinc-400">
                      Create a new job posting with job description file
                    </DialogDescription>
                  </DialogHeader>

                  <form onSubmit={handleAddJob} className="space-y-4">
                    <div>
                      <Label htmlFor="jobTitle" className="text-white">
                        Job Title
                      </Label>
                      <Input
                        id="jobTitle"
                        value={newJobTitle}
                        onChange={(e) => setNewJobTitle(e.target.value)}
                        required
                        className="bg-zinc-800 border-zinc-700 text-white"
                        placeholder="e.g. Software Engineer"
                      />
                    </div>

                    <div>
                      <Label htmlFor="jobDescription" className="text-white">
                        Description
                      </Label>
                      <Textarea
                        id="jobDescription"
                        value={newJobDescription}
                        onChange={(e) => setNewJobDescription(e.target.value)}
                        className="bg-zinc-800 border-zinc-700 text-white"
                        placeholder="Brief job description..."
                        rows={3}
                      />
                    </div>

                    <div>
                      <Label htmlFor="jdFile" className="text-white">
                        Job Description File (PDF/DOCX)
                      </Label>
                      <Input
                        id="jdFile"
                        type="file"
                        accept=".pdf,.docx"
                        onChange={(e) => setNewJobFile(e.target.files?.[0] || null)}
                        required
                        className="bg-zinc-800 border-zinc-700 text-white"
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-white text-black hover:bg-zinc-200"
                    >
                      {isSubmitting ? "Creating..." : "Create Job"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {jobs.map((job) => (
                <Card key={job.id} className="bg-zinc-900 border-zinc-800">
                  <CardHeader>
                    <CardTitle className="text-white">{job.title}</CardTitle>
                    <CardDescription className="text-zinc-400">{job.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-zinc-400" />
                      <span className="text-sm text-zinc-400">{job.jd_file_name}</span>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 border-zinc-700 text-white hover:bg-zinc-800 bg-transparent"
                        onClick={() => openFile(job.jd_file_url)}
                      >
                        View JD
                      </Button>

                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteJob(job.id)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Applications Tab */}
          <TabsContent value="applications" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Application Analysis</h2>
              <div className="text-sm text-zinc-400">
                Showing {filteredApplications.length} of {totalApplications} applications
              </div>
            </div>

            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filters & Search
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                  <div>
                    <Label className="text-white">Search</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                      <Input
                        placeholder="Search name, job, skills..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 bg-zinc-800 border-zinc-700 text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-white">Verdict</Label>
                    <Select value={verdictFilter} onValueChange={setVerdictFilter}>
                      <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-800 border-zinc-700">
                        <SelectItem value="all">All Verdicts</SelectItem>
                        <SelectItem value="High">High</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="Low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-white">Job</Label>
                    <Select value={jobFilter} onValueChange={setJobFilter}>
                      <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-800 border-zinc-700">
                        <SelectItem value="all">All Jobs</SelectItem>
                        {jobs.map((job) => (
                          <SelectItem key={job.id} value={job.id}>
                            {job.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-white">Score Range</Label>
                    <Select value={scoreFilter} onValueChange={setScoreFilter}>
                      <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-800 border-zinc-700">
                        <SelectItem value="all">All Scores</SelectItem>
                        <SelectItem value="high">80-100 (High)</SelectItem>
                        <SelectItem value="medium">50-79 (Medium)</SelectItem>
                        <SelectItem value="low">0-49 (Low)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-white">Date</Label>
                    <Select value={dateFilter} onValueChange={setDateFilter}>
                      <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-800 border-zinc-700">
                        <SelectItem value="all">All Time</SelectItem>
                        <SelectItem value="today">Today</SelectItem>
                        <SelectItem value="week">Last 7 Days</SelectItem>
                        <SelectItem value="month">Last Month</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm("")
                    setVerdictFilter("all")
                    setJobFilter("all")
                    setScoreFilter("all")
                    setDateFilter("all")
                  }}
                  className="border-zinc-700 text-white hover:bg-zinc-800 bg-transparent"
                >
                  Clear Filters
                </Button>
              </CardContent>
            </Card>

            <div className="space-y-4">
              {filteredApplications.map((application) => (
                <Card key={application.id} className="bg-zinc-900 border-zinc-800">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-white">{application.full_name}</CardTitle>
                        <CardDescription className="text-zinc-400">
                          Applied for: {application.jobs.title}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="bg-zinc-800 text-white">
                          Score: {application.score}/100
                        </Badge>
                        <Badge
                          variant={application.verdict === "High" ? "default" : "secondary"}
                          className={
                            application.verdict === "High"
                              ? "bg-green-600 text-white"
                              : application.verdict === "Medium"
                                ? "bg-yellow-600 text-white"
                                : "bg-red-600 text-white"
                          }
                        >
                          {application.verdict}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold text-white mb-2">Matched Skills</h4>
                        <div className="flex flex-wrap gap-2">
                          {application.matched_skills.map((skill, index) => (
                            <Badge key={index} variant="secondary" className="bg-green-800 text-white">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold text-white mb-2">Missing Skills</h4>
                        <div className="flex flex-wrap gap-2">
                          {application.missing_skills.map((skill, index) => (
                            <Badge key={index} variant="secondary" className="bg-red-800 text-white">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-zinc-700 text-white hover:bg-zinc-800 bg-transparent"
                        onClick={() => openFile(application.resume_file_url)}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        View Resume
                      </Button>
                      <span className="text-sm text-zinc-400">
                        Applied: {new Date(application.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredApplications.length === 0 && (
              <div className="text-center py-12">
                <p className="text-zinc-400 text-lg">
                  {applications.length === 0 ? "No applications received yet." : "No applications match your filters."}
                </p>
                {applications.length > 0 && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchTerm("")
                      setVerdictFilter("all")
                      setJobFilter("all")
                      setScoreFilter("all")
                      setDateFilter("all")
                    }}
                    className="mt-4 border-zinc-700 text-white hover:bg-zinc-800 bg-transparent"
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
