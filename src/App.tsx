import { useEffect, useState } from "react";
import ImportScreen from "./components/ImportScreen";
import PracticeScreen from "./components/PracticeScreen";
import type { Activity, Duty, Workplace } from "./types";
import { revokeActivityObjectUrls } from "./utils/zipLoader";

type PackState = {
  title: string;
  version?: string;
  activities: Activity[];
  workplaces: Workplace[];
  duties: Duty[];
  warnings: string[];
};

export default function App() {
  const [pack, setPack] = useState<PackState | null>(null);

  function handlePackLoaded(nextPack: PackState) {
    setPack((previousPack) => {
      if (previousPack) {
        revokeActivityObjectUrls(previousPack.activities, previousPack.workplaces, previousPack.duties);
      }
      return nextPack;
    });
  }

  function handleResetPack() {
    setPack((previousPack) => {
      if (previousPack) {
        revokeActivityObjectUrls(previousPack.activities, previousPack.workplaces, previousPack.duties);
      }
      return null;
    });
  }

  useEffect(() => {
    return () => {
      if (pack) {
        revokeActivityObjectUrls(pack.activities, pack.workplaces, pack.duties);
      }
    };
  }, [pack]);

  return (
    <main className="app-shell">
      {pack ? (
        <PracticeScreen
          title={pack.title}
          activities={pack.activities}
          workplaces={pack.workplaces}
          duties={pack.duties}
          warnings={pack.warnings}
          onPackLoaded={handlePackLoaded}
        />
      ) : (
        <ImportScreen onPackLoaded={handlePackLoaded} />
      )}
    </main>
  );
}
