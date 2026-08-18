/**
 * Innovix — Architecture Diagram
 *
 * Renders Mermaid diagrams from the generated architecture plan.
 * Falls back to a component list if Mermaid rendering fails.
 *
 * Uses mermaid.js for client-side rendering (loaded dynamically).
 */

import React, { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Layers, AlertTriangle, Cpu, ZoomIn, ZoomOut, Maximize2, X, Download, Code2, Save, ExternalLink } from 'lucide-react'

interface ArchitectureDiagramProps {
  architecture?: Record<string, unknown>
  onUpdate?: (newMermaid: string) => void
}

/**
 * Sanitize AI-generated Mermaid code to fix common syntax issues.
 * The AI often generates labels with special characters (&, quotes, parentheses)
 * that break the Mermaid parser.
 */
function sanitizeMermaid(raw: string): string {
  let code = raw.replace(/\\n/g, '\n')

  // Fix labels that contain special chars but aren't quoted
  // Match node definitions like: NodeId[Label with & or (parentheses)]
  // and wrap inner content in quotes if it contains problematic chars
  code = code.replace(
    /(\w+)\[([^\]"]*[&()][^\]"]*)\]/g,
    (_match, id, label) => `${id}["${label.replace(/"/g, "'")}"]`
  )
  code = code.replace(
    /(\w+)\(([^)"]*[&\[\]"][^)"]*)\)/g,
    (_match, id, label) => `${id}("${label.replace(/"/g, "'")}")`
  )

  // Fix double-quoted labels that have internal quotes
  code = code.replace(
    /(\w+)\["([^"]*)"([^"]*)"([^"]*)"\]/g,
    (_match, id, a, b, c) => `${id}["${a}'${b}'${c}"]`
  )

  // Remove any HTML tags that might sneak in
  code = code.replace(/<br\s*\/?>/gi, '\\n')
  code = code.replace(/<[^>]+>/g, '')

  return code
}

export default function ArchitectureDiagram({ architecture, onUpdate }: ArchitectureDiagramProps) {
  const [renderError, setRenderError] = useState(false)
  const [isCodeMode, setIsCodeMode] = useState(false)
  const mermaidCode = architecture?.mermaid_diagram as string | undefined
  const [editableCode, setEditableCode] = useState(mermaidCode || '')

  useEffect(() => {
    setEditableCode(mermaidCode || '')
  }, [mermaidCode])

  const [mermaidLoaded, setMermaidLoaded] = useState(false)
  const [zoom, setZoom] = useState(1)
  const containerRef = useRef<HTMLDivElement>(null)
  const modalContainerRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 })

  const handleMouseDown = (e: React.MouseEvent, ref: React.RefObject<HTMLDivElement>) => {
    if (e.button !== 0 || !ref.current) return
    setIsDragging(true)
    setDragStart({ 
      x: e.clientX, 
      y: e.clientY, 
      scrollLeft: ref.current.scrollLeft, 
      scrollTop: ref.current.scrollTop 
    })
  }

  const handleMouseMove = (e: React.MouseEvent, ref: React.RefObject<HTMLDivElement>) => {
    if (!isDragging || !ref.current) return
    const dx = e.clientX - dragStart.x
    const dy = e.clientY - dragStart.y
    ref.current.scrollLeft = dragStart.scrollLeft - dx
    ref.current.scrollTop = dragStart.scrollTop - dy
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleTouchStart = (e: React.TouchEvent, ref: React.RefObject<HTMLDivElement>) => {
    if (e.touches.length !== 1 || !ref.current) return
    setIsDragging(true)
    setDragStart({ 
      x: e.touches[0]!.clientX, 
      y: e.touches[0]!.clientY, 
      scrollLeft: ref.current.scrollLeft, 
      scrollTop: ref.current.scrollTop 
    })
  }

  const handleTouchMove = (e: React.TouchEvent, ref: React.RefObject<HTMLDivElement>) => {
    if (!isDragging || e.touches.length !== 1 || !ref.current) return
    const dx = e.touches[0]!.clientX - dragStart.x
    const dy = e.touches[0]!.clientY - dragStart.y
    ref.current.scrollLeft = dragStart.scrollLeft - dx
    ref.current.scrollTop = dragStart.scrollTop - dy
  }

  const components = architecture?.components as Record<string, unknown>[] | undefined
  const patterns = architecture?.design_patterns as Record<string, unknown>[] | undefined
  const deployNotes = architecture?.deployment_notes as string | undefined

  // Load and render mermaid diagram — stores SVG string in state to avoid DOM conflicts
  const [svgContent, setSvgContent] = useState<string | null>(null)

  useEffect(() => {
    // Re-render when either the real mermaidCode or the editableCode changes (if in code mode)
    const codeToRender = isCodeMode ? editableCode : mermaidCode
    if (!codeToRender) return

    let cancelled = false

    const renderMermaid = async () => {
      try {
        const mermaid = await import('mermaid')
        mermaid.default.initialize({
          startOnLoad: false,
          theme: 'dark',
          themeVariables: {
            primaryColor: '#6c3ce9',
            primaryTextColor: '#e0e0e0',
            primaryBorderColor: '#8b5cf6',
            lineColor: '#6c3ce9',
            secondaryColor: '#1e1e3f',
            tertiaryColor: '#2a2a4a',
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: '12px',
          },
          flowchart: {
            curve: 'basis',
            padding: 15,
          },
        })

        if (cancelled) return

        const cleanCode = sanitizeMermaid(codeToRender)
        const id = `mermaid-offscreen-${Date.now()}`

        // Render in a completely detached off-screen element
        const offscreen = document.createElement('div')
        offscreen.id = id
        offscreen.style.position = 'absolute'
        offscreen.style.left = '-9999px'
        offscreen.style.top = '-9999px'
        document.body.appendChild(offscreen)

        try {
          const { svg } = await mermaid.default.render(id, cleanCode)
          if (!cancelled) {
            setSvgContent(svg)
            setMermaidLoaded(true)
          }
        } finally {
          // Remove the off-screen element
          try { offscreen.remove() } catch { /* ignore */ }
          // Also remove any leftover mermaid temp elements
          const leftover = document.getElementById('d' + id)
          if (leftover) try { leftover.remove() } catch { /* ignore */ }
        }
      } catch (err) {
        console.warn('Mermaid render failed:', err)
        if (!cancelled) {
          setRenderError(true)
        }
      }
    }

    renderMermaid()
    return () => { cancelled = true }
  }, [mermaidCode, editableCode, isCodeMode])

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [showDownloadMenu, setShowDownloadMenu] = useState(false)
  const [showModalDownloadMenu, setShowModalDownloadMenu] = useState(false)

  const handleZoomIn = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setZoom((prevZoom) => {
      const nextZoom = Math.round((prevZoom + 0.2) * 10) / 10
      return nextZoom >= 3 ? 3 : nextZoom
    })
  }

  const handleZoomOut = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setZoom((prevZoom) => {
      const nextZoom = Math.round((prevZoom - 0.2) * 10) / 10
      return nextZoom <= 0.5 ? 0.5 : nextZoom
    })
  }

  const openExternalEditor = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!svgContent || !mermaidCode) return
    
    // We encode the mermaid string into base64 to pass it via URL to Mermaid Live Editor
    // Mermaid Live allows an easy drag/drop/export flow using a base64 state object.
    const state = {
      code: mermaidCode,
      mermaid: { theme: 'dark' },
      autoSync: true,
      updateDiagram: true
    }
    const b64 = btoa(unescape(encodeURIComponent(JSON.stringify(state))))
    window.open(`https://mermaid.live/edit#base64:${b64}`, '_blank', 'noopener,noreferrer')
  }

  const downloadImage = (format: 'png' | 'jpeg', e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    if (!svgContent) return
    
    try {
      const parser = new DOMParser()
      const doc = parser.parseFromString(svgContent, 'image/svg+xml')
      const svgEl = doc.querySelector('svg')
      
      if (!svgEl) {
        console.error('No SVG found')
        return
      }

      // Ensure SVG has explicit width/height
      const viewBox = svgEl.getAttribute('viewBox')
      let w = 800
      let h = 600
      if (viewBox) {
        const parts = viewBox.split(' ')
        if (parts.length === 4) {
          w = parseFloat(parts[2]!) || w
          h = parseFloat(parts[3]!) || h
        }
      }
      svgEl.setAttribute('width', String(w))
      svgEl.setAttribute('height', String(h))
      
      // Ensure namespace is present
      if (!svgEl.getAttribute('xmlns')) {
        svgEl.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
      }

      const finalSvg = new XMLSerializer().serializeToString(svgEl)
      
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()
      
      // Convert to base64 to avoid characters breaking the image loading
      const svgBase64 = btoa(unescape(encodeURIComponent(finalSvg)))
      const svgUrl = `data:image/svg+xml;base64,${svgBase64}`
      
      img.onload = () => {
        canvas.width = w * 2
        canvas.height = h * 2
        if (ctx) {
          ctx.fillStyle = '#1e1e3f' // Match Mermaid dark theme background
          ctx.fillRect(0, 0, canvas.width, canvas.height)
          ctx.scale(2, 2)
          ctx.drawImage(img, 0, 0)
          
          try {
            const dataUrl = canvas.toDataURL(`image/${format}`, 0.95)
            const a = document.createElement('a')
            a.download = `architecture.${format}`
            a.href = dataUrl
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
          } catch (err) {
            console.error('Canvas export error:', err)
            alert('Could not export image due to browser security restrictions.')
          }
        }
      }
      
      img.onerror = () => {
        console.error('Image load error: The SVG might contain invalid tags.')
        alert('Failed to process diagram image.')
      }
      
      img.src = svgUrl
    } catch (err) {
      console.error('Download setup error:', err)
    }
  }

  if (!architecture || Object.keys(architecture).length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-4 text-center bg-slate-50/50 dark:bg-[#111827]/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
        <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 shadow-sm border border-slate-100 dark:border-slate-700">
          <Layers className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="text-base font-semibold text-slate-700 dark:text-slate-300 mb-1.5">No Architecture Data</h3>
        <p className="text-sm text-slate-500 max-w-sm">
          Generate a full project plan to visualize your system's layout.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Mermaid Diagram */}
      {mermaidCode && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl overflow-hidden"
        >
          <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
            <span className="text-sm font-semibold flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              System Architecture Diagram
            </span>
            <div className="flex items-center gap-2">
              {onUpdate && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setIsCodeMode(!isCodeMode)
                    // Reset editable code if cancelling
                    if (isCodeMode) setEditableCode(mermaidCode || '')
                  }}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs transition-colors ${
                    isCodeMode
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-slate-50 dark:bg-slate-800/50 text-muted-foreground hover:text-foreground hover:bg-slate-100 dark:bg-slate-800'
                  }`}
                  title="Edit Mermaid Code"
                >
                  <Code2 className="w-3 h-3" />
                  {isCodeMode ? 'Cancel Edit' : 'Edit Code'}
                </button>
              )}
              {isCodeMode && onUpdate && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onUpdate(editableCode)
                    setIsCodeMode(false)
                  }}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs bg-green-600 text-white hover:bg-green-700 transition-colors"
                  title="Save Changes"
                >
                  <Save className="w-3 h-3" />
                  Save
                </button>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); setIsModalOpen(true); }}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs
                           bg-slate-50 dark:bg-slate-800/50 text-muted-foreground hover:text-foreground
                           hover:bg-slate-100 dark:bg-slate-800 transition-colors"
                title="View Fullscreen"
              >
                <Maximize2 className="w-3 h-3" />
              </button>
            </div>
          </div>

          {!renderError ? (
            <div className="relative overflow-hidden bg-slate-50 dark:bg-[#0B1120] rounded-b-xl border-t border-slate-200 dark:border-slate-800">
              {/* Zoom & Download Controls */}
              <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
                <div className="flex flex-col bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden shadow-sm">
                  <button onClick={handleZoomIn} disabled={zoom >= 3} className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors border-b border-slate-200 dark:border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed" title="Zoom In">
                    <ZoomIn className="w-4 h-4" />
                  </button>
                  <button onClick={handleZoomOut} disabled={zoom <= 0.5} className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" title="Zoom Out">
                    <ZoomOut className="w-4 h-4" />
                  </button>
                </div>
                <div className="relative">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowDownloadMenu(!showDownloadMenu)
                    }} 
                    className="flex items-center justify-center p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-sm" 
                    title="Download Image"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={openExternalEditor}
                    className="flex items-center justify-center p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-sm mt-2" 
                    title="Open in Visual Editor"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                  {showDownloadMenu && (
                    <div className="absolute top-0 right-10 flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden whitespace-nowrap z-20 shadow-xl">
                      <button 
                        onClick={(e) => {
                          downloadImage('png', e)
                          setShowDownloadMenu(false)
                        }} 
                        className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border-b border-slate-200 dark:border-slate-700 text-left"
                      >
                        Download PNG
                      </button>
                      <button 
                        onClick={(e) => {
                          downloadImage('jpeg', e)
                          setShowDownloadMenu(false)
                        }} 
                        className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left"
                      >
                        Download JPEG
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div className={`p-0 flex ${isCodeMode ? 'flex-col md:flex-row' : ''} w-full bg-slate-50 dark:bg-[#0B1120]`}>
                {isCodeMode && (
                  <div className="w-full md:w-1/2 min-h-[300px] border-r border-slate-200 dark:border-slate-800 p-4">
                    <h4 className="text-xs font-semibold mb-2 text-slate-500 uppercase">Mermaid Code</h4>
                    <textarea
                      value={editableCode}
                      onChange={(e) => setEditableCode(e.target.value)}
                      className="w-full h-full min-h-[400px] bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-4 font-mono text-xs text-slate-700 dark:text-slate-300 outline-none focus:border-blue-500 resize-none"
                      spellCheck={false}
                    />
                  </div>
                )}
                <div
                  ref={containerRef}
                  onMouseDown={(e) => handleMouseDown(e, containerRef)}
                  onMouseMove={(e) => handleMouseMove(e, containerRef)}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  onTouchStart={(e) => handleTouchStart(e, containerRef)}
                  onTouchMove={(e) => handleTouchMove(e, containerRef)}
                  onTouchEnd={handleMouseUp}
                  onTouchCancel={handleMouseUp}
                  className={`flex-1 p-6 flex justify-center items-center min-h-[400px] 
                             [&_svg]:max-w-none [&_svg]:h-auto transition-colors select-none overflow-auto touch-pan-x touch-pan-y
                             ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
                >
                {mermaidLoaded && svgContent ? (
                  <div className="p-8">
                    <div
                      className="[&_svg]:max-w-none [&_svg]:h-auto pointer-events-none transition-transform duration-200"
                      style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}
                      dangerouslySetInnerHTML={{ __html: svgContent }}
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="w-4 h-4 border-2 border-violet-400/30 border-t-violet-400 rounded-full animate-spin" />
                    Rendering diagram...
                  </div>
                )}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6">
              <div className="flex items-center gap-2 text-amber-400 text-xs mb-3">
                <AlertTriangle className="w-4 h-4" />
                Diagram render failed — showing raw Mermaid code
              </div>
              <pre className="text-xs text-muted-foreground bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg overflow-x-auto">
                {mermaidCode.replace(/\\n/g, '\n')}
              </pre>
            </div>
          )}
        </motion.div>
      )}

      {/* Component Breakdown */}
      {components && components.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl p-4"
        >
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-cyan-400" />
            Component Breakdown
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {components.map((comp, idx) => {
              const typeColor: Record<string, string> = {
                frontend: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
                backend: 'text-green-400 bg-green-500/10 border-green-500/20',
                database: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
                service: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/30',
                external: 'text-gray-400 bg-gray-500/10 border-gray-500/20',
              }
              const color = typeColor[comp.type as string] || typeColor.service

              return (
                <div
                  key={idx}
                  className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800"
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="font-medium text-xs">{comp.name as string}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${color}`}>
                      {(comp.type as string)?.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">
                    {comp.description as string}
                  </p>
                  {(comp.technologies as string[] | undefined)?.length && (
                    <div className="flex flex-wrap gap-1">
                      {(comp.technologies as string[]).map((tech, i) => (
                        <span
                          key={i}
                          className="text-[10px] px-1.5 py-0.5 rounded bg-slate-50 dark:bg-slate-800/50 text-muted-foreground"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </motion.div>
      )}

      {/* Design Patterns */}
      {patterns && patterns.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl p-4"
        >
          <h3 className="text-sm font-semibold mb-3">🧩 Design Patterns</h3>
          <div className="space-y-2">
            {patterns.map((p, idx) => (
              <div key={idx} className="flex flex-col gap-1 text-xs p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <span className="font-semibold text-blue-600 dark:text-blue-400">
                  {p.pattern as string}
                </span>
                <span className="text-muted-foreground leading-relaxed mt-0.5">
                  <strong className="text-slate-600 dark:text-slate-300 font-medium">Where:</strong> {p.where as string}
                </span>
                <span className="text-muted-foreground leading-relaxed">
                  <strong className="text-slate-600 dark:text-slate-300 font-medium">Why:</strong> {p.why as string}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Deployment Notes */}
      {deployNotes && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="p-4 rounded-xl bg-violet-500/5 border border-blue-100 dark:border-blue-500/20 text-xs text-muted-foreground"
        >
          <span className="font-medium text-blue-600 dark:text-blue-400">🚀 Deployment Notes:</span>{' '}
          {deployNotes}
        </motion.div>
      )}

      {/* Fullscreen Modal */}
      <AnimatePresence>
        {isModalOpen && svgContent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-50 dark:bg-[#0B1120]/90 backdrop-blur-sm"
            onClick={() => setIsModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-5xl max-h-[90vh] bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl overflow-hidden flex flex-col shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  System Architecture
                </h3>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="p-2 rounded-lg hover:bg-slate-100 dark:bg-slate-800 text-muted-foreground hover:text-white transition-colors ml-2"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="relative flex-1 flex flex-col overflow-hidden bg-slate-100 dark:bg-slate-900">
                <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
                  <div className="flex flex-col bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden shadow-sm">
                    <button onClick={handleZoomIn} disabled={zoom >= 3} className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors border-b border-slate-200 dark:border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed" title="Zoom In">
                      <ZoomIn className="w-4 h-4" />
                    </button>
                    <button onClick={handleZoomOut} disabled={zoom <= 0.5} className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" title="Zoom Out">
                      <ZoomOut className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="relative">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation()
                        setShowModalDownloadMenu(!showModalDownloadMenu)
                      }} 
                      className="flex items-center justify-center p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-sm" 
                      title="Download Image"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={openExternalEditor}
                      className="flex items-center justify-center p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-sm mt-2" 
                      title="Open in Visual Editor"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                    {showModalDownloadMenu && (
                      <div className="absolute top-0 right-10 flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden whitespace-nowrap z-20 shadow-xl">
                        <button 
                          onClick={(e) => {
                            downloadImage('png', e)
                            setShowModalDownloadMenu(false)
                          }} 
                          className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border-b border-slate-200 dark:border-slate-700 text-left"
                        >
                          Download PNG
                        </button>
                        <button 
                          onClick={(e) => {
                            downloadImage('jpeg', e)
                            setShowModalDownloadMenu(false)
                          }} 
                          className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left"
                        >
                          Download JPEG
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div 
                  ref={modalContainerRef}
                  className={`flex-1 p-6 flex justify-center items-center overflow-auto select-none touch-pan-x touch-pan-y
                             ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
                  onMouseDown={(e) => handleMouseDown(e, modalContainerRef)}
                  onMouseMove={(e) => handleMouseMove(e, modalContainerRef)}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  onTouchStart={(e) => handleTouchStart(e, modalContainerRef)}
                  onTouchMove={(e) => handleTouchMove(e, modalContainerRef)}
                  onTouchEnd={handleMouseUp}
                  onTouchCancel={handleMouseUp}
                >
                  <div className="p-8">
                    <div
                      className="[&_svg]:max-w-none [&_svg]:h-auto pointer-events-none transition-transform duration-200"
                      style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}
                      dangerouslySetInnerHTML={{ __html: svgContent }}
                    />
                  </div>
              </div>
            </div>
          </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
