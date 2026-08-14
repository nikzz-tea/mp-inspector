export function parseMatchId(input: string): number | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  if (/^\d+$/.test(trimmed)) {
    return Number(trimmed);
  }

  try {
    const url = new URL(trimmed);
    const match = url.pathname.match(/\/(?:community\/matches|mp)\/(\d+)(?:\/|$)/);
    if (match) return Number(match[1]);
  } catch {}

  return null;
}
