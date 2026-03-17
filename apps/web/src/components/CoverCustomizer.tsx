import type { CoverConfig } from "@gravitypress/core";

interface Props {
  cover: CoverConfig;
  onChange: (update: Partial<CoverConfig>) => void;
}

export function CoverCustomizer({ cover, onChange }: Props) {
  return (
    <div className="cover-customizer">
      <h3>Cover Design</h3>

      <label className="form-field">
        <span>Title</span>
        <input
          type="text"
          value={cover.title}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="My Notebook"
        />
      </label>

      <label className="form-field">
        <span>Subtitle</span>
        <input
          type="text"
          value={cover.subtitle || ""}
          onChange={(e) => onChange({ subtitle: e.target.value })}
          placeholder="Optional subtitle"
        />
      </label>

      <label className="form-field">
        <span>Author</span>
        <input
          type="text"
          value={cover.author || ""}
          onChange={(e) => onChange({ author: e.target.value })}
          placeholder="Your name"
        />
      </label>

      <div className="form-row">
        <label className="form-field">
          <span>Background</span>
          <div className="color-field">
            <input
              type="color"
              value={cover.backgroundColor || "#ffffff"}
              onChange={(e) => onChange({ backgroundColor: e.target.value })}
            />
            <input
              type="text"
              value={cover.backgroundColor || "#ffffff"}
              onChange={(e) => onChange({ backgroundColor: e.target.value })}
              className="color-hex"
            />
          </div>
        </label>

        <label className="form-field">
          <span>Text Color</span>
          <div className="color-field">
            <input
              type="color"
              value={cover.textColor || "#222222"}
              onChange={(e) => onChange({ textColor: e.target.value })}
            />
            <input
              type="text"
              value={cover.textColor || "#222222"}
              onChange={(e) => onChange({ textColor: e.target.value })}
              className="color-hex"
            />
          </div>
        </label>
      </div>

      <label className="form-field">
        <span>Back Cover Text</span>
        <textarea
          value={cover.backCoverText || ""}
          onChange={(e) => onChange({ backCoverText: e.target.value })}
          placeholder="Description for the back cover"
          rows={3}
        />
      </label>

      {/* Cover preview mockup */}
      <div className="cover-preview">
        <div
          className="cover-mockup"
          style={{
            backgroundColor: cover.backgroundColor || "#ffffff",
            color: cover.textColor || "#222222",
          }}
        >
          <div className="mockup-title">{cover.title || "Title"}</div>
          {cover.subtitle && <div className="mockup-subtitle">{cover.subtitle}</div>}
          {cover.author && <div className="mockup-author">{cover.author}</div>}
        </div>
      </div>
    </div>
  );
}
