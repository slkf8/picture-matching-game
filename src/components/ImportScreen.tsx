import { useState } from "react";
import type { Activity, Duty, Workplace } from "../types";
import ZipImportButton from "./ZipImportButton";

type ImportScreenProps = {
  onPackLoaded: (pack: {
    title: string;
    version?: string;
    activities: Activity[];
    workplaces: Workplace[];
    duties: Duty[];
    warnings: string[];
  }) => void;
};

export default function ImportScreen({ onPackLoaded }: ImportScreenProps) {
  const [hasOpenedModule, setHasOpenedModule] = useState(false);
  const [error, setError] = useState("");

  if (!hasOpenedModule) {
    return (
      <section className="import-screen" aria-labelledby="home-title">
        <div className="import-card home-card">
          <p className="eyebrow">練習項目</p>
          <h1 id="home-title">圖片配對練習</h1>
          <button type="button" className="primary-button module-button" onClick={() => setHasOpenedModule(true)}>
            職業物品和場景配對
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="practice-screen" aria-labelledby="import-title">
      <header className="top-bar">
        <div>
          <p className="eyebrow">職業物品和場景配對</p>
          <h1 id="import-title">圖片配對練習</h1>
        </div>
        <div className="top-actions" aria-label="題庫操作">
          <ZipImportButton onPackLoaded={onPackLoaded} onError={setError} />
        </div>
      </header>

      <div className="import-screen import-stage">
        <div className="import-card">
          <p className="eyebrow">本機題庫</p>
          <p className="import-copy">請先在右上角匯入題庫 ZIP，所有圖片只會在這台裝置的瀏覽器中讀取。</p>
          <p className="hint-text">請選擇 `.zip` 題庫包</p>

          {error && (
            <div className="message-box error-box" role="alert">
              {error}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
