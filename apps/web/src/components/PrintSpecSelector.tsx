import type { PrintSpec } from "@gravitypress/schemas";
import { TRIM_SIZE_LABELS, BINDING_LABELS, PAPER_LABELS } from "@gravitypress/schemas";

interface Props {
  spec: PrintSpec;
  pageCount: number;
  onChange: (update: Partial<PrintSpec>) => void;
}

export function PrintSpecSelector({ spec, pageCount, onChange }: Props) {
  return (
    <div className="print-spec-selector">
      <h3>Print Specifications</h3>

      <label className="form-field">
        <span>Trim Size</span>
        <select
          value={spec.trimSize}
          onChange={(e) => onChange({ trimSize: e.target.value as any })}
        >
          {Object.entries(TRIM_SIZE_LABELS).map(([val, label]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>
      </label>

      <label className="form-field">
        <span>Binding</span>
        <select
          value={spec.bindingType}
          onChange={(e) => onChange({ bindingType: e.target.value as any })}
        >
          {Object.entries(BINDING_LABELS).map(([val, label]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>
      </label>

      <label className="form-field">
        <span>Paper</span>
        <select
          value={spec.paperStock}
          onChange={(e) => onChange({ paperStock: e.target.value as any })}
        >
          {Object.entries(PAPER_LABELS).map(([val, label]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>
      </label>

      <div className="form-row">
        <label className="form-field">
          <span>Interior</span>
          <select
            value={spec.interiorColor}
            onChange={(e) => onChange({ interiorColor: e.target.value as any })}
          >
            <option value="BW">Black & White</option>
            <option value="FC">Full Color</option>
          </select>
        </label>

        <label className="form-field">
          <span>Cover Finish</span>
          <select
            value={spec.coverFinish}
            onChange={(e) => onChange({ coverFinish: e.target.value as any })}
          >
            <option value="M">Matte</option>
            <option value="G">Gloss</option>
          </select>
        </label>
      </div>

      <div className="spec-summary">
        <span>{pageCount} pages</span>
        {pageCount % 2 !== 0 && (
          <span className="spec-warn">Page count must be even for printing (will pad with blank)</span>
        )}
      </div>
    </div>
  );
}
