import JSZip from "jszip";
import type { Activity, ImageAsset, LoadActivitiesResult, Manifest, ManifestItem, ManifestWorkplace, Workplace } from "../types";

const IMAGE_EXTENSIONS = new Set(["png", "jpg", "jpeg", "webp"]);

function normalizePath(path: string): string {
  return path.replace(/\\/g, "/").replace(/^\/+/, "");
}

function isIgnoredPath(path: string): boolean {
  return path.includes("__MACOSX/") || path.endsWith(".DS_Store") || path.includes("/.DS_Store");
}

function isImagePath(path: string): boolean {
  const fileName = path.split("/").pop() ?? "";
  const extension = fileName.split(".").pop()?.toLowerCase();
  return Boolean(extension && IMAGE_EXTENSIONS.has(extension));
}

function fileNameFromPath(path: string): string {
  return path.split("/").pop() ?? path;
}

function idFromFileName(fileName: string): string {
  return fileName.replace(/\.[^.]+$/, "").trim();
}

function labelFromFileName(fileName: string): string {
  return idFromFileName(fileName).replace(/[-_]+/g, " ").trim();
}

function validateManifest(value: unknown): Manifest {
  if (!value || typeof value !== "object") {
    throw new Error("manifest.json 格式錯誤。");
  }

  const manifest = value as Partial<Manifest>;
  if (!Array.isArray(manifest.activities)) {
    throw new Error("manifest.json 的 activities 必須是陣列。");
  }

  return {
    title: typeof manifest.title === "string" && manifest.title.trim() ? manifest.title : "圖片配對練習",
    version: typeof manifest.version === "string" ? manifest.version : undefined,
    activities: manifest.activities
      .filter((activity) => activity && typeof activity === "object")
      .map((activity) => activity as Manifest["activities"][number]),
    items: Array.isArray(manifest.items)
      ? manifest.items.filter((item) => item && typeof item === "object").map((item) => item as ManifestItem)
      : undefined,
    workplaces: Array.isArray(manifest.workplaces)
      ? manifest.workplaces
          .filter((workplace) => workplace && typeof workplace === "object")
          .map((workplace) => workplace as ManifestWorkplace)
      : undefined,
  };
}

function findManifestPath(paths: string[]): string | undefined {
  return paths.find((path) => path === "manifest.json") ?? paths.find((path) => path.endsWith("/manifest.json"));
}

function stripRoot(path: string, manifestPath: string): string {
  if (manifestPath === "manifest.json") {
    return path;
  }

  const root = manifestPath.slice(0, -"manifest.json".length);
  return path.startsWith(root) ? path.slice(root.length) : path;
}

async function imageAssetFromZipFile(
  zipFile: JSZip.JSZipObject,
  id: string,
  alt: string,
): Promise<ImageAsset> {
  const blob = await zipFile.async("blob");
  const fileName = fileNameFromPath(zipFile.name);

  return {
    id,
    fileName,
    objectUrl: URL.createObjectURL(blob),
    alt,
  };
}

function collectImageEntries(
  entriesByRelativePath: Map<string, JSZip.JSZipObject>,
  folderName: "people" | "items" | "workplaces",
): Map<string, JSZip.JSZipObject> {
  const imageEntries = new Map<string, JSZip.JSZipObject>();

  for (const [path, entry] of entriesByRelativePath) {
    if (!path.startsWith(`${folderName}/`) || !isImagePath(path)) {
      continue;
    }

    const fileName = fileNameFromPath(path);
    const id = idFromFileName(fileName);
    if (id && !imageEntries.has(id)) {
      imageEntries.set(id, entry);
    }
  }

  return imageEntries;
}

function buildEntryPathMap(entriesByRelativePath: Map<string, JSZip.JSZipObject>): Map<string, JSZip.JSZipObject> {
  const pathMap = new Map<string, JSZip.JSZipObject>();

  for (const [path, entry] of entriesByRelativePath) {
    pathMap.set(path, entry);
  }

  return pathMap;
}

function findEntryFromManifestPath(
  pathMap: Map<string, JSZip.JSZipObject>,
  manifestPath: unknown,
): JSZip.JSZipObject | undefined {
  if (typeof manifestPath !== "string" || !manifestPath.trim()) {
    return undefined;
  }

  const path = normalizePath(manifestPath);
  return pathMap.get(path);
}

export function revokeActivityObjectUrls(activities: Activity[], workplaces: Workplace[] = []): void {
  const seenUrls = new Set<string>();

  for (const activity of activities) {
    seenUrls.add(activity.targetImage.objectUrl);
    activity.itemPool.forEach((item) => seenUrls.add(item.objectUrl));
  }
  workplaces.forEach((workplace) => seenUrls.add(workplace.image.objectUrl));

  seenUrls.forEach((url) => URL.revokeObjectURL(url));
}

export async function loadActivitiesFromZip(file: File): Promise<LoadActivitiesResult> {
  let zip: JSZip;

  try {
    zip = await JSZip.loadAsync(file);
  } catch {
    throw new Error("題庫 ZIP 讀取失敗，請確認檔案是否為有效 ZIP。");
  }

  const normalizedEntries = Object.values(zip.files)
    .map((entry) => ({ entry, path: normalizePath(entry.name) }))
    .filter(({ entry, path }) => !entry.dir && !isIgnoredPath(path));

  const paths = normalizedEntries.map(({ path }) => path);
  const manifestPath = findManifestPath(paths);

  if (!manifestPath) {
    throw new Error("找不到 manifest.json，請確認題庫格式。");
  }

  const manifestEntry = normalizedEntries.find(({ path }) => path === manifestPath)?.entry;
  if (!manifestEntry) {
    throw new Error("找不到 manifest.json，請確認題庫格式。");
  }

  let manifestJson: unknown;
  try {
    manifestJson = JSON.parse(await manifestEntry.async("text"));
  } catch {
    throw new Error("manifest.json 格式錯誤，請確認內容是有效 JSON。");
  }

  const manifest = validateManifest(manifestJson);
  const entriesByRelativePath = new Map(
    normalizedEntries.map(({ entry, path }) => [stripRoot(path, manifestPath), entry]),
  );
  const entriesByPath = buildEntryPathMap(entriesByRelativePath);
  const peopleEntries = collectImageEntries(entriesByRelativePath, "people");
  const itemEntries = collectImageEntries(entriesByRelativePath, "items");
  const workplaceEntries = collectImageEntries(entriesByRelativePath, "workplaces");
  const itemManifestsById = new Map(
    (manifest.items ?? [])
      .filter((item) => typeof item.id === "string" && item.id.trim())
      .map((item) => [item.id, item]),
  );
  const warnings: string[] = [];
  const missingIdActivities: string[] = [];
  const missingPeople: string[] = [];
  const missingCorrectItems: string[] = [];
  const missingItemRefs: string[] = [];
  const missingItemImages: string[] = [];
  const missingWorkplaceImages: string[] = [];
  const missingWorkplaceRefs: string[] = [];
  const validActivities = [];

  if (peopleEntries.size === 0) {
    throw new Error("找不到 people 圖片資料夾，請確認題庫格式。");
  }

  if (itemEntries.size === 0) {
    throw new Error("找不到 items 圖片資料夾，請確認題庫格式。");
  }

  for (const manifestActivity of manifest.activities) {
    if (!manifestActivity.id || typeof manifestActivity.id !== "string") {
      missingIdActivities.push(manifestActivity.displayName ?? "未命名題目");
      continue;
    }

    const personEntry = findEntryFromManifestPath(entriesByPath, manifestActivity.personImage) ?? peopleEntries.get(manifestActivity.id);
    if (!personEntry) {
      missingPeople.push(manifestActivity.id);
      continue;
    }

    if (!Array.isArray(manifestActivity.correctItems) || manifestActivity.correctItems.length === 0) {
      missingCorrectItems.push(manifestActivity.id);
      continue;
    }

    const correctItemIds = [...new Set(manifestActivity.correctItems.filter((id) => typeof id === "string" && id.trim()))];
    const unknownItemIds = correctItemIds.filter((itemId) => {
      const itemManifest = itemManifestsById.get(itemId);
      return !findEntryFromManifestPath(entriesByPath, itemManifest?.image) && !itemEntries.has(itemId);
    });
    if (unknownItemIds.length > 0) {
      missingItemRefs.push(`${manifestActivity.id}: ${unknownItemIds.join(", ")}`);
      continue;
    }

    validActivities.push({
      ...manifestActivity,
      displayName:
        typeof manifestActivity.displayName === "string" && manifestActivity.displayName.trim()
          ? manifestActivity.displayName
          : manifestActivity.id,
      correctItemIds,
      personEntry,
    });
  }

  const workplaceManifestsById = new Map(
    (manifest.workplaces ?? [])
      .filter((workplace) => typeof workplace.id === "string" && workplace.id.trim())
      .map((workplace) => [workplace.id, workplace]),
  );

  for (const activity of validActivities) {
    if (!activity.workplaceId) {
      continue;
    }

    const workplaceManifest = workplaceManifestsById.get(activity.workplaceId);
    const hasWorkplaceImage =
      findEntryFromManifestPath(entriesByPath, workplaceManifest?.image) ?? workplaceEntries.get(activity.workplaceId);

    if (!hasWorkplaceImage) {
      missingWorkplaceRefs.push(`${activity.id}: ${activity.workplaceId}`);
    }
  }

  if (missingIdActivities.length > 0) {
    warnings.push(`以下題目缺少 id，已略過：\n${missingIdActivities.map((id) => `- ${id}`).join("\n")}`);
  }
  if (missingPeople.length > 0) {
    warnings.push(`以下題目缺少 people 人物圖片，已略過：\n${missingPeople.map((id) => `- ${id}`).join("\n")}`);
  }
  if (missingCorrectItems.length > 0) {
    warnings.push(`以下題目沒有 correctItems，已略過：\n${missingCorrectItems.map((id) => `- ${id}`).join("\n")}`);
  }
  if (missingItemRefs.length > 0) {
    warnings.push(`以下題目的 correctItems 找不到對應 items 圖片，已略過：\n${missingItemRefs.map((id) => `- ${id}`).join("\n")}`);
  }
  if (missingWorkplaceRefs.length > 0) {
    warnings.push(
      `以下題目的 workplaceId 找不到對應 workplaces 圖片，工作場所模式會略過判斷：\n${missingWorkplaceRefs.map((id) => `- ${id}`).join("\n")}`,
    );
  }

  if (validActivities.length === 0) {
    throw new Error(["題庫內沒有可使用的題目。", ...warnings].join("\n\n"));
  }

  const itemPoolEntries = new Map<string, { entry: JSZip.JSZipObject; label: string }>();

  for (const [id, entry] of itemEntries) {
    itemPoolEntries.set(id, {
      entry,
      label: labelFromFileName(fileNameFromPath(entry.name)),
    });
  }

  for (const itemManifest of manifest.items ?? []) {
    if (typeof itemManifest.id !== "string" || !itemManifest.id.trim()) {
      continue;
    }

    const entry = findEntryFromManifestPath(entriesByPath, itemManifest.image) ?? itemEntries.get(itemManifest.id);
    if (!entry) {
      missingItemImages.push(itemManifest.id);
      continue;
    }

    itemPoolEntries.set(itemManifest.id, {
      entry,
      label: itemManifest.displayName || itemManifest.englishName || labelFromFileName(fileNameFromPath(entry.name)),
    });
  }

  if (missingItemImages.length > 0) {
    warnings.push(`manifest.items 中以下物品找不到圖片，已略過：\n${missingItemImages.map((id) => `- ${id}`).join("\n")}`);
  }

  const itemPool = await Promise.all(
    [...itemPoolEntries.entries()].map(([id, item]) => imageAssetFromZipFile(item.entry, id, item.label)),
  );

  const workplacePoolEntries = new Map<string, { entry: JSZip.JSZipObject; displayName: string; englishName?: string }>();

  for (const [id, entry] of workplaceEntries) {
    workplacePoolEntries.set(id, {
      entry,
      displayName: labelFromFileName(fileNameFromPath(entry.name)),
    });
  }

  for (const workplaceManifest of manifest.workplaces ?? []) {
    if (typeof workplaceManifest.id !== "string" || !workplaceManifest.id.trim()) {
      continue;
    }

    const entry =
      findEntryFromManifestPath(entriesByPath, workplaceManifest.image) ?? workplaceEntries.get(workplaceManifest.id);
    if (!entry) {
      missingWorkplaceImages.push(workplaceManifest.id);
      continue;
    }

    workplacePoolEntries.set(workplaceManifest.id, {
      entry,
      displayName:
        workplaceManifest.displayName ||
        workplaceManifest.englishName ||
        labelFromFileName(fileNameFromPath(entry.name)),
      englishName: workplaceManifest.englishName,
    });
  }

  if (missingWorkplaceImages.length > 0) {
    warnings.push(`manifest.workplaces 中以下工作場所找不到圖片，已略過：\n${missingWorkplaceImages.map((id) => `- ${id}`).join("\n")}`);
  }

  const workplaces: Workplace[] = await Promise.all(
    [...workplacePoolEntries.entries()].map(async ([id, workplace]) => ({
      id,
      displayName: workplace.displayName,
      englishName: workplace.englishName,
      image: await imageAssetFromZipFile(workplace.entry, id, workplace.displayName),
    })),
  );

  const activities = await Promise.all(
    validActivities.map(async (manifestActivity): Promise<Activity> => ({
      id: manifestActivity.id,
      displayName: manifestActivity.displayName,
      englishName: manifestActivity.englishName,
      category: manifestActivity.category,
      targetImage: await imageAssetFromZipFile(
        manifestActivity.personEntry,
        manifestActivity.id,
        manifestActivity.displayName,
      ),
      correctItemIds: manifestActivity.correctItemIds,
      workplaceId: manifestActivity.workplaceId,
      distractorCount: typeof manifestActivity.distractorCount === "number" ? manifestActivity.distractorCount : undefined,
      itemPool,
    })),
  );

  return {
    title: manifest.title,
    version: manifest.version,
    activities,
    workplaces,
    warnings,
  };
}
