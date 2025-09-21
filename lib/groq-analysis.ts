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
You are an expert ATS (Applicant Tracking System) and HR analyst with 10+ years of experience in talent acquisition. 

Analyze the following resume against the job description with high precision and provide a comprehensive assessment.

JOB DESCRIPTION:
${jdText.trim()}

CANDIDATE RESUME:
${resumeText.trim()}

ANALYSIS INSTRUCTIONS:
1. Extract ALL skills, qualifications and requirements mentioned in the JOB DESCRIPTION
2. For each JD requirement, check if the candidate's resume demonstrates that skill/qualification
3. Consider both exact keyword matches and semantic/contextual matches
4. Evaluate experience level, education, certifications, and relevant projects
5. Consider career progression and relevance of past roles

SKILL MATCHING RULES:
- "matched_skills": JD skills/requirements that ARE demonstrated in the candidate's resume
- "missing_skills": JD skills/requirements that are NOT found or demonstrated in the candidate's resume

IMPORTANT CLARIFICATION:
- Focus ONLY on what the JOB DESCRIPTION requires
- Do NOT include skills from resume that aren't in the JD
- Match skills semantically (e.g., "JavaScript" matches "JS", "Machine Learning" matches "ML")

SKILL FORMATTING RULES:
- Keep each skill to MAXIMUM 3-4 words only
- Use concise, specific terms or actual missed skills
- Avoid long descriptive phrases
- Examples of BAD skills: "Experience in working on interfaces for processing large amounts of data", "Understanding of manufacturing data and processes"

Provide ONLY a valid JSON response with this exact structure:
{
  "score": <number between 0-100 representing overall match percentage>,
  "verdict": "<High/Medium/Low>",
  "matched_skills": ["JD_skill1_found_in_resume", "JD_skill2_found_in_resume"],
  "missing_skills": ["JD_skill1_NOT_in_resume", "JD_skill2_NOT_in_resume"]
}

CRITICAL: The "verdict" field must be EXACTLY one of these three words: "High", "Medium", "Low"
Do NOT use any other words like "Moderate", "Good", "Poor", "Excellent", etc.

SCORING CRITERIA:
- 90-100: Perfect match, candidate has 90%+ of JD requirements
- 80-89: Excellent match, candidate has 80-89% of JD requirements  
- 70-79: Good match, candidate has 70-79% of JD requirements
- 60-69: Moderate match, candidate has 60-69% of JD requirements
- 50-59: Weak match, candidate has 50-59% of JD requirements
- 0-49: Poor match, candidate has less than 50% of JD requirements

VERDICT MAPPING:
- High: Score 80-100 (Strong candidate, recommend for interview)
- Medium: Score 50-79 (Potential candidate, needs further review)  
- Low: Score 0-49 (Not suitable for this role)

EXAMPLES:
If JD requires: "Python programming, React development, AWS cloud services, 5+ years of software development experience, Bachelor's degree in Computer Science"
And Resume has: "Python, JavaScript, React, 3 years experience, Master's degree"
Then:
- matched_skills: ["Python", "React", "Bachelor's degree"]  
- missing_skills: ["AWS", "5+ years experience"]

SKILL CONDENSING EXAMPLES:
- "Experience in working on interfaces for processing large amounts of data" → "Data processing"
- "Bachelor's degree in Mechanical/Automotive/Production/Manufacturing engineering" → "Engineering degree"
- "At least one year of experience in a manufacturing company" → "Manufacturing experience"
- "Understanding of manufacturing data" → "Manufacturing data"
- "Collaboration with stakeholders including machine learning engineers" → "Stakeholder collaboration"

IMPORTANT: Return ONLY the JSON object, no additional text, markdown formatting, or explanations.
`

    console.log("[Innomatics Research Labs] Starting Groq analysis...")
    
    const { text } = await generateText({
      model: groq("gemma2-9b-it"),
      prompt,
      temperature: 0.3, // Lower temperature for more consistent results
    })

    console.log("[Innomatics Research Labs] Groq response received, parsing...")

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
      missingSkillsCount: result.missing_skills.length
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
