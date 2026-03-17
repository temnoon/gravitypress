import type { PageConfig } from "@gravitypress/schemas";
import { PolarConfigurator } from "./configurators/PolarConfigurator";
import { LinedConfigurator } from "./configurators/LinedConfigurator";
import { DotConfigurator } from "./configurators/DotConfigurator";
import { CartesianConfigurator } from "./configurators/CartesianConfigurator";
import { PromptConfigurator } from "./configurators/PromptConfigurator";
import { pageTypeLabel } from "../hooks/useNotebook";

interface Props {
  config: PageConfig;
  pageIndex: number;
  onChange: (index: number, config: PageConfig) => void;
  onClose: () => void;
}

export function PageConfigurator({ config, pageIndex, onChange, onClose }: Props) {
  return (
    <div className="page-configurator">
      <div className="config-header">
        <span>Editing: {pageTypeLabel(config.type)} (page {pageIndex + 1})</span>
        <button className="btn btn-sm btn-ghost" onClick={onClose}>Done</button>
      </div>

      {config.type === "polar" && (
        <PolarConfigurator
          config={config}
          onChange={(c) => onChange(pageIndex, c)}
        />
      )}

      {config.type === "lined" && (
        <LinedConfigurator
          config={config}
          onChange={(c) => onChange(pageIndex, c)}
        />
      )}

      {config.type === "dot" && (
        <DotConfigurator
          config={config}
          onChange={(c) => onChange(pageIndex, c)}
        />
      )}

      {config.type === "cartesian" && (
        <CartesianConfigurator
          config={config}
          onChange={(c) => onChange(pageIndex, c)}
        />
      )}

      {config.type === "prompt" && (
        <PromptConfigurator
          config={config as any}
          onChange={(c) => onChange(pageIndex, c as PageConfig)}
        />
      )}

      {config.type === "blank" && (
        <div className="configurator">
          <h4>Blank Page</h4>
          <label className="form-field">
            <span>Background Color</span>
            <div className="color-field">
              <input type="color" value={(config as any).backgroundColor || "#ffffff"}
                onChange={(e) => onChange(pageIndex, { ...config, backgroundColor: e.target.value } as PageConfig)} />
            </div>
          </label>
        </div>
      )}
    </div>
  );
}
