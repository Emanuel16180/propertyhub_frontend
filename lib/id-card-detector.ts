export interface IdCardResult {
  name: string
  id_number: string
  confidence: number
  side: "front" | "back"
}

export class IdCardDetector {
  private static readonly OCR_SPACE_API_KEY = "K87899142388957" // Free tier API key
  private static readonly OCR_SPACE_URL = "https://api.ocr.space/parse/image"

  static async detectIdCard(imageBlob: Blob, side: "front" | "back"): Promise<IdCardResult> {
    try {
      console.log("[v0] Starting ID card detection for", side, "side with OCR.space API...")

      // Convert blob to base64
      const base64Image = await this.blobToBase64(imageBlob)

      // Use OCR.space API for better accuracy
      return await this.processWithOCRSpace(base64Image, side)
    } catch (error) {
      console.error("[v0] ID card detection error:", error)
      throw new Error(`Error al procesar la cédula: ${(error as Error).message}`)
    }
  }

  private static async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        resolve(result) // Keep the full data URL for OCR.space
      }
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  }

  private static async processWithOCRSpace(base64Image: string, side: "front" | "back"): Promise<IdCardResult> {
    try {
      console.log("[v0] Calling OCR.space API...")

      const formData = new FormData()
      formData.append("base64Image", base64Image)
      formData.append("language", "spa") // Spanish
      formData.append("isOverlayRequired", "false")
      formData.append("detectOrientation", "true")
      formData.append("scale", "true")
      formData.append("OCREngine", "2") // Engine 2 is better for documents

      const response = await fetch(this.OCR_SPACE_URL, {
        method: "POST",
        headers: {
          apikey: this.OCR_SPACE_API_KEY,
        },
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`OCR API error: ${response.status}`)
      }

      const result = await response.json()
      console.log("[v0] OCR.space API response:", result)

      if (result.IsErroredOnProcessing) {
        throw new Error(result.ErrorMessage?.[0] || "OCR processing failed")
      }

      if (!result.ParsedResults || result.ParsedResults.length === 0) {
        throw new Error("No text detected in image")
      }

      const text = result.ParsedResults[0].ParsedText
      console.log("[v0] OCR Text extracted:", text)

      // Extract data using improved patterns
      const extractedData = this.extractIdData(text, side)
      return extractedData
    } catch (error) {
      console.error("[v0] OCR.space API failed, falling back to Tesseract.js:", error)
      // Fallback to Tesseract.js if OCR.space fails
      return await this.processWithTesseract(base64Image, side)
    }
  }

  private static async processWithTesseract(base64Image: string, side: "front" | "back"): Promise<IdCardResult> {
    console.log("[v0] Using Tesseract.js fallback...")

    const img = new Image()
    img.src = base64Image

    return new Promise((resolve, reject) => {
      img.onload = async () => {
        try {
          const canvas = document.createElement("canvas")
          const ctx = canvas.getContext("2d")!

          canvas.width = img.width
          canvas.height = img.height
          ctx.drawImage(img, 0, 0)

          this.enhanceImageForOCR(ctx, canvas.width, canvas.height)

          canvas.toBlob(
            async (blob) => {
              if (!blob) {
                reject(new Error("Failed to process image"))
                return
              }

              const Tesseract = (await import("tesseract.js")).default

              const {
                data: { text },
              } = await Tesseract.recognize(blob, "spa+eng", {
                logger: (m) => {
                  if (m.status === "recognizing text") {
                    console.log(`[v0] OCR Progress: ${Math.round(m.progress * 100)}%`)
                  }
                },
              })

              console.log("[v0] Tesseract OCR Text:", text)
              const result = this.extractIdData(text, side)
              resolve(result)
            },
            "image/jpeg",
            0.9,
          )
        } catch (error) {
          reject(error)
        }
      }

      img.onerror = () => reject(new Error("Failed to load image"))
    })
  }

  private static enhanceImageForOCR(ctx: CanvasRenderingContext2D, width: number, height: number) {
    const imageData = ctx.getImageData(0, 0, width, height)
    const data = imageData.data

    for (let i = 0; i < data.length; i += 4) {
      const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2])
      const enhanced = gray > 128 ? Math.min(255, gray * 1.2) : Math.max(0, gray * 0.8)

      data[i] = enhanced
      data[i + 1] = enhanced
      data[i + 2] = enhanced
    }

    ctx.putImageData(imageData, 0, 0)
  }

  private static extractIdData(text: string, side: "front" | "back"): IdCardResult {
    const lines = text
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0)

    let name = ""
    let id_number = ""
    let confidence = 60 // Higher base confidence with better OCR

    console.log("[v0] Processing OCR lines:", lines)

    // Extract ID number - look for 7-8 digit sequences
    const fullText = text.replace(/\s+/g, " ")

    // Pattern 1: Look for explicit ID patterns
    const idPatterns = [
      /(?:N[°º]?|CI|CEDULA|IDENTIDAD)[:\s]*(\d{7,8})/gi,
      /\b(\d{7,8})\b/g, // Any standalone 7-8 digit number
    ]

    for (const pattern of idPatterns) {
      const matches = fullText.matchAll(pattern)
      for (const match of matches) {
        const extracted = match[1].replace(/\D/g, "")
        if (extracted.length >= 7 && extracted.length <= 8 && !id_number) {
          id_number = extracted
          confidence += 20
          console.log("[v0] Found ID number:", id_number)
          break
        }
      }
      if (id_number) break
    }

    // Extract name based on side
    if (side === "front") {
      // Look for NOMBRES and APELLIDOS patterns
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        const nextLine = i + 1 < lines.length ? lines[i + 1] : ""

        if (/NOMBRES?/i.test(line) && nextLine) {
          const firstName = nextLine.replace(/[^A-Za-záéíóúñÁÉÍÓÚÑ\s]/g, "").trim()
          if (firstName.length > 2) {
            name = firstName
            confidence += 15
            console.log("[v0] Found first name:", firstName)
          }
        }

        if (/APELLIDOS?/i.test(line) && nextLine) {
          const lastName = nextLine.replace(/[^A-Za-záéíóúñÁÉÍÓÚÑ\s]/g, "").trim()
          if (lastName.length > 2) {
            name = name ? `${name} ${lastName}` : lastName
            confidence += 15
            console.log("[v0] Found last name:", lastName)
          }
        }
      }

      // Fallback: Look for capitalized name sequences
      if (!name) {
        for (const line of lines) {
          const capitalizedWords = line.match(/\b[A-ZÁÉÍÓÚÑ][a-záéíóúñ]{2,}\b/g)
          if (capitalizedWords && capitalizedWords.length >= 2 && capitalizedWords.length <= 4) {
            const potentialName = capitalizedWords.join(" ")
            const skipWords = ["Estado", "Plurinacional", "Bolivia", "Cedula", "Identidad", "Servicio"]
            const hasSkipWord = skipWords.some((word) => potentialName.includes(word))
            if (!hasSkipWord && potentialName.length >= 8) {
              name = potentialName
              confidence += 10
              console.log("[v0] Found name from capitalized words:", potentialName)
              break
            }
          }
        }
      }
    } else if (side === "back") {
      // Look for "A:" pattern or full name in caps
      for (const line of lines) {
        if (/^A:\s*/i.test(line)) {
          const extractedName = line
            .replace(/^A:\s*/i, "")
            .replace(/[^A-Za-záéíóúñÁÉÍÓÚÑ\s]/g, "")
            .trim()
          if (extractedName.length > 5 && extractedName.split(" ").length >= 2) {
            name = extractedName
            confidence += 20
            console.log("[v0] Found name after A: pattern:", extractedName)
            break
          }
        }

        if (!name && /^[A-ZÁÉÍÓÚÑ\s]{10,}$/.test(line)) {
          const words = line.trim().split(/\s+/)
          if (words.length >= 2 && words.length <= 4) {
            const skipWords = ["SERVICIO", "IDENTIFICACION", "PERSONAL", "CERTIFIC"]
            const hasSkipWord = skipWords.some((word) => line.includes(word))
            if (!hasSkipWord) {
              name = line.trim()
              confidence += 15
              console.log("[v0] Found full name on back:", line)
              break
            }
          }
        }
      }
    }

    // Purify and validate data
    const purifiedData = this.purifyExtractedData({ name, id_number, confidence, side })

    console.log("[v0] Final extracted data:", purifiedData)
    return purifiedData
  }

  private static purifyExtractedData(rawData: IdCardResult): IdCardResult {
    let { name, id_number, confidence, side } = rawData

    console.log("[v0] Starting data purification for:", rawData)

    // Purify name
    if (name) {
      const invalidNames = [
        "FECHA DE NACIMIENTO",
        "FECHA DE EMISION",
        "SERVICIO GENERAL",
        "IDENTIFICACION PERSONAL",
        "ESTADO PLURINACIONAL",
        "CEDULA DE IDENTIDAD",
      ]

      const isInvalidName = invalidNames.some((invalid) => name.toUpperCase().includes(invalid))

      if (isInvalidName) {
        console.log("[v0] Detected invalid name (document label):", name)
        name = ""
        confidence -= 30
      } else {
        name = name
          .replace(/[^A-Za-záéíóúñÁÉÍÓÚÑ\s]/g, "")
          .replace(/\s+/g, " ")
          .trim()

        if (name.length < 3) {
          console.log("[v0] Name too short, discarding:", name)
          name = ""
          confidence -= 20
        } else {
          // Proper capitalization
          name = name
            .split(" ")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(" ")

          console.log("[v0] Purified name:", name)
        }
      }
    }

    // Purify ID number
    if (id_number) {
      id_number = id_number.replace(/[^0-9]/g, "")

      if (id_number.length < 6 || id_number.length > 9) {
        console.log("[v0] Invalid ID number length:", id_number)
        id_number = ""
        confidence -= 25
      } else {
        console.log("[v0] Purified ID number:", id_number)
      }
    }

    // Adjust confidence
    if (name && id_number) {
      confidence += 10
    }

    return {
      name,
      id_number,
      confidence: Math.max(20, Math.min(confidence, 95)),
      side,
    }
  }
}
