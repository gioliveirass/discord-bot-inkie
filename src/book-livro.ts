const LIVRO_VALUE_PREFIX = "ol:";

/** Valor guardado no slash (autocomplete) → título exibido + id Open Library opcional. */
export function parseLivroInput(raw: string): {
  displayTitle: string;
  workId?: string;
} {
  if (!raw.startsWith(LIVRO_VALUE_PREFIX)) {
    return { displayTitle: raw.trim() };
  }

  const pipeIndex = raw.indexOf("|");
  if (pipeIndex === -1) {
    return { displayTitle: raw.trim() };
  }

  const workId = raw.slice(LIVRO_VALUE_PREFIX.length, pipeIndex).trim();
  const displayTitle = raw.slice(pipeIndex + 1).trim();

  if (!displayTitle) {
    return { displayTitle: raw.trim() };
  }

  return {
    displayTitle,
    workId: workId || undefined,
  };
}

export function encodeLivroValue(workId: string, label: string): string {
  const prefix = `${LIVRO_VALUE_PREFIX}${workId}|`;
  const maxLabelLength = 100 - prefix.length;
  const trimmedLabel =
    maxLabelLength > 0 ? label.slice(0, maxLabelLength) : label.slice(0, 100);
  return `${prefix}${trimmedLabel}`;
}

/** Título usado na busca quando não há id da obra. */
export function livroSearchQuery(displayTitle: string): string {
  const titlePart = displayTitle.split(" — ")[0]?.trim();
  return titlePart || displayTitle.trim();
}
