// components/PdfPreview.tsx
"use client"

import { useEffect, useRef } from "react"
import { getDocument, GlobalWorkerOptions, PDFDocumentProxy } from "pdfjs-dist"
import "pdfjs-dist/web/pdf_viewer.css"

// 👇 if using Webpack 5 (Next.js default)
GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`

interface PdfPreviewProps {
  file: File
}

export default function PdfPreview({ file }: PdfPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const renderPdf = async () => {
      const arrayBuffer = await file.arrayBuffer()
      const loadingTask = getDocument({ data: arrayBuffer })
      const pdf: PDFDocumentProxy = await loadingTask.promise
      const page = await pdf.getPage(1)

      const viewport = page.getViewport({ scale: 1.5 })
      const canvas = canvasRef.current
      if (!canvas) return

      const context = canvas.getContext("2d")
      canvas.height = viewport.height
      canvas.width = viewport.width

      const renderContext = {
        canvasContext: context!,
        viewport,
      }

      await page.render(renderContext).promise
    }

    renderPdf().catch(console.error)
  }, [file])

  return (
    <div className="p-4">
      <canvas ref={canvasRef} className="border rounded shadow" />
    </div>
  )
}
