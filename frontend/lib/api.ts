// api.ts — Frontend service for the Resume Parser backend (FastAPI + spaCy)

const API_BASE_URL =
  (typeof process !== "undefined" && (process as any).env?.NEXT_PUBLIC_API_URL) ||
  (import.meta as any)?.env?.VITE_API_URL ||
  "http://localhost:8000";

/** Normalized data your UI will consume */
export interface ParsedResumeData {
  name?: string | null;
  skills: string[];
  work_experience: string[]; // normalized to strings for simple rendering
  education: string[];
  languages: string[];
  /** raw entities from backend for advanced views */
  raw_entities?: Record<string, string[]>;
}

/** Final shape returned to the app after normalization */
export interface ApiResponse {
  success: boolean;
  filename: string;
  file_type?: string;
  text_length?: number;
  parsed_data: ParsedResumeData;
}

/** Raw backend response from FastAPI (/parse) */
type BackendResponse = {
  filename: string;
  file_type?: string;
  text_length?: number;
  data?: {
    text?: string;
    entities?: Record<string, string[]>;
  };
  // Some versions may include success/detail; we don't require them
  success?: boolean;
  detail?: string;
};

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

/** Convert backend shape into ParsedResumeData */
function normalize(br: BackendResponse): ApiResponse {
  const entities = br.data?.entities || {};
  const get = (k: string): string[] => Array.isArray(entities[k]) ? entities[k] : [];

  // If you have a dedicated "Name" entity, pick the first; otherwise null
  const name = (get("Name")[0] || null) ?? null;

  // Keep it simple: arrays of strings per section
  const parsed: ParsedResumeData = {
    name,
    skills: get("Skill"),
    work_experience: get("Work_Experience"),
    education: get("Education"),
    languages: get("Language"),
    raw_entities: entities,
  };

  return {
    success: true,
    filename: br.filename,
    file_type: br.file_type,
    text_length: br.text_length,
    parsed_data: parsed,
  };
}

/**
 * Upload a resume file to the backend.
 * Matches FastAPI route: POST /parse  (NOT /parse-resume)
 */
export async function uploadResume(file: File): Promise<ApiResponse> {
  const formData = new FormData();
  formData.append("file", file);

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}/parse`, {
      method: "POST",
      body: formData,
    });
  } catch (e: any) {
    // Network-level error
    throw new ApiError(0, "Unable to connect to the server. Is the backend running?");
  }

  // Try parse JSON either on success or error to surface details
  let payload: any = null;
  try {
    payload = await res.json();
  } catch {
    // ignore JSON parse error; will throw below if !ok
  }

  if (!res.ok) {
    const msg =
      payload?.detail ||
      payload?.message ||
      `HTTP ${res.status} while uploading resume`;
    throw new ApiError(res.status, msg);
  }

  return normalize(payload as BackendResponse);
}

/** Simple health check against GET /health (optional in your backend) */
export async function checkApiHealth(): Promise<boolean> {
  try {
    const r = await fetch(`${API_BASE_URL}/health`, { method: "GET" });
    return r.ok;
  } catch {
    return false;
  }
}
