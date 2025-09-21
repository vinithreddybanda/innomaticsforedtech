// Client-side text extraction utility that uses server-side API
export async function extractTextFromFile(file: File): Promise<string> {
  try {
    // Create FormData to send the file
    const formData = new FormData()
    formData.append('file', file)

    // Call the server-side text extraction API
    const response = await fetch('/api/extract-text', {
      method: 'POST',
      body: formData,
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.error || 'Text extraction failed')
    }

    return result.text
  } catch (error) {
    console.error("Text extraction error:", error)
    throw new Error(error instanceof Error ? error.message : 'Text extraction failed')
  }
}



export async function extractTextFromURL(url: string): Promise<string> {
  try {
    // Call the server-side URL text extraction API
    const response = await fetch('/api/extract-text-from-url', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.error || 'URL text extraction failed')
    }

    return result.text
  } catch (error) {
    console.error("URL text extraction error:", error)
    throw new Error(error instanceof Error ? error.message : 'URL text extraction failed')
  }
}
