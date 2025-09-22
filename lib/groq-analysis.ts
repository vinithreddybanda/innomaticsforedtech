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
You are an expert ATS (Applicant Tracking System) analyst. Perform precise resume-job matching analysis.

JOB DESCRIPTION:
${jdText.trim()}

CANDIDATE RESUME:
${resumeText.trim()}

STEP-BY-STEP ANALYSIS:

STEP 1: EXTRACT JOB REQUIREMENTS
- Identify ALL technical skills, tools, frameworks, languages mentioned in JD
- Extract experience requirements (years, level)
- Note education/certification requirements
- Identify domain knowledge requirements
- List soft skills if explicitly mentioned

STEP 2: SEMANTIC SKILL MATCHING
Apply intelligent matching rules like examples:
- Programming Languages: "JavaScript" = "JS" = "ECMAScript", "Python" = "Python3", "C#" = "CSharp"
- Frameworks: "React" = "ReactJS" = "React.js", "Angular" = "AngularJS", "Vue" = "Vue.js"
- Databases: "MySQL" = "My SQL", "PostgreSQL" = "Postgres", "MongoDB" = "Mongo"
- Cloud: "AWS" = "Amazon Web Services", "Azure" = "Microsoft Azure", "GCP" = "Google Cloud"
- Tools: "Git" = "GitHub" = "GitLab", "Docker" = "Containerization", "K8s" = "Kubernetes"
- Experience: "2+ years" matches if resume shows ≥2 years, "Senior" matches if >3 years experience
- Education: "Bachelor's" = "BS" = "B.Tech" = "BE", "Master's" = "MS" = "M.Tech" = "MBA"

STEP 3: ACCURATE SCORING CALCULATION
Use this precise formula:
1. Count total JD requirements (technical + experience + education + domain)
2. Count matched requirements using semantic matching
3. Calculate: (matched_requirements / total_requirements) × 100
4. Apply experience weight: If experience requirement not met, reduce score by 15-20 points
5. Apply education weight: If education requirement not met, reduce score by 5-10 points

STEP 4: CONSISTENCY RULES
- Same resume against same JD should always give identical score 
- Score must reflect actual content, not random variation
- Use semantic matching to avoid missing obvious matches

SCORING FRAMEWORK:
- 95-100: Perfect match (all requirements + bonus skills)
- 85-94: Excellent match (90%+ requirements met)
- 75-84: Very good match (80-89% requirements met)  
- 65-74: Good match (70-79% requirements met)
- 55-64: Moderate match (60-69% requirements met)
- 45-54: Weak match (50-59% requirements met)
- 35-44: Poor match (40-49% requirements met)
- 25-34: Very poor match (30-39% requirements met)
- 0-24: No match (minimal requirements met)

VERDICT MAPPING:
- High: Score ≥80 (Strong candidate, recommend interview)
- Medium: Score 50-79 (Review candidate, potential fit)
- Low: Score <50 (Not suitable for this role)

SKILL FORMATTING:
- Use 2-3 words maximum per skill
- Technical terms: "React", "Python", "AWS", "MySQL"
- Experience: "5+ years in c#", "Senior level production manager", "Team lead"
- Education: "Bachelor's degree Mechanical", "Computer science degree", "BioChemicalEngineering"
- Certifications: "AWS Certified", "PMP", "Scrum Master"

EXAMPLES OF SEMANTIC MATCHING:
JD: "3+ years JavaScript experience, React framework, Node.js backend"
Resume: "4 years of JS development, ReactJS projects, NodeJS APIs"
Result: matched_skills: ["JavaScript", "React", "Node.js"] (100% match = 95-100 score)

JD: "Python, Machine Learning, 2+ years data science, Master's degree"
Resume: "Python programming, ML algorithms, 1.5 years analytics, Bachelor's CS"
Result: matched_skills: ["Python", "Machine Learning"], missing_skills: ["2+ years experience", "Master's degree"] (50% match = 55-64 score)

Return ONLY valid JSON:
{
  "score": <calculated_number_0_to_100>,
  "verdict": "<High/Medium/Low>",
  "matched_skills": ["skill1", "skill2"],
  "missing_skills": ["skill3", "skill4"]
}
`

    console.log("[Innomatics Research Labs] Starting Groq analysis...")
    console.log("[Innomatics Research Labs] Resume text length:", resumeText.length)
    console.log("[Innomatics Research Labs] JD text length:", jdText.length)
    
    const { text } = await generateText({
      model: groq("llama-3.3-70b-versatile"),
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
