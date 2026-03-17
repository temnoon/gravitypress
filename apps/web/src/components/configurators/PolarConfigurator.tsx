import type { PolarGridConfig } from "@gravitypress/schemas";

interface Props {
  config: PolarGridConfig;
  onChange: (config: PolarGridConfig) => void;
}

const COLOR_MODES = [
  { value: "SOLID", label: "Solid Color" },
  { value: "RAINBOW", label: "Rainbow" },
  { value: "GRADIENT", label: "Gradient" },
  { value: "GRADIENT_PLUS", label: "Smooth Gradient" },
];

const GRADIENT_TYPES = [
  { value: "radial-center", label: "Radial from Center" },
  { value: "radial-edge", label: "Radial from Edge" },
  { value: "linear-horizontal", label: "Linear Horizontal" },
  { value: "linear-vertical", label: "Linear Vertical" },
  { value: "linear-along", label: "Linear Along" },
  { value: "linear-across", label: "Linear Across" },
];

export function PolarConfigurator({ config, onChange }: Props) {
  const set = (updates: Partial<PolarGridConfig>) =>
    onChange({ ...config, ...updates } as PolarGridConfig);

  const parseArray = (val: string): number[] =>
    val.split(",").map((s) => parseFloat(s.trim())).filter((n) => !isNaN(n));

  const showCircleGradient = config.circleColorMode === "GRADIENT" || config.circleColorMode === "GRADIENT_PLUS";
  const showSpokeGradient = config.spokeColorMode === "GRADIENT" || config.spokeColorMode === "GRADIENT_PLUS";
  const showRainbow = config.circleColorMode === "RAINBOW" || config.spokeColorMode === "RAINBOW";

  return (
    <div className="configurator">
      <h4>Polar Grid Designer</h4>

      {/* Structure */}
      <fieldset className="config-section">
        <legend>Structure</legend>

        <label className="form-field">
          <span>Circles <em className="config-val">{config.circles}</em></span>
          <input type="range" min={1} max={200} value={config.circles}
            onChange={(e) => set({ circles: +e.target.value })} />
        </label>

        <label className="form-field">
          <span>Spokes <em className="config-val">{config.spokes}</em></span>
          <input type="range" min={1} max={180} value={config.spokes}
            onChange={(e) => set({ spokes: +e.target.value })} />
        </label>

        <label className="form-field inline">
          <input type="checkbox" checked={config.extendCircles ?? false}
            onChange={(e) => set({ extendCircles: e.target.checked })} />
          <span>Extend circles to corners</span>
        </label>
      </fieldset>

      {/* Thickness Patterns */}
      <fieldset className="config-section">
        <legend>Thickness Patterns</legend>

        <label className="form-field">
          <span>Circle thicknesses <em className="config-hint">comma-separated, cycles</em></span>
          <input type="text"
            value={config.circleThickness.join(", ")}
            onChange={(e) => set({ circleThickness: parseArray(e.target.value) })}
            placeholder="0.35, 0.2, 0.5" />
        </label>

        <label className="form-field">
          <span>Spoke thicknesses</span>
          <input type="text"
            value={config.spokeThickness.join(", ")}
            onChange={(e) => set({ spokeThickness: parseArray(e.target.value) })}
            placeholder="0.35" />
        </label>
      </fieldset>

      {/* Spoke Origins */}
      <fieldset className="config-section">
        <legend>Spoke Start / End</legend>

        <label className="form-field">
          <span>Start circles <em className="config-hint">per spoke, cycles</em></span>
          <input type="text"
            value={config.spokeStartCircles.join(", ")}
            onChange={(e) => set({ spokeStartCircles: parseArray(e.target.value).map(Math.round) })}
            placeholder="0 (from center)" />
        </label>

        <label className="form-field">
          <span>End circles <em className="config-hint">leave empty for max</em></span>
          <input type="text"
            value={(config.spokeEndCircles ?? []).join(", ")}
            onChange={(e) => set({ spokeEndCircles: parseArray(e.target.value).map(Math.round) })}
            placeholder="(all spokes to edge)" />
        </label>
      </fieldset>

      {/* Circle Colors */}
      <fieldset className="config-section">
        <legend>Circle Colors</legend>

        <label className="form-field">
          <span>Mode</span>
          <select value={config.circleColorMode}
            onChange={(e) => set({ circleColorMode: e.target.value as any })}>
            {COLOR_MODES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </label>

        {config.circleColorMode === "SOLID" && (
          <label className="form-field">
            <span>Color</span>
            <div className="color-field">
              <input type="color" value={config.circleSolid}
                onChange={(e) => set({ circleSolid: e.target.value })} />
              <input type="text" value={config.circleSolid} className="color-hex"
                onChange={(e) => set({ circleSolid: e.target.value })} />
            </div>
          </label>
        )}

        {showCircleGradient && (
          <>
            <label className="form-field">
              <span>Gradient Type</span>
              <select value={config.circleGradientType ?? "radial-center"}
                onChange={(e) => set({ circleGradientType: e.target.value as any })}>
                {GRADIENT_TYPES.filter(g => !g.value.includes("along") && !g.value.includes("across")).map((g) =>
                  <option key={g.value} value={g.value}>{g.label}</option>
                )}
              </select>
            </label>
            <div className="form-row">
              <label className="form-field">
                <span>Start</span>
                <input type="color" value={config.circleGradientStart ?? "#000000"}
                  onChange={(e) => set({ circleGradientStart: e.target.value })} />
              </label>
              <label className="form-field">
                <span>End</span>
                <input type="color" value={config.circleGradientEnd ?? "#666666"}
                  onChange={(e) => set({ circleGradientEnd: e.target.value })} />
              </label>
            </div>
          </>
        )}
      </fieldset>

      {/* Spoke Colors */}
      <fieldset className="config-section">
        <legend>Spoke Colors</legend>

        <label className="form-field">
          <span>Mode</span>
          <select value={config.spokeColorMode}
            onChange={(e) => set({ spokeColorMode: e.target.value as any })}>
            {COLOR_MODES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </label>

        {config.spokeColorMode === "SOLID" && (
          <label className="form-field">
            <span>Color</span>
            <div className="color-field">
              <input type="color" value={config.spokeSolid}
                onChange={(e) => set({ spokeSolid: e.target.value })} />
              <input type="text" value={config.spokeSolid} className="color-hex"
                onChange={(e) => set({ spokeSolid: e.target.value })} />
            </div>
          </label>
        )}

        {showSpokeGradient && (
          <>
            <label className="form-field">
              <span>Gradient Type</span>
              <select value={config.spokeGradientType ?? "linear-along"}
                onChange={(e) => set({ spokeGradientType: e.target.value as any })}>
                {GRADIENT_TYPES.map((g) =>
                  <option key={g.value} value={g.value}>{g.label}</option>
                )}
              </select>
            </label>
            <div className="form-row">
              <label className="form-field">
                <span>Start</span>
                <input type="color" value={config.spokeGradientStart ?? "#000000"}
                  onChange={(e) => set({ spokeGradientStart: e.target.value })} />
              </label>
              <label className="form-field">
                <span>End</span>
                <input type="color" value={config.spokeGradientEnd ?? "#666666"}
                  onChange={(e) => set({ spokeGradientEnd: e.target.value })} />
              </label>
            </div>
          </>
        )}
      </fieldset>

      {/* Rainbow Settings */}
      {showRainbow && (
        <fieldset className="config-section">
          <legend>Rainbow Range</legend>
          <div className="form-row">
            <label className="form-field">
              <span>Start Hue <em className="config-val">{config.rainbowStartHue}°</em></span>
              <input type="range" min={0} max={360} value={config.rainbowStartHue}
                onChange={(e) => set({ rainbowStartHue: +e.target.value })} />
            </label>
            <label className="form-field">
              <span>End Hue <em className="config-val">{config.rainbowEndHue}°</em></span>
              <input type="range" min={0} max={360} value={config.rainbowEndHue}
                onChange={(e) => set({ rainbowEndHue: +e.target.value })} />
            </label>
          </div>
        </fieldset>
      )}

      {/* Margins */}
      <fieldset className="config-section">
        <legend>Margins (inches)</legend>
        <div className="form-row">
          <label className="form-field">
            <span>Top</span>
            <input type="number" step={0.05} min={0} max={2} value={config.marginTop}
              onChange={(e) => set({ marginTop: +e.target.value })} />
          </label>
          <label className="form-field">
            <span>Bottom</span>
            <input type="number" step={0.05} min={0} max={2} value={config.marginBottom}
              onChange={(e) => set({ marginBottom: +e.target.value })} />
          </label>
        </div>
        <div className="form-row">
          <label className="form-field">
            <span>Inner</span>
            <input type="number" step={0.05} min={0} max={2} value={config.marginInner}
              onChange={(e) => set({ marginInner: +e.target.value })} />
          </label>
          <label className="form-field">
            <span>Outer</span>
            <input type="number" step={0.05} min={0} max={2} value={config.marginOuter}
              onChange={(e) => set({ marginOuter: +e.target.value })} />
          </label>
        </div>
      </fieldset>
    </div>
  );
}
