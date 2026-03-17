import type { DotGridConfig } from "@gravitypress/schemas";

interface Props {
  config: DotGridConfig;
  onChange: (config: DotGridConfig) => void;
}

export function DotConfigurator({ config, onChange }: Props) {
  const set = (u: Partial<DotGridConfig>) => onChange({ ...config, ...u } as DotGridConfig);

  return (
    <div className="configurator">
      <h4>Dot Grid Designer</h4>

      <fieldset className="config-section">
        <legend>Dots</legend>

        <label className="form-field">
          <span>Spacing <em className="config-val">{(config.dotSpacing * 25.4).toFixed(1)}mm</em></span>
          <input type="range" min={0.08} max={0.5} step={0.01} value={config.dotSpacing}
            onChange={(e) => set({ dotSpacing: +e.target.value })} />
        </label>

        <label className="form-field">
          <span>Dot Size <em className="config-val">{(config.dotRadius * 72).toFixed(1)}pt</em></span>
          <input type="range" min={0.005} max={0.04} step={0.001} value={config.dotRadius}
            onChange={(e) => set({ dotRadius: +e.target.value })} />
        </label>

        <label className="form-field">
          <span>Color</span>
          <div className="color-field">
            <input type="color" value={config.dotColor} onChange={(e) => set({ dotColor: e.target.value })} />
            <input type="text" value={config.dotColor} className="color-hex"
              onChange={(e) => set({ dotColor: e.target.value })} />
          </div>
        </label>
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
