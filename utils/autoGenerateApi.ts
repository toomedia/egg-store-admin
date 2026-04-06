/**
 * Normalize NEXT_PUBLIC_AUTO_GENERATE_API_URL to origin only so paths like
 * …/api/auto-generate-preset do not produce …/api/foo/api/bar.
 */
export function getAutoGenerateApiOrigin(): string | null {
  const raw = process.env.NEXT_PUBLIC_AUTO_GENERATE_API_URL;
  if (!raw?.trim()) return null;
  try {
    return new URL(raw.trim()).origin;
  } catch {
    return null;
  }
}
