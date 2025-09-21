import { type NextRequest, NextResponse } from "next/server"
import { getTextExtractor } from "office-text-extractor"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ 
        error: "File is too large. Maximum size is 10MB." 
      }, { status: 400 })
    }

    const fileName = file.name.toLowerCase()
    let extractedText: string

    if (fileName.endsWith(".pdf") || fileName.endsWith(".docx") || fileName.endsWith(".pptx") || fileName.endsWith(".xlsx")) {
      extractedText = await extractTextFromOfficeDocument(file)
    } else if (fileName.endsWith(".txt")) {
      extractedText = await file.text()
    } else if (fileName.endsWith(".doc")) {
      return NextResponse.json({ 
        error: "DOC files are not supported. Please convert to DOCX format." 
      }, { status: 400 })
    } else {
      return NextResponse.json({ 
        error: `Unsupported file format: ${fileName.split('.').pop()?.toUpperCase()}. Supported formats: PDF, DOCX, PPTX, XLSX, TXT` 
      }, { status: 400 })
    }

    if (!extractedText || extractedText.trim().length === 0) {
      return NextResponse.json({ 
        error: "No readable text found in the file." 
      }, { status: 400 })
    }

    return NextResponse.json({ 
      text: extractedText.trim(),
      filename: file.name,
      size: file.size
    })

  } catch (error) {
    console.error("Text extraction error:", error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Text extraction failed" 
    }, { status: 500 })
  }
}

async function extractTextFromOfficeDocument(file: File): Promise<string> {
  try {
    console.log('[Innomatics Research Labs] Processing file:', file.name)
    
    // Get the text extractor with default extraction methods
    const extractor = getTextExtractor()
    
    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    // Extract text using office-text-extractor
    const text = await extractor.extractText({ 
      input: buffer, 
      type: 'buffer' 
    })
    
    if (!text || text.trim().length === 0) {
      throw new Error('No readable text found in the file.')
    }
    
    console.log('[Innomatics Research Labs] File processing completed successfully')
    return text.trim()
    
  } catch (error) {
    console.error('Office document extraction error:', error)
    throw new Error(`Failed to extract text from ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}