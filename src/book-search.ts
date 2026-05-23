import type { ApplicationCommandOptionChoiceData } from "discord.js";
import { encodeLivroValue } from "./book-livro.js";

const OPEN_LIBRARY_URL = "https://openlibrary.org/search.json";
const MIN_QUERY_LENGTH = 2;
const MAX_CHOICES = 25;
const FETCH_TIMEOUT_MS = 2500;
const CACHE_TTL_MS = 60_000;

type OpenLibraryDoc = {
  title?: string;
  author_name?: string[];
  key?: string;
};

function workIdFromKey(key?: string): string | undefined {
  if (!key) return undefined;
  const match = key.match(/\/works\/(OL\w+)/);
  return match?.[1];
}

type CacheEntry = {
  choices: ApplicationCommandOptionChoiceData[];
  expiresAt: number;
};

const cache = new Map<string, CacheEntry>();

function formatBookLabel(title: string, authors?: string[]): string {
  const authorText =
    authors && authors.length > 0
      ? authors.slice(0, 2).join(", ")
      : "autor desconhecido";

  const label = `${title} — ${authorText}`;
  if (label.length <= 100) return label;
  return `${label.slice(0, 97)}...`;
}

async function fetchOpenLibrary(
  query: string
): Promise<ApplicationCommandOptionChoiceData[]> {
  const params = new URLSearchParams({
    q: query,
    limit: String(MAX_CHOICES),
    fields: "title,author_name,key",
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(`${OPEN_LIBRARY_URL}?${params}`, {
      signal: controller.signal,
    });

    if (!response.ok) return [];

    const data = (await response.json()) as { docs?: OpenLibraryDoc[] };
    const seen = new Set<string>();
    const choices: ApplicationCommandOptionChoiceData[] = [];

    for (const doc of data.docs ?? []) {
      if (!doc.title) continue;

      const label = formatBookLabel(doc.title, doc.author_name);
      const key = label.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);

      const workId = workIdFromKey(doc.key);
      const value = workId ? encodeLivroValue(workId, label) : label.slice(0, 100);
      choices.push({ name: label, value });
      if (choices.length >= MAX_CHOICES) break;
    }

    return choices;
  } finally {
    clearTimeout(timeout);
  }
}

export async function searchBookChoices(
  query: string
): Promise<ApplicationCommandOptionChoiceData[]> {
  const trimmed = query.trim();
  if (trimmed.length < MIN_QUERY_LENGTH) return [];

  const cacheKey = trimmed.toLowerCase();
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.choices;
  }

  try {
    const choices = await fetchOpenLibrary(trimmed);
    cache.set(cacheKey, {
      choices,
      expiresAt: Date.now() + CACHE_TTL_MS,
    });
    return choices;
  } catch {
    return [];
  }
}
