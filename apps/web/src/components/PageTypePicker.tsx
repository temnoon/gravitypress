import { useState } from "react";
import { PAGE_PRESETS, PALETTES, applyPalette, applyPreset } from "@gravitypress/core";
import type { Preset, Palette } from "@gravitypress/core";
import type { PageConfig } from "@gravitypress/schemas";
import { trimToPaper } from "../hooks/useNotebook";

interface Props {
  trimSize: string;
  onAdd: (configs: PageConfig[]) => void;
}

const PAGE_TYPES = [
  { type: "lined", label: "Lined", icon: "☰" },
  { type: "dot", label: "Dot Grid", icon: "⠿" },
  { type: "cartesian", label: "Graph", icon: "▦" },
  { type: "polar", label: "Polar", icon: "◎" },
  { type: "blank", label: "Blank", icon: "☐" },
  { type: "prompt", label: "Prompt", icon: "✎" },
] as const;

/** Minimal base config per type — just structure, no color literals */
function baseConfig(type: string, paper: string): PageConfig {
  const base = { version: 1 as const, paper: paper as any };
  switch (type) {
    case "polar":
      return { ...base, type: "polar", dpiPreview: 150, marginTop: 0.5, marginBottom: 0.5, marginInner: 0.6, marginOuter: 0.5, circles: 16, spokes: 16, extendCircles: false, circleThickness: [0.35], spokeThickness: [0.35], spokeStartCircles: [], spokeEndCircles: [], circleColorMode: "SOLID" as const, circleSolid: "#333333", circleGradientType: "radial-center" as const, circleGradientStart: "#000000", circleGradientEnd: "#666666", spokeColorMode: "SOLID" as const, spokeSolid: "#333333", spokeGradientType: "linear-along" as const, spokeGradientStart: "#000000", spokeGradientEnd: "#666666", rainbowStartHue: 0, rainbowEndHue: 360 };
    case "lined":
      return { ...base, type: "lined", marginTop: 1, marginBottom: 0.75, marginLeft: 1.25, marginRight: 0.75, lineSpacing: 0.3125, lineColor: "#a0c4e8", lineThickness: 0.5, showMarginLine: true, marginLinePosition: 1.25, marginLineColor: "#f4a4a4", marginLineThickness: 0.5, showHeaderLine: false, headerLineOffset: 0.5 };
    case "dot":
      return { ...base, type: "dot", marginTop: 0.5, marginBottom: 0.5, marginLeft: 0.5, marginRight: 0.5, dotSpacing: 0.1967, dotRadius: 0.015, dotColor: "#cccccc" };
    case "cartesian":
      return { ...base, type: "cartesian", marginTop: 0.5, marginBottom: 0.5, marginLeft: 0.5, marginRight: 0.5, gridSpacing: 0.25, lineColor: "#c0c0c0", lineThickness: 0.25, showMajorLines: true, majorLineEvery: 4, majorLineColor: "#808080", majorLineThickness: 0.5 };
    case "blank":
      return { ...base, type: "blank", backgroundColor: "#ffffff" };
    case "prompt":
      return { ...base, type: "prompt", marginTop: 0.75, marginBottom: 0.75, marginLeft: 1, marginRight: 0.75, promptText: "Write about something that changed how you see the world.", promptFontSize: 11, promptAreaFraction: 0.25, responseType: "lined" as const, lineSpacing: 0.3125, lineColor: "#c0c0c0", dotSpacing: 0.1967, dotRadius: 0.012, dotColor: "#cccccc", showDivider: true, dividerColor: "#999999" } as PageConfig;
    default:
      return { ...base, type: "blank", backgroundColor: "#ffffff" };
  }
}

export function PageTypePicker({ trimSize, onAdd }: Props) {
  const [count, setCount] = useState(1);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedPalette, setSelectedPalette] = useState<Palette>(PALETTES[0]);
  const paper = trimToPaper(trimSize);

  const presetsForType = selectedType
    ? PAGE_PRESETS.filter((p) => p.type === selectedType)
    : [];

  function addWithPreset(preset?: Preset) {
    if (!selectedType) return;
    let config = baseConfig(selectedType, paper);
    if (preset) config = applyPreset(config, preset);
    config = applyPalette(config, selectedPalette);
    onAdd(Array.from({ length: count }, () => ({ ...config })));
    setSelectedType(null);
  }

  function addQuick(type: string) {
    let config = baseConfig(type, paper);
    config = applyPalette(config, selectedPalette);
    onAdd(Array.from({ length: count }, () => ({ ...config })));
  }

  return (
    <div className="page-type-picker">
      <div className="picker-header">
        <span>Add Pages</span>
        <label className="count-input">
          ×<input type="number" min={1} max={100} value={count}
            onChange={(e) => setCount(Math.max(1, Math.min(100, +e.target.value)))} />
        </label>
      </div>

      {/* Palette selector */}
      <div className="palette-bar">
        {PALETTES.map((p) => (
          <button
            key={p.id}
            className={`palette-swatch ${selectedPalette.id === p.id ? "active" : ""}`}
            title={p.name}
            style={{ background: `linear-gradient(135deg, ${p.colors.primary}, ${p.colors.accent})` }}
            onClick={() => setSelectedPalette(p)}
          />
        ))}
      </div>

      {!selectedType ? (
        /* Page type grid */
        <div className="picker-grid">
          {PAGE_TYPES.map((pt) => (
            <button key={pt.type} className="picker-card"
              onClick={() => setSelectedType(pt.type)}
              onDoubleClick={() => addQuick(pt.type)}
            >
              <span className="picker-icon">{pt.icon}</span>
              <span className="picker-label">{pt.label}</span>
            </button>
          ))}
        </div>
      ) : (
        /* Preset list for selected type */
        <div className="preset-panel">
          <div className="preset-header">
            <button className="btn btn-sm btn-ghost" onClick={() => setSelectedType(null)}>← Back</button>
            <span>{PAGE_TYPES.find((t) => t.type === selectedType)?.label} Presets</span>
          </div>

          <button className="preset-item" onClick={() => addWithPreset()}>
            <span className="preset-name">Default</span>
            <span className="preset-cat">Basic</span>
          </button>

          {presetsForType.map((preset) => (
            <button key={preset.id} className="preset-item" onClick={() => addWithPreset(preset)}>
              <span className="preset-name">{preset.name}</span>
              <span className="preset-cat">{preset.category}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
