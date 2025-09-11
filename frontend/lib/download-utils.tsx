import type { ParsedResumeData } from "./api"

export function downloadAsJSON(data: ParsedResumeData, fileName: string) {
  const jsonString = JSON.stringify(data, null, 2)
  const blob = new Blob([jsonString], { type: "application/json" })
  const url = URL.createObjectURL(blob)

  const link = document.createElement("a")
  link.href = url
  link.download = `${fileName}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function downloadAsText(data: ParsedResumeData, fileName: string) {
  let textContent = `${data.name}'s Resume\n\n`

  if (data.skills && data.skills.length > 0) {
    textContent += "SKILLS:\n"
    textContent += data.skills.join(", ") + "\n\n"
  }

  if (data.work_experience && data.work_experience.length > 0) {
    textContent += "WORK EXPERIENCE:\n"
    data.work_experience.forEach((exp, index) => {
      const expText = typeof exp === "string" ? exp : exp.text || JSON.stringify(exp)
      textContent += `${index + 1}. ${expText}\n`
    })
    textContent += "\n"
  }

  if (data.education && data.education.length > 0) {
    textContent += "EDUCATION:\n"
    data.education.forEach((edu, index) => {
      const eduText = typeof edu === "string" ? edu : edu.text || JSON.stringify(edu)
      textContent += `${index + 1}. ${eduText}\n`
    })
    textContent += "\n"
  }

  if (data.languages && data.languages.length > 0) {
    textContent += "LANGUAGES:\n"
    data.languages.forEach((lang, index) => {
      const langText = typeof lang === "string" ? lang : lang.text || JSON.stringify(lang)
      textContent += `${index + 1}. ${langText}\n`
    })
  }

  const blob = new Blob([textContent], { type: "text/plain" })
  const url = URL.createObjectURL(blob)

  const link = document.createElement("a")
  link.href = url
  link.download = `${fileName}.txt`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function downloadAsPDF(data: ParsedResumeData, fileName: string) {
  // For PDF generation, we'll use the browser's print functionality
  // Create a new window with formatted content
  const printWindow = window.open("", "_blank")

  if (!printWindow) {
    alert("Please allow popups to download PDF")
    return
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${data.name}'s Resume</title>
      <style>
        body { 
          font-family: Arial, sans-serif; 
          margin: 40px; 
          line-height: 1.6; 
          color: #333;
        }
        h1 { 
          color: #2563eb; 
          border-bottom: 2px solid #2563eb; 
          padding-bottom: 10px; 
        }
        h2 { 
          color: #1f2937; 
          margin-top: 30px; 
          margin-bottom: 15px; 
        }
        .section { 
          margin-bottom: 25px; 
        }
        .chip {
          display: inline-block;
          padding: 4px 12px;
          margin: 2px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 500;
        }
        .skills { background-color: #dbeafe; color: #1d4ed8; }
        .work { background-color: #dcfce7; color: #166534; }
        .education { background-color: #f3e8ff; color: #7c3aed; }
        .languages { background-color: #fef3c7; color: #d97706; }
        @media print {
          body { margin: 20px; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <h1>${data.name}'s Resume</h1>
      
      ${
        data.skills && data.skills.length > 0
          ? `
        <div class="section">
          <h2>Skills</h2>
          ${data.skills.map((skill) => `<span class="chip skills">${skill}</span>`).join("")}
        </div>
      `
          : ""
      }
      
      ${
        data.work_experience && data.work_experience.length > 0
          ? `
        <div class="section">
          <h2>Work Experience</h2>
          ${
            Array.isArray(data.work_experience)
              ? data.work_experience
                  .map((exp) => {
                    const expText = typeof exp === "string" ? exp : exp.text || JSON.stringify(exp)
                    return `<span class="chip work">${expText}</span>`
                  })
                  .join("")
              : `<span class="chip work">${data.work_experience}</span>`
          }
        </div>
      `
          : ""
      }
      
      ${
        data.education && data.education.length > 0
          ? `
        <div class="section">
          <h2>Education</h2>
          ${
            Array.isArray(data.education)
              ? data.education
                  .map((edu) => {
                    const eduText = typeof edu === "string" ? edu : edu.text || JSON.stringify(edu)
                    return `<span class="chip education">${eduText}</span>`
                  })
                  .join("")
              : `<span class="chip education">${data.education}</span>`
          }
        </div>
      `
          : ""
      }
      
      ${
        data.languages && data.languages.length > 0
          ? `
        <div class="section">
          <h2>Languages</h2>
          ${
            Array.isArray(data.languages)
              ? data.languages
                  .map((lang) => {
                    const langText = typeof lang === "string" ? lang : lang.text || JSON.stringify(lang)
                    return `<span class="chip languages">${langText}</span>`
                  })
                  .join("")
              : `<span class="chip languages">${data.languages}</span>`
          }
        </div>
      `
          : ""
      }
      
      <script>
        window.onload = function() {
          window.print();
          window.onafterprint = function() {
            window.close();
          }
        }
      </script>
    </body>
    </html>
  `

  printWindow.document.write(htmlContent)
  printWindow.document.close()
}
