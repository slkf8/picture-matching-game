import { ChangeEvent, useRef, useState } from "react";
import type { Activity, Workplace } from "../types";
import { loadActivitiesFromZip } from "../utils/zipLoader";

type ImportScreenProps = {
  onPackLoaded: (pack: {
    title: string;
    version?: string;
    activities: Activity[];
    workplaces: Workplace[];
    warnings: string[];
  }) => void;
};

export default function ImportScreen({ onPackLoaded }: ImportScreenProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setError("");
    setIsLoading(true);

    try {
      const result = await loadActivitiesFromZip(file);
      onPackLoaded(result);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "題庫 ZIP 讀取失敗，請確認檔案是否為有效 ZIP。");
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="import-screen" aria-labelledby="import-title">
      <div className="import-card">
        <p className="eyebrow">本機題庫</p>
        <h1 id="import-title">圖片配對練習</h1>
        <p className="import-copy">請選擇題庫 ZIP 檔案，所有圖片只會在這台裝置的瀏覽器中讀取。</p>

        <label className="primary-button import-button">
          <input
            ref={inputRef}
            type="file"
            accept=".zip,application/zip"
            onChange={handleFileChange}
            disabled={isLoading}
          />
          {isLoading ? "正在讀取題庫..." : "匯入題庫 ZIP"}
        </label>

        <p className="hint-text">請選擇 `.zip` 題庫包</p>

        {error && (
          <div className="message-box error-box" role="alert">
            {error}
          </div>
        )}
      </div>
    </section>
  );
}
