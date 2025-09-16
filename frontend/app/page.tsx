"use client"

import type React from "react"
import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Upload, Loader2, AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { uploadResume, ApiError } from "@/lib/api"
import { ResumeParserLogo } from "@/components/resume-parser-logo"

export default function HomePage() {
  const [isDragOver, setIsDragOver] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)

    const files = Array.from(e.dataTransfer.files)
    const file = files[0]

    if (file && isValidFileType(file)) {
      setSelectedFile(file)
      setError(null)
    } else {
      setError("Please select a valid file type (PDF, DOC, DOCX, TXT) under 10MB")
    }
  }, [])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && isValidFileType(file)) {
      setSelectedFile(file)
      setError(null)
    } else {
      setError("Please select a valid file type (PDF, DOC, DOCX, TXT) under 10MB")
    }
  }, [])

  const isValidFileType = (file: File) => {
    const validTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ]
    return validTypes.includes(file.type) && file.size <= 10 * 1024 * 1024 // 10MB
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setIsUploading(true)
    setError(null)

    try {
      const response = await uploadResume(selectedFile)

      sessionStorage.setItem("parsedResumeData", JSON.stringify(response.parsed_data))
      sessionStorage.setItem("uploadedFileName", selectedFile.name)

      router.push("/results")
    } catch (error) {
      if (error instanceof ApiError) {
        setError(error.message)
      } else {
        setError("An unexpected error occurred. Please try again.")
      }
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-2">
          <ResumeParserLogo className="h-6 w-6" />
          <span className="text-xl font-semibold text-gray-900">Resume Parser</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-2xl">
          {/* Title Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4 text-balance">Effortlessly Analyze Your Resume</h1>
            <p className="text-lg text-gray-600 leading-relaxed text-pretty">
              Our AI-powered tool extracts key information from your resume, providing valuable insights to optimize
              your job application and accelerate your career.
            </p>
          </div>

          {/* Upload Card */}
          <Card className="p-8 bg-white shadow-sm">
            <div
              className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                isDragOver ? "border-blue-400 bg-blue-50" : "border-gray-300 hover:border-gray-400"
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <Upload className="h-12 w-12 text-blue-600 mx-auto mb-4" />

              <h3 className="text-lg font-semibold text-gray-900 mb-2">Drag and drop your resume here</h3>

              <p className="text-sm text-gray-500 mb-6">PDF, DOC, DOCX, TXT • Up to 10MB</p>

              {selectedFile && (
                <div className="mb-4 p-3 bg-gray-50 rounded-md">
                  <p className="text-sm text-gray-700">
                    Selected: <span className="font-medium">{selectedFile.name}</span>
                  </p>
                </div>
              )}

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <div className="space-y-4">
                <p className="text-sm text-gray-500">or</p>

                {!selectedFile ? (
                  <div className="relative">
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.txt"
                      onChange={handleFileSelect}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      disabled={isUploading}
                    />
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2" disabled={isUploading}>
                      Choose File
                    </Button>
                  </div>
                ) : (
                  <Button
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2 disabled:opacity-50"
                    disabled={isUploading}
                    onClick={handleUpload}
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      "Parse Resume"
                    )}
                  </Button>
                )}
              </div>
            </div>
          </Card>

          {/* Footer */}
          <div className="text-center mt-8">
            <p className="text-sm text-gray-500">© 2025 Resume Parser. All rights reserved.</p>
          </div>
        </div>
      </main>
    </div>
  )
}
