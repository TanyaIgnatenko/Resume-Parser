"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Printer, Plus, Loader2, AlertCircle, Star, Briefcase, GraduationCap, Globe } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import type { ParsedResumeData } from "@/lib/api"
import { DownloadMenu } from "@/components/download-menu"
import { ResumeParserLogo } from "@/components/resume-parser-logo"

export default function ResultsPage() {
  const [resumeData, setResumeData] = useState<ParsedResumeData | null>(null)
  const [fileName, setFileName] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    try {
      const storedData = sessionStorage.getItem("parsedResumeData")
      const storedFileName = sessionStorage.getItem("uploadedFileName")

      if (storedData) {
        const parsedData = JSON.parse(storedData)
        setResumeData(parsedData)
        setFileName(storedFileName || "Unknown")
      } else {
        const mockData = {
          name: "Sarah Bennett",
          skills: ["Project Management", "Agile Methodologies", "Scrum", "Team Leadership", "Strategic Planning"],
          work_experience: [
            "Lead Project Manager at Tech Solutions Inc., 2018 - Present",
            "Senior Analyst at Digital Corp, 2015 - 2018",
          ],
          education: [
            "Master of Business Administration (MBA) at Business School of Chicago, 2013 - 2015",
            "Bachelor of Science in Computer Science at State University, 2009 - 2013",
          ],
          languages: ["English", "Spanish", "French"],
        }
        setResumeData(mockData)
        setFileName("sample-resume.pdf")
      }
    } catch (err) {
      setError("Error loading resume data. Please try uploading again.")
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handlePrint = () => {
    window.print()
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading resume data...</p>
        </div>
      </div>
    )
  }

  if (error || !resumeData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Resume</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link href="/">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">Upload New Resume</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-gray-200 bg-white px-6 py-4 md:px-10">
        <div className="flex items-center gap-3 text-gray-900">
          <ResumeParserLogo className="h-8 w-8" />
          <h2 className="text-gray-900 text-xl font-bold leading-tight">Resume Parser</h2>
        </div>
        <div className="hidden md:flex items-center gap-4">
          <Link href="/">
            <Button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm font-semibold shadow-sm no-print">
              <Plus className="h-4 w-4" />
              New Resume
            </Button>
          </Link>
        </div>
        <Link href="/" className="md:hidden">
          <Button variant="ghost" size="sm" className="no-print">
            <Plus className="h-4 w-4" />
          </Button>
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 bg-gray-50 py-8 md:py-12">
        <div className="container mx-auto max-w-4xl px-4 md:px-6">
          <div className="bg-white rounded-lg shadow-md p-6 md:p-8">
            {/* Title and Actions Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-gray-200 pb-6 mb-6">
              <h1 className="text-gray-900 text-3xl font-bold leading-tight">Parsed Resume</h1>
              <div className="flex items-center gap-2 no-print">
                <Button
                  onClick={handlePrint}
                  variant="outline"
                  className="flex items-center gap-2 border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
                >
                  <Printer className="h-4 w-4" />
                  Print
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-8">
              {/* Skills Section */}
              {resumeData.skills && resumeData.skills.length > 0 && (
                <div>
                  <h2 className="flex items-center gap-3 text-xl font-bold text-gray-800 mb-4">
                    <Star className="w-6 h-6 text-blue-600" />
                    Skills
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {resumeData.skills.map((skill, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-x-1.5 rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Work Experience Section */}
              {resumeData.work_experience && resumeData.work_experience.length > 0 && (
                <div>
                  <h2 className="flex items-center gap-3 text-xl font-bold text-gray-800 mb-4">
                    <Briefcase className="w-6 h-6 text-blue-600" />
                    Work Experience
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {Array.isArray(resumeData.work_experience) ? (
                      resumeData.work_experience.map((experience, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-x-1.5 rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700"
                        >
                          {typeof experience === "string" ? experience : experience.text || JSON.stringify(experience)}
                        </span>
                      ))
                    ) : (
                      <span className="inline-flex items-center gap-x-1.5 rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">
                        {resumeData.work_experience}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Education Section */}
              {resumeData.education && resumeData.education.length > 0 && (
                <div>
                  <h2 className="flex items-center gap-3 text-xl font-bold text-gray-800 mb-4">
                    <GraduationCap className="w-6 h-6 text-blue-600" />
                    Education
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {Array.isArray(resumeData.education) ? (
                      resumeData.education.map((edu, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-x-1.5 rounded-full bg-purple-100 px-3 py-1 text-sm font-medium text-purple-700"
                        >
                          {typeof edu === "string" ? edu : edu.text || JSON.stringify(edu)}
                        </span>
                      ))
                    ) : (
                      <span className="inline-flex items-center gap-x-1.5 rounded-full bg-purple-100 px-3 py-1 text-sm font-medium text-purple-700">
                        {resumeData.education}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Languages Section */}
              {resumeData.languages && resumeData.languages.length > 0 && (
                <div>
                  <h2 className="flex items-center gap-3 text-xl font-bold text-gray-800 mb-4">
                    <Globe className="w-6 h-6 text-blue-600" />
                    Languages
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {Array.isArray(resumeData.languages) ? (
                      resumeData.languages.map((language, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-x-1.5 rounded-full bg-yellow-100 px-3 py-1 text-sm font-medium text-yellow-800"
                        >
                          {typeof language === "string" ? language : language.text || JSON.stringify(language)}
                        </span>
                      ))
                    ) : (
                      <span className="inline-flex items-center gap-x-1.5 rounded-full bg-yellow-100 px-3 py-1 text-sm font-medium text-yellow-800">
                        {resumeData.languages}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Show message if no data found */}
              {(!resumeData.skills || resumeData.skills.length === 0) &&
                (!resumeData.work_experience || resumeData.work_experience.length === 0) &&
                (!resumeData.education || resumeData.education.length === 0) &&
                (!resumeData.languages || resumeData.languages.length === 0) && (
                  <div className="text-center py-8">
                    <AlertCircle className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Data Extracted</h3>
                    <p className="text-gray-600">
                      We couldn't extract any information from your resume. Please try uploading a different format or a
                      clearer document.
                    </p>
                  </div>
                )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
