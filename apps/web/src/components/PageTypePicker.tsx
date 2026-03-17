import { useState } from "react";
import type { PageConfig } from "@gravitypress/schemas";
import { trimToPaper } from "../hooks/useNotebook";

interface Props {
  trimSize: string;
  onAdd: (configs: PageConfig[]) => void;
}

const PAGE_TYPES = [
  { type: "lined", label: "Lined", icon: "☰", desc: "College ruled lines" },
  { type: "dot", label: "Dot Grid", icon: "⠿", desc: "5mm dot grid" },
  { type: "cartesian", label: "Graph Paper", icon: "▦", desc: "Square grid" },
  { type: "polar", label: "Polar Grid", icon: "◎", desc: "Circular graph" },
  { type: "blank", label: "Blank", icon: "☐", desc: "Empty page" },
  { type: "prompt", label: "Prompt", icon: "✎", desc: "Writing prompt" },
] as const;

function defaultConfig(type: string, paper: "LETTER" | "A4" | "A5" | "HALF_LETTER"): PageConfig {
  switch (type) {
    case "lined":
      return { version: 1, type: "lined", paper, marginTop: 1, marginBottom: 0.75, marginLeft: 1.25, marginRight: 0.75, lineSpacing: 0.3125, lineColor: "#a0c4e8", lineThickness: 0.5, showMarginLine: true, marginLinePosition: 1.25, marginLineColor: "#f4a4a4", marginLineThickness: 0.5, showHeaderLine: false, headerLineOffset: 0.5 };
    case "dot":
      return { version: 1, type: "dot", paper, marginTop: 0.5, marginBottom: 0.5, marginLeft: 0.5, marginRight: 0.5, dotSpacing: 0.1967, dotRadius: 0.015, dotColor: "#cccccc" };
    case "cartesian":
      return { version: 1, type: "cartesian", paper, marginTop: 0.5, marginBottom: 0.5, marginLeft: 0.5, marginRight: 0.5, gridSpacing: 0.25, lineColor: "#c0c0c0", lineThickness: 0.25, showMajorLines: true, majorLineEvery: 4, majorLineColor: "#808080", majorLineThickness: 0.5 };
    case "polar":
      return { version: 1, type: "polar", paper, dpiPreview: 150, marginTop: 0.5, marginBottom: 0.5, marginInner: 0.6, marginOuter: 0.5, circles: 16, spokes: 16, circleThickness: [0.35], spokeThickness: [0.35], circleColorMode: "SOLID", spokeColorMode: "SOLID", circleSolid: "#333333", spokeSolid: "#333333", rainbowStartHue: 0, rainbowEndHue: 360, spokeStartCircles: [] };
    case "blank":
      return { version: 1, type: "blank", paper, backgroundColor: "#ffffff" };
    case "prompt":
      return { version: 1, type: "prompt", paper, marginTop: 0.75, marginBottom: 0.75, marginLeft: 1, marginRight: 0.75, promptText: "Write about something that changed how you see the world.", promptFontSize: 11, promptAreaFraction: 0.25, responseType: "lined", lineSpacing: 0.3125, lineColor: "#c0c0c0", dotSpacing: 0.1967, dotRadius: 0.012, dotColor: "#cccccc", showDivider: true, dividerColor: "#999999" } as PageConfig;
    default:
      return { version: 1, type: "blank", paper, backgroundColor: "#ffffff" };
  }
}

export function PageTypePicker({ trimSize, onAdd }: Props) {
  const [count, setCount] = useState(1);
  const paper = trimToPaper(trimSize);

  return (
    <div className="page-type-picker">
      <div className="picker-header">
        <span>Add Pages</span>
        <label className="count-input">
          ×
          <input
            type="number"
            min={1}
            max={100}
            value={count}
            onChange={(e) => setCount(Math.max(1, Math.min(100, +e.target.value)))}
          />
        </label>
      </div>
      <div className="picker-grid">
        {PAGE_TYPES.map((pt) => (
          <button
            key={pt.type}
            className="picker-card"
            onClick={() => {
              const configs = Array.from({ length: count }, () => defaultConfig(pt.type, paper));
              onAdd(configs);
            }}
          >
            <span className="picker-icon">{pt.icon}</span>
            <span className="picker-label">{pt.label}</span>
            <span className="picker-desc">{pt.desc}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
