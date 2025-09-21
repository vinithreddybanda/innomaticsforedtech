import { type NextRequest, NextResponse } from "next/server"
import { analyzeResumeWithGroq } from "@/lib/groq-analysis"
import { createClient } from "@/lib/supabase/server"
import { getTextExtractor } from "office-text-extractor"

// Server-side function to extract text from URL
async function extractTextFromURL(url: string): Promise<string> {
  try {
    console.log('[Innomatics Research Labs] Processing JD from URL:', url)
    
    // Validate URL
    let urlObj: URL
    try {
      urlObj = new URL(url)
    } catch {
      throw new Error("Invalid URL format")
    }

    if (!urlObj.protocol.startsWith('http')) {
      throw new Error("Only HTTP and HTTPS URLs are supported")
    }

    // Use office-text-extractor for real text extraction from URL
    const extractor = getTextExtractor()
    const text = await extractor.extractText({ 
      input: url, 
      type: 'url' 
    })

    if (!text || text.trim().length === 0) {
      throw new Error('No readable text found in the document.')
    }
    
    console.log('[Innomatics Research Labs] JD processing completed successfully')
    return text.trim()
    
  } catch (error) {
    console.error("URL text extraction error:", error)
    throw new Error(`Failed to extract text from URL: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export async function POST(request: NextRequest) {
  try {
    const { applicationId, resumeText, jdUrl } = await request.json()

    if (!applicationId || !resumeText || !jdUrl) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Extract text from JD file
    const jdText = await extractTextFromURL(jdUrl)

    // Analyze with Groq
    const analysis = await analyzeResumeWithGroq(resumeText, jdText)

    // Update application in database
    const supabase = await createClient()
    const { error } = await supabase
      .from("applications")
      .update({
        resume_text: resumeText,
        jd_text: jdText,
        score: analysis.score,
        verdict: analysis.verdict,
        matched_skills: analysis.matched_skills,
        missing_skills: analysis.missing_skills,
        updated_at: new Date().toISOString(),
      })
      .eq("id", applicationId)

    if (error) {
      throw error
    }

    return NextResponse.json(analysis)
  } catch (error) {
    console.error("Resume analysis error:", error)
    
    // Provide more specific error messages
    const errorMessage = error instanceof Error ? error.message : "Analysis failed"
    const statusCode = errorMessage.includes("API key") || errorMessage.includes("authentication") ? 401 : 500
    
    return NextResponse.json({ 
      error: errorMessage,
      details: "Please check your configuration and try again"
    }, { status: statusCode })
  }
}
