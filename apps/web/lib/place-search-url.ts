export function buildPlaceSearchUrl(placeName: string, destinationContext?: string): string {
  const trimmedPlace = placeName.trim();
  const trimmedContext = destinationContext?.trim();
  const query = trimmedContext ? `${trimmedPlace} ${trimmedContext}` : trimmedPlace;
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}
