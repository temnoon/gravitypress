import { useState, useCallback } from 'react'
import { PolarGridConfig } from '@gravitypress/schemas'
import { renderPolarGridSVG } from '@gravitypress/core'

const defaultConfig: PolarGridConfig = {
  version: 1,
  paper: "LETTER",
  dpiPreview: 150,
  marginTop: 0.5,
  marginBottom: 0.5,
  marginInner: 0.6,
  marginOuter: 0.5,
  circles: 24,
  spokes: 24,
  circleThickness: [0.35],
  spokeThickness: [0.35],
  circleColorMode: "SOLID",
  spokeColorMode: "SOLID",
  circleSolid: "#000000",
  spokeSolid: "#000000",
  rainbowStartHue: 0,
  rainbowEndHue: 360,
  spokeStartCircles: []
}

function App() {
  const [config, setConfig] = useState<PolarGridConfig>(defaultConfig)
  const [svgOutput, setSvgOutput] = useState<string>('')

  const handleGenerate = useCallback(() => {
    const svg = renderPolarGridSVG(config)
    setSvgOutput(svg)
  }, [config])

  const handleDownloadSVG = useCallback(() => {
    if (!svgOutput) return
    const blob = new Blob([svgOutput], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'polar-grid.svg'
    a.click()
    URL.revokeObjectURL(url)
  }, [svgOutput])

  const handleSaveLocal = useCallback(() => {
    localStorage.setItem('gravitypress-config', JSON.stringify(config))
    alert('Configuration saved locally')
  }, [config])

  const handleLoadLocal = useCallback(() => {
    const saved = localStorage.getItem('gravitypress-config')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setConfig(parsed)
      } catch {
        alert('Failed to load configuration')
      }
    }
  }, [])

  return (
    <div className="app">
      <header>
        <h1>GravityPress</h1>
        <p>Polar Graph Designer</p>
      </header>

      <main>
        <section className="controls">
          <h2>Configuration</h2>

          <div className="control-group">
            <label>
              Paper Size:
              <select
                value={config.paper}
                onChange={(e) => setConfig({...config, paper: e.target.value as "LETTER" | "A4"})}
              >
                <option value="LETTER">Letter (8.5×11")</option>
                <option value="A4">A4 (210×297mm)</option>
              </select>
            </label>
          </div>

          <div className="control-group">
            <label>
              Circles:
              <input
                type="number"
                min="1"
                max="400"
                value={config.circles}
                onChange={(e) => setConfig({...config, circles: parseInt(e.target.value) || 1})}
              />
            </label>
          </div>

          <div className="control-group">
            <label>
              Spokes:
              <input
                type="number"
                min="1"
                max="360"
                value={config.spokes}
                onChange={(e) => setConfig({...config, spokes: parseInt(e.target.value) || 1})}
              />
            </label>
          </div>

          <div className="control-group">
            <label>
              Circle Color:
              <input
                type="color"
                value={config.circleSolid}
                onChange={(e) => setConfig({...config, circleSolid: e.target.value})}
              />
            </label>
          </div>

          <div className="control-group">
            <label>
              Spoke Color:
              <input
                type="color"
                value={config.spokeSolid}
                onChange={(e) => setConfig({...config, spokeSolid: e.target.value})}
              />
            </label>
          </div>

          <div className="button-group">
            <button onClick={handleGenerate}>Generate Preview</button>
            <button onClick={handleDownloadSVG} disabled={!svgOutput}>Download SVG</button>
          </div>

          <div className="button-group">
            <button onClick={handleSaveLocal}>Save Locally</button>
            <button onClick={handleLoadLocal}>Load Local</button>
          </div>
        </section>

        <section className="preview">
          <h2>Preview</h2>
          {svgOutput ? (
            <div
              className="svg-container"
              dangerouslySetInnerHTML={{ __html: svgOutput }}
            />
          ) : (
            <div className="placeholder">
              Click "Generate Preview" to see your polar grid
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

export default App
