import { livroSearchQuery } from "./book-livro.js";

const OPEN_LIBRARY_SEARCH = "https://openlibrary.org/search.json";
const FETCH_TIMEOUT_MS = 4000;
const METADATA_CACHE_TTL_MS = 300_000;

export type BookMetadata = {
  totalPages?: number;
  coverUrl?: string;
};

type OpenLibraryDoc = {
  title?: string;
  number_of_pages_median?: number;
  cover_i?: number;
  isbn?: string[];
};

type CacheEntry = {
  metadata: BookMetadata;
  expiresAt: number;
};

const cache = new Map<string, CacheEntry>();

function cacheKey(workId: string | undefined, displayTitle: string): string {
  return workId ? `work:${workId}` : `q:${displayTitle.toLowerCase()}`;
}

function parseTotalPages(value: unknown): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value)) return undefined;
  const pages = Math.round(value);
  return pages > 0 ? pages : undefined;
}

function coverUrlFromDoc(doc: OpenLibraryDoc): string | undefined {
  if (doc.cover_i) {
    return `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`;
  }

  const isbn = doc.isbn?.find((entry) => entry.trim().length > 0);
  if (isbn) {
    return `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`;
  }

  return undefined;
}

function metadataFromDoc(doc: OpenLibraryDoc): BookMetadata {
  const totalPages = parseTotalPages(doc.number_of_pages_median);
  const coverUrl = coverUrlFromDoc(doc);

  return {
    ...(totalPages !== undefined ? { totalPages } : {}),
    ...(coverUrl !== undefined ? { coverUrl } : {}),
  };
}

async function openLibrarySearch(
  params: Record<string, string>
): Promise<OpenLibraryDoc | undefined> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const url = `${OPEN_LIBRARY_SEARCH}?${new URLSearchParams(params)}`;
    const response = await fetch(url, { signal: controller.signal });

    if (!response.ok) return undefined;

    const data = (await response.json()) as { docs?: OpenLibraryDoc[] };
    return data.docs?.[0];
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchByWorkId(workId: string): Promise<BookMetadata> {
  const doc = await openLibrarySearch({
    q: `key:/works/${workId}`,
    limit: "1",
    fields: "number_of_pages_median,cover_i,isbn",
  });

  return doc ? metadataFromDoc(doc) : {};
}

async function fetchByTitle(displayTitle: string): Promise<BookMetadata> {
  const doc = await openLibrarySearch({
    q: livroSearchQuery(displayTitle),
    limit: "1",
    fields: "title,number_of_pages_median,cover_i,isbn",
  });

  return doc ? metadataFromDoc(doc) : {};
}

export async function fetchBookMetadata(input: {
  displayTitle: string;
  workId?: string;
}): Promise<BookMetadata> {
  const key = cacheKey(input.workId, input.displayTitle);
  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.metadata;
  }

  try {
    const metadata = input.workId
      ? await fetchByWorkId(input.workId)
      : await fetchByTitle(input.displayTitle);

    const hasPages = metadata.totalPages !== undefined;
    const hasCover = metadata.coverUrl !== undefined;

    if (input.workId && (!hasPages || !hasCover)) {
      const fallback = await fetchByTitle(input.displayTitle);
      const merged: BookMetadata = {
        totalPages: metadata.totalPages ?? fallback.totalPages,
        coverUrl: metadata.coverUrl ?? fallback.coverUrl,
      };
      cache.set(key, {
        metadata: merged,
        expiresAt: Date.now() + METADATA_CACHE_TTL_MS,
      });
      return merged;
    }

    cache.set(key, {
      metadata,
      expiresAt: Date.now() + METADATA_CACHE_TTL_MS,
    });
    return metadata;
  } catch {
    return {};
  }
}

export function formatProgressLine(
  pagina: number,
  totalPages?: number
): string {
  if (totalPages === undefined) {
    return `🔖 Página ${pagina}`;
  }

  const pct = Math.min(
    100,
    Math.max(0, Math.round((pagina / totalPages) * 100))
  );
  return `🔖 Página ${pagina}/${totalPages} (${pct}%)`;
}
