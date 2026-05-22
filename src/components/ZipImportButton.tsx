import { ChangeEvent, useRef, useState } from "react";
import type { Activity, Duty, Workplace } from "../types";
import { loadActivitiesFromZip } from "../utils/zipLoader";

type ZipImportButtonProps = {
  onPackLoaded: (pack: {
    title: string;
    version?: string;
    activities: Activity[];
    workplaces: Workplace[];
    duties: Duty[];
    warnings: string[];
  }) => void;
  onError?: (message: string) => void;
  className?: string;
};

export default function ZipImportButton({ onPackLoaded, onError, className = "primary-button" }: ZipImportButtonProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    onError?.("");
    setIsLoading(true);

    try {
      const result = await loadActivitiesFromZip(file);
      onPackLoaded(result);
    } catch (caughtError) {
      onError?.(caughtError instanceof Error ? caughtError.message : "題庫 ZIP 讀取失敗，請確認檔案是否為有效 ZIP。");
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <label className={`${className} import-button`}>
      <input
        ref={inputRef}
        type="file"
        accept=".zip,application/zip"
        onChange={handleFileChange}
        disabled={isLoading}
      />
      {isLoading ? "正在讀取..." : "匯入題庫 ZIP"}
    </label>
  );
}
