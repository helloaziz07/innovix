/**
 * Innovix — Architecture Diagram
 *
 * Renders Mermaid diagrams from the generated architecture plan.
 * Falls back to a component list if Mermaid rendering fails.
 *
 * Uses mermaid.js for client-side rendering (loaded dynamically).
 */

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Layers, AlertTriangle, Cpu, ZoomIn, ZoomOut, Maximize2, X, Download } from 'lucide-react'

interface ArchitectureDiagramProps {
  architecture?: Record<string, unknown>
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

export default function ArchitectureDiagram({ architecture }: ArchitectureDiagramProps) {
  const [renderError, setRenderError] = useState(false)

  const [mermaidLoaded, setMermaidLoaded] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [showDownloadMenu, setShowDownloadMenu] = useState(false)
  const [showModalDownloadMenu, setShowModalDownloadMenu] = useState(false)

  const mermaidCode = architecture?.mermaid_diagram as string | undefined
  const components = architecture?.components as Record<string, unknown>[] | undefined
  const patterns = architecture?.design_patterns as Record<string, unknown>[] | undefined
  const deployNotes = architecture?.deployment_notes as string | undefined

  // Load and render mermaid diagram — stores SVG string in state to avoid DOM conflicts
  const [svgContent, setSvgContent] = useState<string | null>(null)

  useEffect(() => {
    if (!mermaidCode) return

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

        const cleanCode = sanitizeMermaid(mermaidCode)
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
  }, [mermaidCode])



  const handleZoomIn = (e: React.MouseEvent) => {
    e.stopPropagation()
    setZoom((z) => Math.min(z + 0.25, 3))
  }

  const handleZoomOut = (e: React.MouseEvent) => {
    e.stopPropagation()
    setZoom((z) => Math.max(z - 0.25, 0.5))
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

  if (!architecture) {
    return (
      <div className="glass-card rounded-xl p-8 text-center">
        <Layers className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">
          No architecture data available. Generate a plan first.
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
          className="glass-card rounded-xl overflow-hidden"
        >
          <div className="flex items-center justify-between p-4 border-b border-white/5">
            <span className="text-sm font-semibold flex items-center gap-2">
              <Layers className="w-4 h-4 text-violet-400" />
              System Architecture Diagram
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => { e.stopPropagation(); setIsModalOpen(true); }}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs
                           bg-white/5 text-muted-foreground hover:text-foreground
                           hover:bg-white/10 transition-colors"
                title="View Fullscreen"
              >
                <Maximize2 className="w-3 h-3" />
              </button>
            </div>
          </div>

          {!renderError ? (
            <div className="relative">
              {/* Zoom & Download Controls */}
              <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
                <div className="flex flex-col bg-black/40 backdrop-blur-md border border-white/10 rounded-lg overflow-hidden">
                  <button onClick={handleZoomIn} className="p-2 text-muted-foreground hover:text-white hover:bg-white/10 transition-colors border-b border-white/10" title="Zoom In">
                    <ZoomIn className="w-4 h-4" />
                  </button>
                  <button onClick={handleZoomOut} className="p-2 text-muted-foreground hover:text-white hover:bg-white/10 transition-colors" title="Zoom Out">
                    <ZoomOut className="w-4 h-4" />
                  </button>
                </div>
                <div className="relative">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowDownloadMenu(!showDownloadMenu)
                    }} 
                    className="flex items-center justify-center p-2 bg-black/40 backdrop-blur-md border border-white/10 rounded-lg text-muted-foreground hover:text-white hover:bg-white/10 transition-colors" 
                    title="Download Image"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  {showDownloadMenu && (
                    <div className="absolute top-0 right-10 flex flex-col bg-black/80 backdrop-blur-md border border-white/10 rounded-lg overflow-hidden whitespace-nowrap z-20 shadow-xl">
                      <button 
                        onClick={(e) => {
                          downloadImage('png', e)
                          setShowDownloadMenu(false)
                        }} 
                        className="px-4 py-2 text-xs font-medium text-muted-foreground hover:text-white hover:bg-white/10 transition-colors border-b border-white/10 text-left"
                      >
                        Download PNG
                      </button>
                      <button 
                        onClick={(e) => {
                          downloadImage('jpeg', e)
                          setShowDownloadMenu(false)
                        }} 
                        className="px-4 py-2 text-xs font-medium text-muted-foreground hover:text-white hover:bg-white/10 transition-colors text-left"
                      >
                        Download JPEG
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div
                onClick={() => setIsModalOpen(true)}
                className="p-6 flex justify-center overflow-x-auto min-h-[200px] cursor-pointer
                           [&_svg]:max-w-full [&_svg]:h-auto hover:bg-white/[0.02] transition-colors"
              >
                {mermaidLoaded && svgContent ? (
                  <motion.div
                    animate={{ scale: zoom }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    style={{ transformOrigin: 'center center' }}
                    dangerouslySetInnerHTML={{ __html: svgContent }}
                  />
                ) : (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="w-4 h-4 border-2 border-violet-400/30 border-t-violet-400 rounded-full animate-spin" />
                    Rendering diagram...
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-6">
              <div className="flex items-center gap-2 text-amber-400 text-xs mb-3">
                <AlertTriangle className="w-4 h-4" />
                Diagram render failed — showing raw Mermaid code
              </div>
              <pre className="text-xs text-muted-foreground bg-white/5 p-4 rounded-lg overflow-x-auto">
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
          className="glass-card rounded-xl p-4"
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
                service: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
                external: 'text-gray-400 bg-gray-500/10 border-gray-500/20',
              }
              const color = typeColor[comp.type as string] || typeColor.service

              return (
                <div
                  key={idx}
                  className="p-3 rounded-lg bg-white/5 border border-white/5"
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
                          className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-muted-foreground"
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
          className="glass-card rounded-xl p-4"
        >
          <h3 className="text-sm font-semibold mb-3">🧩 Design Patterns</h3>
          <div className="space-y-2">
            {patterns.map((p, idx) => (
              <div key={idx} className="flex items-start gap-3 text-xs">
                <span className="font-medium text-violet-300 whitespace-nowrap">
                  {p.pattern as string}
                </span>
                <span className="text-muted-foreground">
                  {p.where as string} — {p.why as string}
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
          className="p-4 rounded-xl bg-violet-500/5 border border-violet-500/10 text-xs text-muted-foreground"
        >
          <span className="font-medium text-violet-400">🚀 Deployment Notes:</span>{' '}
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
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/90 backdrop-blur-sm"
            onClick={() => setIsModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-5xl max-h-[90vh] glass-card rounded-2xl overflow-hidden flex flex-col shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Layers className="w-4 h-4 text-violet-400" />
                  System Architecture
                </h3>
                <div className="flex items-center gap-3">
                  <div className="flex bg-black/40 rounded-lg overflow-hidden border border-white/10">
                    <button onClick={handleZoomIn} className="p-2 hover:bg-white/10 text-muted-foreground hover:text-white transition-colors" title="Zoom In">
                      <ZoomIn className="w-4 h-4" />
                    </button>
                    <div className="w-px bg-white/10" />
                    <button onClick={handleZoomOut} className="p-2 hover:bg-white/10 text-muted-foreground hover:text-white transition-colors" title="Zoom Out">
                      <ZoomOut className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="relative">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation()
                        setShowModalDownloadMenu(!showModalDownloadMenu)
                      }}
                      className="p-2 flex items-center bg-black/40 rounded-lg border border-white/10 hover:bg-white/10 text-muted-foreground hover:text-white transition-colors" 
                      title="Download Image"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    {showModalDownloadMenu && (
                      <div className="absolute top-10 right-0 flex flex-col bg-black/80 backdrop-blur-md border border-white/10 rounded-lg overflow-hidden whitespace-nowrap z-20 shadow-xl mt-1">
                        <button 
                          onClick={(e) => {
                            downloadImage('png', e)
                            setShowModalDownloadMenu(false)
                          }} 
                          className="px-4 py-2 text-xs font-medium text-muted-foreground hover:text-white hover:bg-white/10 transition-colors border-b border-white/10 text-left"
                        >
                          Download PNG
                        </button>
                        <button 
                          onClick={(e) => {
                            downloadImage('jpeg', e)
                            setShowModalDownloadMenu(false)
                          }} 
                          className="px-4 py-2 text-xs font-medium text-muted-foreground hover:text-white hover:bg-white/10 transition-colors text-left"
                        >
                          Download JPEG
                        </button>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="p-2 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="p-8 flex-1 overflow-auto flex items-center justify-center bg-black/20">
                <motion.div
                  animate={{ scale: zoom }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  style={{ transformOrigin: 'center center' }}
                  className="[&_svg]:max-w-none [&_svg]:h-auto"
                  dangerouslySetInnerHTML={{ __html: svgContent }}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
