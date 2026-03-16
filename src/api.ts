const BASE_URL = 'https://catapang1989-aniscrap.hf.space';

export async function fetchLatest(page: number = 1) {
  const res = await fetch(`${BASE_URL}/latest?p=${page}`);
  if (!res.ok) throw new Error('Failed to fetch latest episodes');
  return res.json();
}

export async function searchAnime(query: string) {
  const res = await fetch(`${BASE_URL}/search?q=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error('Failed to search anime');
  return res.json();
}

export async function fetchAnimeInfo(animeSession: string) {
  const res = await fetch(`${BASE_URL}/info/${animeSession}`);
  if (!res.ok) throw new Error('Failed to fetch anime info');
  return res.json();
}

export async function fetchAnimeEpisodes(animeSession: string, page: number = 1) {
  const res = await fetch(`${BASE_URL}/episodes/${animeSession}?p=${page}`);
  if (!res.ok) throw new Error('Failed to fetch anime episodes');
  return res.json();
}

export async function resolveEpisode(animeSession: string, episodeSession: string) {
  const res = await fetch(`${BASE_URL}/resolve/${animeSession}/${episodeSession}`);
  if (!res.ok) throw new Error('Failed to resolve episode');
  return res.json();
}
