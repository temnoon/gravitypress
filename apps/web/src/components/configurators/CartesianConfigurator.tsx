import type { CartesianGridConfig } from "@gravitypress/schemas";

interface Props {
  config: CartesianGridConfig;
  onChange: (config: CartesianGridConfig) => void;
}

export function CartesianConfigurator({ config, onChange }: Props) {
  const set = (u: Partial<CartesianGridConfig>) => onChange({ ...config, ...u } as CartesianGridConfig);

  return (
    <div className="configurator">
      <h4>Graph Paper Designer</h4>

      <fieldset className="config-section">
        <legend>Grid</legend>

        <label className="form-field">
          <span>Grid Spacing <em className="config-val">{(config.gridSpacing * 25.4).toFixed(1)}mm</em></span>
          <input type="range" min={0.05} max={0.5} step={0.01} value={config.gridSpacing}
            onChange={(e) => set({ gridSpacing: +e.target.value })} />
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
          <span>Line Thickness <em className="config-val">{config.lineThickness}pt</em></span>
          <input type="range" min={0.1} max={2} step={0.05} value={config.lineThickness}
            onChange={(e) => set({ lineThickness: +e.target.value })} />
        </label>
      </fieldset>

      <fieldset className="config-section">
        <legend>Major Grid Lines</legend>

        <label className="form-field inline">
          <input type="checkbox" checked={config.showMajorLines}
            onChange={(e) => set({ showMajorLines: e.target.checked })} />
          <span>Show major grid lines</span>
        </label>

        {config.showMajorLines && (
          <>
            <label className="form-field">
              <span>Major line every <em className="config-val">{config.majorLineEvery} squares</em></span>
              <input type="range" min={2} max={10} value={config.majorLineEvery}
                onChange={(e) => set({ majorLineEvery: +e.target.value })} />
            </label>

            <label className="form-field">
              <span>Major Line Color</span>
              <div className="color-field">
                <input type="color" value={config.majorLineColor}
                  onChange={(e) => set({ majorLineColor: e.target.value })} />
                <input type="text" value={config.majorLineColor} className="color-hex"
                  onChange={(e) => set({ majorLineColor: e.target.value })} />
              </div>
            </label>

            <label className="form-field">
              <span>Major Thickness <em className="config-val">{config.majorLineThickness}pt</em></span>
              <input type="range" min={0.1} max={3} step={0.1} value={config.majorLineThickness}
                onChange={(e) => set({ majorLineThickness: +e.target.value })} />
            </label>
          </>
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
