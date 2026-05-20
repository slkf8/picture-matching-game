import { useEffect, useState } from "react";
import ImportScreen from "./components/ImportScreen";
import PracticeScreen from "./components/PracticeScreen";
import type { Activity } from "./types";
import { revokeActivityObjectUrls } from "./utils/zipLoader";

type PackState = {
  title: string;
  version?: string;
  activities: Activity[];
  warnings: string[];
};

export default function App() {
  const [pack, setPack] = useState<PackState | null>(null);

  function handlePackLoaded(nextPack: PackState) {
    setPack((previousPack) => {
      if (previousPack) {
        revokeActivityObjectUrls(previousPack.activities);
      }
      return nextPack;
    });
  }

  function handleResetPack() {
    setPack((previousPack) => {
      if (previousPack) {
        revokeActivityObjectUrls(previousPack.activities);
      }
      return null;
    });
  }

  useEffect(() => {
    return () => {
      if (pack) {
        revokeActivityObjectUrls(pack.activities);
      }
    };
  }, [pack]);

  return (
    <main className="app-shell">
      {pack ? (
        <PracticeScreen
          title={pack.title}
          activities={pack.activities}
          warnings={pack.warnings}
          onResetPack={handleResetPack}
        />
      ) : (
        <ImportScreen onPackLoaded={handlePackLoaded} />
      )}
    </main>
  );
}
