import { generateText } from "ai"
import { groq } from "@ai-sdk/groq"

export interface AnalysisResult {
  score: number
  verdict: "High" | "Medium" | "Low"
  matched_skills: string[]
  missing_skills: string[]
}

export async function analyzeResumeWithGroq(resumeText: string, jdText: string): Promise<AnalysisResult> {
  // Validate inputs
  if (!resumeText || resumeText.trim().length === 0) {
    throw new Error("Resume text is required and cannot be empty")
  }
  
  if (!jdText || jdText.trim().length === 0) {
    throw new Error("Job description text is required and cannot be empty")
  }

  // Check if GROQ_API_KEY is available
  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY environment variable is not set. Please add your Groq API key to .env.local")
  }

  try {
    const prompt = `
You are an ATS system. Compare this resume to the job requirements and score the match.

JOB REQUIREMENTS:
${jdText.trim()}

CANDIDATE RESUME:
${resumeText.trim()}

Instructions:
1. Score from 0-100 based on how well the resume matches the job requirements
2. List skills from the job that the candidate HAS (matched_skills)  
3. List skills from the job that the candidate LACKS (missing_skills)
4. Keep skills short (2-3 words max)

Scoring:
- 90-100: Exceptional match (High)
- 70-89: Good match (Medium)  
- 0-69: Poor match (Low)

Return ONLY this JSON format:
{
  "score": <number 0-100>,
  "verdict": "<High/Medium/Low>",
  "matched_skills": ["skill1", "skill2"],
  "missing_skills": ["skill3", "skill4"]
}
`

    console.log("[Innomatics Research Labs] Starting Groq analysis...")
    console.log("[Innomatics Research Labs] Resume text length:", resumeText.length)
    console.log("[Innomatics Research Labs] JD text length:", jdText.length)
    
    const { text } = await generateText({
      model: groq("llama-3.1-8b-instant"),
      prompt,
      temperature: 0.1, // Very low temperature for more consistent results
    })

    console.log("[Innomatics Research Labs] Groq response received:", text.substring(0, 200) + "...")
    console.log("[Innomatics Research Labs] Parsing response...")

    // Clean and parse the JSON response
    let cleanedText = text.trim()
    
    // Remove markdown code blocks if present
    cleanedText = cleanedText.replace(/```(?:json)?\n?/g, "").replace(/\n?```/g, "")
    
    // Remove any leading/trailing whitespace or non-JSON content
    const jsonStart = cleanedText.indexOf("{")
    const jsonEnd = cleanedText.lastIndexOf("}")
    
    if (jsonStart === -1 || jsonEnd === -1) {
      throw new Error("Invalid response format: No JSON object found in response")
    }
    
    cleanedText = cleanedText.substring(jsonStart, jsonEnd + 1)
    
    let analysis: any
    try {
      analysis = JSON.parse(cleanedText)
    } catch (parseError) {
      console.error("JSON parsing failed:", parseError)
      console.error("Raw response:", text)
      throw new Error(`Failed to parse analysis response: ${parseError instanceof Error ? parseError.message : 'Invalid JSON'}`)
    }

    // Validate required fields
    if (typeof analysis.score !== 'number') {
      throw new Error("Invalid analysis: score must be a number")
    }
    
    if (!["High", "Medium", "Low"].includes(analysis.verdict)) {
      throw new Error(`Invalid analysis: verdict must be High, Medium, or Low, got: ${analysis.verdict}`)
    }
    
    if (!Array.isArray(analysis.matched_skills)) {
      throw new Error("Invalid analysis: matched_skills must be an array")
    }
    
    if (!Array.isArray(analysis.missing_skills)) {
      throw new Error("Invalid analysis: missing_skills must be an array")
    }

    // Sanitize and return the validated response
    const result: AnalysisResult = {
      score: Math.max(0, Math.min(100, Math.round(analysis.score))),
      verdict: analysis.verdict as "High" | "Medium" | "Low",
      matched_skills: analysis.matched_skills
        .filter((skill: any) => typeof skill === 'string' && skill.trim().length > 0)
        .map((skill: string) => skill.trim())
        .slice(0, 15), // Limit to 15 skills
      missing_skills: analysis.missing_skills
        .filter((skill: any) => typeof skill === 'string' && skill.trim().length > 0)
        .map((skill: string) => skill.trim())
        .slice(0, 15), // Limit to 15 skills
    }

    console.log("[Innomatics Research Labs] Analysis completed successfully:", {
      score: result.score,
      verdict: result.verdict,
      matchedSkillsCount: result.matched_skills.length,
      missingSkillsCount: result.missing_skills.length,
      rawScore: analysis.score
    })

    return result

  } catch (error) {
    console.error("[Innomatics Research Labs] Groq analysis failed:", error)
    
    // Provide specific error messages based on error type
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        throw new Error("Groq API authentication failed. Please check your GROQ_API_KEY in environment variables.")
      } else if (error.message.includes('rate limit')) {
        throw new Error("Groq API rate limit exceeded. Please try again in a few minutes.")
      } else if (error.message.includes('timeout')) {
        throw new Error("Groq API request timed out. Please try again.")
      } else {
        throw new Error(`Analysis failed: ${error.message}`)
      }
    }
    
    throw new Error("Unknown error occurred during resume analysis")
  }
}
