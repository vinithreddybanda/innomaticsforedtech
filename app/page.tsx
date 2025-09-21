"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { extractTextFromFile } from "@/lib/pdf-text-extractor"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { FileText, Upload, Eye, Loader2 } from "lucide-react"
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

interface ApplicationResult {
  score: number
  verdict: string
  matched_skills: string[]
  missing_skills: string[]
}

export default function HomePage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [fullName, setFullName] = useState("")
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [applicationResult, setApplicationResult] = useState<ApplicationResult | null>(null)
  const [showResult, setShowResult] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    fetchJobs()
  }, [])

  const fetchJobs = async () => {
    const { data, error } = await supabase.from("jobs").select("*").order("created_at", { ascending: false })

    if (data) {
      setJobs(data)
    }
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

  const handleApplication = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedJob || !resumeFile) return

    setIsSubmitting(true)

    try {
      // Upload resume file
      const resumeUrl = await handleFileUpload(resumeFile, "resumes")

      // Extract text from resume
      console.log("[Innomatics Research Labs] Extracting text from resume file")
      const resumeText = await extractTextFromFile(resumeFile)

      // Create application record first
      const { data: applicationData, error: insertError } = await supabase
        .from("applications")
        .insert({
          job_id: selectedJob.id,
          full_name: fullName,
          resume_file_url: resumeUrl,
          resume_file_name: resumeFile.name,
          resume_text: resumeText,
          // Initial values - will be updated by analysis
          score: 0,
          verdict: "Low",
          matched_skills: [],
          missing_skills: [],
        })
        .select()
        .single()

      if (insertError) throw insertError

      console.log("[Innomatics Research Labs] Application created, starting analysis")
      setIsAnalyzing(true)

      // Analyze resume with Groq API
      const analysisResponse = await fetch("/api/analyze-resume", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          applicationId: applicationData.id,
          resumeText: resumeText,
          jdUrl: selectedJob.jd_file_url,
        }),
      })

      if (!analysisResponse.ok) {
        throw new Error("Analysis failed")
      }

      const analysis = await analysisResponse.json()
      console.log("[Innomatics Research Labs] Analysis completed:", analysis)

      // Show result
      setApplicationResult(analysis)
      setShowResult(true)

      // Reset form
      setFullName("")
      setResumeFile(null)
      setSelectedJob(null)
    } catch (error) {
      console.error("Application error:", error)
      alert("Application submission failed. Please try again.")
    } finally {
      setIsSubmitting(false)
      setIsAnalyzing(false)
    }
  }

  const openJDFile = (url: string) => {
    window.open(url, "_blank")
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Innomatics Research Labs</h1>
              <p className="text-zinc-400">Career Opportunities</p>
            </div>
            <Button
              variant="outline"
              className="border-zinc-700 text-white hover:bg-zinc-800 bg-transparent"
              onClick={() => (window.location.href = "/admin/login")}
            >
              Admin Login
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Available Positions</h2>
          <p className="text-zinc-400">Apply for exciting career opportunities at Innomatics Research Labs</p>
        </div>

        {/* Jobs Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {jobs.map((job) => (
            <Card key={job.id} className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-colors">
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
                    onClick={() => openJDFile(job.jd_file_url)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View JD
                  </Button>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        size="sm"
                        className="flex-1 bg-white text-black hover:bg-zinc-200"
                        onClick={() => setSelectedJob(job)}
                      >
                        Apply Now
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
                      <DialogHeader>
                        <DialogTitle>Apply for {selectedJob?.title}</DialogTitle>
                        <DialogDescription className="text-zinc-400">
                          Submit your resume to apply for this position
                        </DialogDescription>
                      </DialogHeader>

                      <form onSubmit={handleApplication} className="space-y-4">
                        <div>
                          <Label htmlFor="fullName" className="text-white">
                            Full Name
                          </Label>
                          <Input
                            id="fullName"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            required
                            className="bg-zinc-800 border-zinc-700 text-white"
                            placeholder="Enter your full name"
                          />
                        </div>

                        <div>
                          <Label htmlFor="resume" className="text-white">
                            Resume (PDF/DOCX)
                          </Label>
                          <Input
                            id="resume"
                            type="file"
                            accept=".pdf,.docx"
                            onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                            required
                            className="bg-zinc-800 border-zinc-700 text-white"
                          />
                        </div>

                        <Button
                          type="submit"
                          disabled={isSubmitting || isAnalyzing}
                          className="w-full bg-white text-black hover:bg-zinc-200"
                        >
                          {isAnalyzing ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Analyzing Resume...
                            </>
                          ) : isSubmitting ? (
                            "Submitting..."
                          ) : (
                            <>
                              Submit Application
                              <Upload className="h-4 w-4 ml-2" />
                            </>
                          )}
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {jobs.length === 0 && (
          <div className="text-center py-12">
            <p className="text-zinc-400 text-lg">No job openings available at the moment.</p>
            <p className="text-zinc-500 text-sm mt-2">Please check back later for new opportunities.</p>
          </div>
        )}
      </main>

      {/* Application Result Dialog */}
      <Dialog open={showResult} onOpenChange={setShowResult}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
          <DialogHeader>
            <DialogTitle>Application Submitted Successfully</DialogTitle>
            <DialogDescription className="text-zinc-400">Here's your AI-powered application analysis</DialogDescription>
          </DialogHeader>

          {applicationResult && (
            <div className="space-y-4">
              <div className="flex flex-col items-center space-y-4">
                <span className="font-semibold text-lg">AI Score</span>
                <div style={{ height: 200, width: 200 }}>
                  <AgCharts 
                    options={{
                      data: [
                        { 
                          category: 'Score', 
                          value: applicationResult.score,
                          fill: applicationResult.score >= 80 ? '#10b981' : 
                                applicationResult.score >= 50 ? '#f59e0b' : '#ef4444'
                        },
                        { 
                          category: 'Remaining', 
                          value: 100 - applicationResult.score,
                          fill: '#374151'
                        }
                      ],
                      series: [{
                        type: 'donut',
                        angleKey: 'value',
                        fills: ['#10b981', '#374151'],
                        innerRadiusRatio: 0.7,
                        calloutLabel: {
                          enabled: false
                        },
                        sectorLabel: {
                          enabled: false
                        },
                        tooltip: {
                          enabled: false
                        }
                      }],
                      background: {
                        fill: 'transparent'
                      },
                      legend: {
                        enabled: false
                      },
                      title: {
                        text: `${applicationResult.score}/100`,
                        fontSize: 18,
                        fontWeight: 'bold',
                        color: '#ffffff'
                      }
                    } as AgChartOptions}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="font-semibold">Verdict:</span>
                <Badge
                  variant={applicationResult.verdict === "High" ? "default" : "secondary"}
                  className={
                    applicationResult.verdict === "High"
                      ? "bg-green-600 text-white"
                      : applicationResult.verdict === "Medium"
                        ? "bg-yellow-600 text-white"
                        : "bg-red-600 text-white"
                  }
                >
                  {applicationResult.verdict} Suitability
                </Badge>
              </div>

              <div>
                <span className="font-semibold block mb-2">Matched Skills:</span>
                <div className="flex flex-wrap gap-2">
                  {applicationResult.matched_skills.map((skill, index) => (
                    <Badge key={index} variant="secondary" className="bg-green-800 text-white">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <span className="font-semibold block mb-2">Missing Skills:</span>
                <div className="flex flex-wrap gap-2">
                  {applicationResult.missing_skills.map((skill, index) => (
                    <Badge key={index} variant="secondary" className="bg-red-800 text-white">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>

              <Button onClick={() => setShowResult(false)} className="w-full bg-white text-black hover:bg-zinc-200">
                Close
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
