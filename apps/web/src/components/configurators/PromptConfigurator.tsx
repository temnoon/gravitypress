interface PromptConfig {
  promptText: string;
  sourceAttribution?: string;
  promptFontSize: number;
  promptAreaFraction: number;
  responseType: "lined" | "blank" | "dot";
  lineSpacing: number;
  lineColor: string;
  dotSpacing: number;
  dotRadius: number;
  dotColor: string;
  showDivider: boolean;
  dividerColor: string;
  marginTop: number;
  marginBottom: number;
  marginLeft: number;
  marginRight: number;
  [key: string]: any;
}

interface Props {
  config: PromptConfig;
  onChange: (config: PromptConfig) => void;
}

export function PromptConfigurator({ config, onChange }: Props) {
  const set = (u: Partial<PromptConfig>) => onChange({ ...config, ...u });

  return (
    <div className="configurator">
      <h4>Prompt Page Designer</h4>

      <fieldset className="config-section">
        <legend>Prompt Content</legend>

        <label className="form-field">
          <span>Prompt Text</span>
          <textarea value={config.promptText} rows={4}
            onChange={(e) => set({ promptText: e.target.value })}
            placeholder="Write your prompt here..." />
        </label>

        <label className="form-field">
          <span>Attribution (optional)</span>
          <input type="text" value={config.sourceAttribution || ""}
            onChange={(e) => set({ sourceAttribution: e.target.value })}
            placeholder='e.g., "Mary Shelley, Frankenstein"' />
        </label>
      </fieldset>

      <fieldset className="config-section">
        <legend>Layout</legend>

        <label className="form-field">
          <span>Font Size <em className="config-val">{config.promptFontSize}pt</em></span>
          <input type="range" min={8} max={20} value={config.promptFontSize}
            onChange={(e) => set({ promptFontSize: +e.target.value })} />
        </label>

        <label className="form-field">
          <span>Prompt Area <em className="config-val">{Math.round(config.promptAreaFraction * 100)}%</em></span>
          <input type="range" min={0.1} max={0.6} step={0.05} value={config.promptAreaFraction}
            onChange={(e) => set({ promptAreaFraction: +e.target.value })} />
        </label>

        <label className="form-field inline">
          <input type="checkbox" checked={config.showDivider}
            onChange={(e) => set({ showDivider: e.target.checked })} />
          <span>Show divider line</span>
        </label>

        {config.showDivider && (
          <label className="form-field">
            <span>Divider Color</span>
            <div className="color-field">
              <input type="color" value={config.dividerColor}
                onChange={(e) => set({ dividerColor: e.target.value })} />
            </div>
          </label>
        )}
      </fieldset>

      <fieldset className="config-section">
        <legend>Response Area</legend>

        <label className="form-field">
          <span>Type</span>
          <select value={config.responseType}
            onChange={(e) => set({ responseType: e.target.value as any })}>
            <option value="lined">Lined</option>
            <option value="dot">Dot Grid</option>
            <option value="blank">Blank</option>
          </select>
        </label>

        {config.responseType === "lined" && (
          <>
            <label className="form-field">
              <span>Line Spacing <em className="config-val">{(config.lineSpacing * 25.4).toFixed(1)}mm</em></span>
              <input type="range" min={0.1} max={0.5} step={0.01} value={config.lineSpacing}
                onChange={(e) => set({ lineSpacing: +e.target.value })} />
            </label>
            <label className="form-field">
              <span>Line Color</span>
              <div className="color-field">
                <input type="color" value={config.lineColor}
                  onChange={(e) => set({ lineColor: e.target.value })} />
              </div>
            </label>
          </>
        )}

        {config.responseType === "dot" && (
          <>
            <label className="form-field">
              <span>Dot Spacing <em className="config-val">{(config.dotSpacing * 25.4).toFixed(1)}mm</em></span>
              <input type="range" min={0.08} max={0.4} step={0.01} value={config.dotSpacing}
                onChange={(e) => set({ dotSpacing: +e.target.value })} />
            </label>
            <label className="form-field">
              <span>Dot Color</span>
              <div className="color-field">
                <input type="color" value={config.dotColor}
                  onChange={(e) => set({ dotColor: e.target.value })} />
              </div>
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
