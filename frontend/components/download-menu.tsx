"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Download, FileText, FileJson, Printer, ChevronDown } from "lucide-react"
import { downloadAsJSON, downloadAsText, downloadAsPDF } from "@/lib/download-utils"
import type { ParsedResumeData } from "@/lib/api"

interface DownloadMenuProps {
  resumeData: ParsedResumeData
  fileName: string
}

export function DownloadMenu({ resumeData, fileName }: DownloadMenuProps) {
  const [isDownloading, setIsDownloading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  const handleDownload = async (format: "json" | "txt" | "pdf") => {
    console.log("[v0] Download initiated for format:", format)
    setIsDownloading(true)

    try {
      const baseFileName = fileName.replace(/\.[^/.]+$/, "")

      switch (format) {
        case "json":
          downloadAsJSON(resumeData, baseFileName)
          break
        case "txt":
          downloadAsText(resumeData, baseFileName)
          break
        case "pdf":
          downloadAsPDF(resumeData, baseFileName)
          break
      }
      console.log("[v0] Download completed for format:", format)
    } catch (error) {
      console.error("Download failed:", error)
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
          disabled={isDownloading}
          onClick={() => {
            console.log("[v0] Download button clicked, current open state:", isOpen)
          }}
        >
          <Download className="h-4 w-4" />
          Download
          <ChevronDown className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem
          onClick={() => {
            console.log("[v0] JSON download clicked")
            handleDownload("json")
          }}
          className="flex items-center gap-2 cursor-pointer"
        >
          <FileJson className="h-4 w-4" />
          Download as JSON
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            console.log("[v0] Text download clicked")
            handleDownload("txt")
          }}
          className="flex items-center gap-2 cursor-pointer"
        >
          <FileText className="h-4 w-4" />
          Download as Text
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            console.log("[v0] PDF download clicked")
            handleDownload("pdf")
          }}
          className="flex items-center gap-2 cursor-pointer"
        >
          <Printer className="h-4 w-4" />
          Save as PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
