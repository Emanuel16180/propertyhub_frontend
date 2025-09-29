export interface IdCardResult {
  name: string
  id_number: string
  confidence: number
  side: "front" | "back"
}

export class IdCardDetector {
  private static readonly API_URL = "https://api.mindee.net/v1/products/mindee/idcard_fr/v2/predict"
  private static readonly API_TOKEN = "your_mindee_api_token_here" // You'll need to get this

  static async detectIdCard(imageBlob: Blob, side: "front" | "back"): Promise<IdCardResult> {
    try {
      console.log("[v0] Starting ID card detection for", side, "side...")

      // Convert blob to base64
      const base64Image = await this.blobToBase64(imageBlob)

      // For now, we'll use enhanced OCR processing since we don't have Mindee API key
      return await this.processWithEnhancedOCR(base64Image, side)
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
        // Remove data:image/jpeg;base64, prefix
        const base64 = result.split(",")[1]
        resolve(base64)
      }
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  }

  private static async processWithEnhancedOCR(base64Image: string, side: "front" | "back"): Promise<IdCardResult> {
    // Create image element for processing
    const img = new Image()
    img.src = `data:image/jpeg;base64,${base64Image}`

    return new Promise((resolve, reject) => {
      img.onload = async () => {
        try {
          // Create canvas for image processing
          const canvas = document.createElement("canvas")
          const ctx = canvas.getContext("2d")!

          canvas.width = img.width
          canvas.height = img.height
          ctx.drawImage(img, 0, 0)

          // Enhance image for better OCR
          this.enhanceImageForOCR(ctx, canvas.width, canvas.height)

          // Convert back to blob for Tesseract
          canvas.toBlob(
            async (blob) => {
              if (!blob) {
                reject(new Error("Failed to process image"))
                return
              }

              // Use Tesseract for OCR
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

              console.log("[v0] OCR Text extracted:", text)

              // Extract data based on side
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

    // Convert to grayscale and enhance contrast
    for (let i = 0; i < data.length; i += 4) {
      const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2])

      // Enhance contrast
      const enhanced = gray > 128 ? Math.min(255, gray * 1.2) : Math.max(0, gray * 0.8)

      data[i] = enhanced // Red
      data[i + 1] = enhanced // Green
      data[i + 2] = enhanced // Blue
      // Alpha stays the same
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
    let confidence = 50 // Base confidence

    console.log("[v0] Processing lines:", lines)

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const nextLine = i + 1 < lines.length ? lines[i + 1] : ""
      const nextNextLine = i + 2 < lines.length ? lines[i + 2] : ""

      // Extract ID number - various formats including Bolivian patterns
      const idPatterns = [
        /N[°º]?\s*(\d{7,8})/i, // N° 3219973
        /\b(\d{7,8})\b/, // Direct 7-8 digit numbers
        /CI[:\s]*(\d{7,8})/i, // CI: 1234567
        /CEDULA[:\s]*(\d{7,8})/i, // CEDULA: 1234567
        /(\d{4,5}-\d{1,2}-\d{1,2})/, // 12345-12-12 format
      ]

      for (const pattern of idPatterns) {
        const match = line.match(pattern)
        if (match && !id_number) {
          id_number = match[1]
          confidence += 20
          console.log("[v0] Found ID number:", id_number)
          break
        }
      }

      // Enhanced name extraction for both sides
      if (side === "front") {
        // Look for "NOMBRES:" pattern
        if (line.match(/NOMBRES?:/i) && nextLine) {
          const firstName = nextLine
            .replace(/^[^A-Za-záéíóúñÁÉÍÓÚÑ]*/, "") // Remove leading non-letter characters
            .replace(/[^A-Za-záéíóúñÁÉÍÓÚÑ\s]/g, "") // Remove all non-letter characters except spaces
            .trim()

          if (firstName.length > 2) {
            name = firstName
            confidence += 25
            console.log("[v0] Found first name after NOMBRES:", firstName)
          }
        }

        // Look for "APELLIDOS:" pattern and combine with existing name
        if (line.match(/APELLIDOS?:/i) && nextLine) {
          const lastName = nextLine
            .replace(/^[^A-Za-záéíóúñÁÉÍÓÚÑ]*/, "") // Remove leading non-letter characters
            .replace(/[^A-Za-záéíóúñÁÉÍÓÚÑ\s]/g, "") // Remove all non-letter characters except spaces
            .trim()

          if (lastName.length > 2) {
            if (name) {
              name = `${name} ${lastName}`
            } else {
              name = lastName
            }
            confidence += 25
            console.log("[v0] Found last name after APELLIDOS:", lastName)
          }
        }

        // Look for direct name patterns (fallback)
        if (!name && line.match(/^[A-ZÁÉÍÓÚÑ\s]{6,}$/) && line.split(" ").length >= 2) {
          const skipWords = [
            "ESTADO",
            "PLURINACIONAL",
            "BOLIVIA",
            "CEDULA",
            "IDENTIDAD",
            "SERVICIO",
            "GENERAL",
            "IDENTIFICACION",
            "PERSONAL",
          ]
          if (!skipWords.some((word) => line.includes(word))) {
            name = line.trim()
            confidence += 15
            console.log("[v0] Found direct name pattern:", name)
          }
        }
      } else if (side === "back") {
        // Look for "A:" pattern which indicates name on back side
        if (line.match(/^A:\s*/i) && line.length > 3) {
          const extractedName = line
            .replace(/^A:\s*/i, "")
            .replace(/[^A-Za-záéíóúñÁÉÍÓÚÑ\s]/g, "")
            .trim()
          if (extractedName.length > 5 && extractedName.split(" ").length >= 2) {
            name = extractedName.toUpperCase()
            confidence += 30
            console.log("[v0] Found name after A: pattern:", name)
          }
        }

        // Look for names in lines that contain full names (usually 2-4 words)
        if (
          !name &&
          line.match(/^[A-Za-záéíóúñÁÉÍÓÚÑ\s]{10,}$/) &&
          line.split(" ").length >= 2 &&
          line.split(" ").length <= 4
        ) {
          const skipWords = ["SERVICIO", "IDENTIFICACION", "PERSONAL", "CERTIFIC", "IMPRESION", "PERTENECE"]
          if (!skipWords.some((word) => line.toUpperCase().includes(word))) {
            name = line.toUpperCase().trim()
            confidence += 20
            console.log("[v0] Found full name pattern on back:", name)
          }
        }

        // Look for MRZ format names (Machine Readable Zone)
        if (line.includes("<<") && line.includes("<")) {
          const mrzMatch = line.match(/([A-Z]+)<+([A-Z]+)<+([A-Z]*)<*/)
          if (mrzMatch) {
            const lastName = mrzMatch[1]
            const firstName = mrzMatch[2]
            if (lastName && firstName) {
              name = `${firstName} ${lastName}`
              confidence += 25
              console.log("[v0] Found MRZ name:", name)
            }
          }
        }
      }
    }

    const purifiedData = this.purifyExtractedData({ name, id_number, confidence, side })

    console.log("[v0] Final extracted data:", purifiedData)

    return purifiedData
  }

  private static purifyExtractedData(rawData: IdCardResult): IdCardResult {
    let { name, id_number, confidence, side } = rawData

    console.log("[v0] Starting data purification for:", rawData)

    // Purify name
    if (name) {
      // Remove common OCR artifacts and document labels
      const invalidNames = [
        "FECHA DE NACIMIENTO",
        "FECHA DE EMISION",
        "FECHA DE EXPIRACION",
        "SERVICIO GENERAL",
        "IDENTIFICACION PERSONAL",
        "ESTADO PLURINACIONAL",
        "BOLIVIA CEDULA",
        "CEDULA DE IDENTIDAD",
        "SERIE SECCION",
        "INDEFINIDO",
      ]

      // Check if the extracted "name" is actually a document label
      const isInvalidName = invalidNames.some((invalid) => name.toUpperCase().includes(invalid))

      if (isInvalidName) {
        console.log("[v0] Detected invalid name (document label):", name)
        name = ""
        confidence -= 30
      } else {
        // Clean up the name
        name = name
          .replace(/[^A-Za-záéíóúñÁÉÍÓÚÑ\s]/g, "") // Remove non-letter characters
          .replace(/\s+/g, " ") // Normalize spaces
          .trim()

        const ocrArtifacts = [
          /^(IS|ES|AS|OS|US|EN|AN|ON|UN|IN|AL|EL|IL|OL|UL)\s+/i, // Common OCR misreads at start
          /\s+(IS|ES|AS|OS|US|EN|AN|ON|UN|IN|AL|EL|IL|OL|UL)\s+/gi, // OCR artifacts in middle
          /\s+(IS|ES|AS|OS|US|EN|AN|ON|UN|IN|AL|EL|IL|OL|UL)$/i, // OCR artifacts at end
        ]

        for (const artifact of ocrArtifacts) {
          name = name.replace(artifact, " ")
        }

        // Split into words, filter out invalid words, then rejoin
        name = name
          .split(/\s+/)
          .filter((word) => {
            // Remove single letters
            if (word.length <= 1) return false

            const commonArtifacts = [
              "IS",
              "ES",
              "AS",
              "OS",
              "US",
              "EN",
              "AN",
              "ON",
              "UN",
              "IN",
              "AL",
              "EL",
              "IL",
              "OL",
              "UL",
              "ER",
              "AR",
              "OR",
              "UR",
              "IR",
            ]
            if (commonArtifacts.includes(word.toUpperCase())) return false

            const hasVowel = /[AEIOUÁÉÍÓÚÑ]/i.test(word)
            if (!hasVowel && word.length < 4) return false // Short words without vowels are likely OCR errors

            return true
          })
          .join(" ")

        // Ensure minimum length for a valid name
        if (name.length < 3) {
          console.log("[v0] Name too short after purification, discarding:", name)
          name = ""
          confidence -= 20
        } else {
          const words = name.split(" ")
          const validWords = words.filter((word) => word.length >= 3 && /[AEIOUÁÉÍÓÚÑ]/i.test(word))

          if (validWords.length === 0) {
            console.log("[v0] No valid name words found after purification:", name)
            name = ""
            confidence -= 25
          } else {
            // Proper capitalization
            name = words
              .map((word) => {
                return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
              })
              .join(" ")

            console.log("[v0] Purified name:", name)
          }
        }
      }
    }

    // Purify ID number
    if (id_number) {
      // Clean ID number - only digits
      id_number = id_number.replace(/[^0-9]/g, "")

      // Validate ID number length (Bolivian CI is typically 7-8 digits)
      if (id_number.length < 6 || id_number.length > 9) {
        console.log("[v0] Invalid ID number length:", id_number)
        id_number = ""
        confidence -= 25
      } else {
        console.log("[v0] Purified ID number:", id_number)
      }
    }

    // Adjust confidence based on data quality
    if (name && id_number) {
      confidence += 10 // Bonus for having both pieces of data
    }

    const purifiedResult = {
      name,
      id_number,
      confidence: Math.max(10, Math.min(confidence, 95)), // Keep between 10-95%
      side,
    }

    console.log("[v0] Data purification complete:", purifiedResult)
    return purifiedResult
  }
}
