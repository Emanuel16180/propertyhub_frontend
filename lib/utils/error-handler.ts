export class APIError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string,
  ) {
    super(message)
    this.name = "APIError"
  }
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof APIError) {
    return error.message
  }

  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === "string") {
    return error
  }

  return "Ha ocurrido un error inesperado"
}

export function isNetworkError(error: unknown): boolean {
  return (
    error instanceof TypeError &&
    (error.message.includes("fetch") || error.message.includes("network") || error.message.includes("Failed to fetch"))
  )
}

export function getRetryableError(error: unknown): boolean {
  if (error instanceof APIError) {
    // Retry on server errors but not client errors
    return error.status ? error.status >= 500 : false
  }

  // Retry on network errors
  return isNetworkError(error)
}
