import type { LinedPageConfig } from "@gravitypress/schemas";

interface Props {
  config: LinedPageConfig;
  onChange: (config: LinedPageConfig) => void;
}

const SPACING_PRESETS = [
  { label: "Narrow (5mm)", value: 0.1967 },
  { label: "College (5/16\")", value: 0.3125 },
  { label: "Wide (11/32\")", value: 0.3438 },
  { label: "Legal (11/32\")", value: 0.3438 },
  { label: "Extra Wide (7/16\")", value: 0.4375 },
];

export function LinedConfigurator({ config, onChange }: Props) {
  const set = (u: Partial<LinedPageConfig>) => onChange({ ...config, ...u } as LinedPageConfig);

  return (
    <div className="configurator">
      <h4>Lined Page Designer</h4>

      <fieldset className="config-section">
        <legend>Lines</legend>

        <label className="form-field">
          <span>Spacing Preset</span>
          <select value="" onChange={(e) => { if (e.target.value) set({ lineSpacing: +e.target.value }); }}>
            <option value="">Custom ({(config.lineSpacing * 25.4).toFixed(1)}mm)</option>
            {SPACING_PRESETS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
        </label>

        <label className="form-field">
          <span>Line Spacing <em className="config-val">{(config.lineSpacing * 25.4).toFixed(1)}mm</em></span>
          <input type="range" min={0.1} max={0.6} step={0.01} value={config.lineSpacing}
            onChange={(e) => set({ lineSpacing: +e.target.value })} />
        </label>

        <label className="form-field">
          <span>Line Color</span>
          <div className="color-field">
            <input type="color" value={config.lineColor} onChange={(e) => set({ lineColor: e.target.value })} />
            <input type="text" value={config.lineColor} className="color-hex"
              onChange={(e) => set({ lineColor: e.target.value })} />
          </div>
        </label>

        <label className="form-field">
          <span>Thickness <em className="config-val">{config.lineThickness}pt</em></span>
          <input type="range" min={0.1} max={3} step={0.1} value={config.lineThickness}
            onChange={(e) => set({ lineThickness: +e.target.value })} />
        </label>
      </fieldset>

      <fieldset className="config-section">
        <legend>Margin Line</legend>

        <label className="form-field inline">
          <input type="checkbox" checked={config.showMarginLine}
            onChange={(e) => set({ showMarginLine: e.target.checked })} />
          <span>Show margin line</span>
        </label>

        {config.showMarginLine && (
          <>
            <label className="form-field">
              <span>Position <em className="config-val">{config.marginLinePosition}"</em></span>
              <input type="range" min={0.5} max={2} step={0.05} value={config.marginLinePosition}
                onChange={(e) => set({ marginLinePosition: +e.target.value })} />
            </label>
            <label className="form-field">
              <span>Color</span>
              <div className="color-field">
                <input type="color" value={config.marginLineColor}
                  onChange={(e) => set({ marginLineColor: e.target.value })} />
                <input type="text" value={config.marginLineColor} className="color-hex"
                  onChange={(e) => set({ marginLineColor: e.target.value })} />
              </div>
            </label>
          </>
        )}
      </fieldset>

      <fieldset className="config-section">
        <legend>Header Line</legend>
        <label className="form-field inline">
          <input type="checkbox" checked={config.showHeaderLine}
            onChange={(e) => set({ showHeaderLine: e.target.checked })} />
          <span>Show header line (thicker top line)</span>
        </label>
        {config.showHeaderLine && (
          <label className="form-field">
            <span>Offset from top <em className="config-val">{config.headerLineOffset}"</em></span>
            <input type="range" min={0} max={1.5} step={0.05} value={config.headerLineOffset}
              onChange={(e) => set({ headerLineOffset: +e.target.value })} />
          </label>
        )}
      </fieldset>

      <fieldset className="config-section">
        <legend>Margins (inches)</legend>
        <div className="form-row">
          <label className="form-field"><span>Top</span>
            <input type="number" step={0.05} min={0} max={3} value={config.marginTop}
              onChange={(e) => set({ marginTop: +e.target.value })} /></label>
          <label className="form-field"><span>Bottom</span>
            <input type="number" step={0.05} min={0} max={3} value={config.marginBottom}
              onChange={(e) => set({ marginBottom: +e.target.value })} /></label>
        </div>
        <div className="form-row">
          <label className="form-field"><span>Left</span>
            <input type="number" step={0.05} min={0} max={3} value={config.marginLeft}
              onChange={(e) => set({ marginLeft: +e.target.value })} /></label>
          <label className="form-field"><span>Right</span>
            <input type="number" step={0.05} min={0} max={3} value={config.marginRight}
              onChange={(e) => set({ marginRight: +e.target.value })} /></label>
        </div>
      </fieldset>
    </div>
  );
}
