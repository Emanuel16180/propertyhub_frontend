import "@tensorflow/tfjs-backend-webgl"
import "@tensorflow/tfjs-backend-cpu"

// Configuración optimizada para TensorFlow.js en el navegador
export const initializeTensorFlow = async () => {
  try {
    const tf = await import("@tensorflow/tfjs")

    // Configurar backend preferido (WebGL para mejor rendimiento)
    await tf.ready()

    console.log("[v0] TensorFlow.js initialized with backend:", tf.getBackend())
    console.log("[v0] TensorFlow.js version:", tf.version.tfjs)

    return tf
  } catch (error) {
    console.error("[v0] Error initializing TensorFlow.js:", error)
    throw error
  }
}

// Configuración para optimizar el rendimiento
export const TF_CONFIG = {
  // Configuración para COCO-SSD
  cocoSsd: {
    base: "mobilenet_v2" as const, // Modelo más ligero para mejor rendimiento
    modelUrl: undefined, // Usar modelo por defecto
  },

  // Configuración para Tesseract.js
  tesseract: {
    workerPath: "https://unpkg.com/tesseract.js@v5.0.0/dist/worker.min.js",
    langPath: "https://tessdata.projectnaptha.com/4.0.0",
    corePath: "https://unpkg.com/tesseract.js-core@v5.0.0/tesseract-core-simd.wasm.js",
  },
}
