import { useEffect, useRef, useState } from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import type { FormData } from "@/lib/forms"
import { FileText, Info } from "lucide-react"

import "pdfjs-dist/web/pdf_viewer.css"
import { GlobalWorkerOptions } from "pdfjs-dist/build/pdf";

// Replace with your installed version (check `package.json`)
GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;


interface FormStatePanelProps {
  activeForm: FormData | null
  activePdf: File | null
  pdfFields?: { name: string; type: string }[]
  filledPdfFields?: Record<string, string>
}

export default function FormStatePanel({ activeForm, activePdf, pdfFields, filledPdfFields }: FormStatePanelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null)

useEffect(() => {
  if (typeof window === "undefined" || !activePdf) return

  const renderPdf = async () => {
    const { getDocument } = await import("pdfjs-dist")
    const fileReader = new FileReader()
    fileReader.onload = async function () {
      const typedarray = new Uint8Array(this.result as ArrayBuffer)
      const loadingTask = getDocument({ data: typedarray })
      const pdf = await loadingTask.promise
      setPdfDoc(pdf)

      const page = await pdf.getPage(1)
      const viewport = page.getViewport({ scale: 1.5 })
      const canvas = canvasRef.current
      if (canvas) {
        const context = canvas.getContext("2d")
        canvas.height = viewport.height
        canvas.width = viewport.width
        await page.render({ canvasContext: context!, viewport }).promise
      }
    }
    fileReader.readAsArrayBuffer(activePdf)
  }

  renderPdf()
}, [activePdf, pdfFields, filledPdfFields])


  if (!activeForm && !activePdf) {
    return (
      <Card className="h-full flex items-center justify-center border-dashed border-gray-300 dark:border-gray-700">
        <div className="text-center text-muted-foreground p-6">
          <Info className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">Form & PDF Context</h3>
          <p className="mt-1 text-sm">Select a form or upload a PDF to begin.</p>
          <p className="mt-1 text-sm">The current state will appear here.</p>
        </div>
      </Card>
    )
  }

  if (activePdf) {
    return (
      <Card className="h-full flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="mr-2 h-5 w-5 text-primary" />
            PDF Context Active
          </CardTitle>
          <CardDescription>Filename: {activePdf.name}</CardDescription>
        </CardHeader>
        <CardContent className="flex-grow overflow-y-auto">
          <div className="space-y-4 p-4 bg-muted/30 rounded-md">
            <p className="text-sm text-foreground">The SocialAgent will use this PDF as context for your questions.</p>
            <p className="text-xs text-muted-foreground">
              Size: {(activePdf.size / 1024).toFixed(2)} KB
              <br />
              Type: {activePdf.type}
            </p>
            <canvas ref={canvasRef} className="w-full border rounded" />
            {pdfFields && pdfFields.length > 0 && (
              <div className="mt-4 space-y-2">
                <h4 className="text-sm font-semibold text-foreground">Detected PDF Fields</h4>
                <ul className="text-sm space-y-1">
                  {pdfFields.map((field) => (
                    <li key={field.name} className="flex flex-col">
                      <span className="font-medium">{field.name}</span>
                      <span className="text-muted-foreground text-xs">
                        {field.type}
                        {filledPdfFields?.[field.name] ? ` — Value: "${filledPdfFields[field.name]}"` : ""}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (activeForm) {
    return (
      <Card className="h-full flex flex-col">
        <CardHeader>
          <CardTitle>{activeForm.name}</CardTitle>
          <CardDescription>Live view of the form fields.</CardDescription>
        </CardHeader>
        <CardContent className="flex-grow overflow-y-auto">
          <div className="space-y-4">
            {activeForm.fields.map((field) => (
              <div key={field.id}>
                <Label htmlFor={field.id} className="text-sm font-medium">
                  {field.label}
                </Label>
                <Input
                  id={field.id}
                  type={field.type}
                  value={field.value}
                  readOnly
                  className="mt-1 bg-input text-foreground placeholder:text-muted-foreground"
                  placeholder={field.value ? "" : "Awaiting answer..."}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return null // Should not happen if logic is correct
}
