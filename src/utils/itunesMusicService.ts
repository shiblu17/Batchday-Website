/**
 * Apple iTunes Music Service for JU 52 Reels
 * Smart spot-based song suggestions & instant global music search
 */

export interface MusicTrackItem {
  id: string;
  title: string;
  artist: string;
  artwork: string;
  previewUrl: string;
  tag?: string;
}

// In-memory cache for fast instant search
const searchCache = new Map<string, MusicTrackItem[]>();

// Smart suggestions categorized by Campus Spots & Moods (Facebook/Instagram Style)
export const SPOT_MUSIC_PRESETS: Record<
  string,
  { tag: string; defaultQuery: string; recommendations: MusicTrackItem[] }
> = {
  "বটতলা": {
    tag: "বটতলার আড্ডা ও বন্ধুত্ব",
    defaultQuery: "bondhu bangla",
    recommendations: [
      {
        id: "bot_1",
        title: "Bandhu Tomaye",
        artist: "Chandrabindoo",
        artwork: "https://is1-ssl.mzstatic.com/image/thumb/Music7/v4/ae/a4/b4/aea4b474-3799-ade5-3b91-63ce1aa4e02e/889845210672.jpg/200x200bb.jpg",
        previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview125/v4/5a/64/27/5a64278e-33d5-25dc-5936-f54bb74bfc7d/mzaf_14888045891037952509.plus.aac.p.m4a",
        tag: "আড্ডা ভাইব",
      },
      {
        id: "bot_2",
        title: "Ami Banglay Gaan Gai",
        artist: "Pratul Mukhopadhyay",
        artwork: "https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/78/c0/3f/78c03f8b-197d-b0ad-dd4d-478c68756081/196589539946.jpg/200x200bb.jpg",
        previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview112/v4/f9/92/4e/f9924ee5-5988-4c47-d097-08f63ab7cccf/mzaf_3566951895337112925.plus.aac.p.m4a",
        tag: "ক্যাম্পাস স্মৃতি",
      },
      {
        id: "bot_3",
        title: "Kotobaro Bhebechinu",
        artist: "Sahana Bajpaie",
        artwork: "https://is1-ssl.mzstatic.com/image/thumb/Music113/v4/4c/41/1a/4c411a30-5f9b-f14b-a289-20dbc25daaf4/5059435337804_cover.jpg/200x200bb.jpg",
        previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview115/v4/55/f0/c7/55f0c79c-b2f3-cf5c-17f2-50b6b51fefd7/mzaf_12308058522667923372.plus.aac.p.m4a",
        tag: "নস্টালজিয়া",
      },
    ],
  },
  "মুক্তমঞ্চ": {
    tag: "কনসার্ট, ব্যান্ড ও রক মিউজিক",
    defaultQuery: "shironamhin rock",
    recommendations: [
      {
        id: "mukto_1",
        title: "Bondho Janala",
        artist: "Shironamhin",
        artwork: "https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/64/d9/57/64d95787-c71b-a6bf-c0da-bba0ae9ff778/cover.jpg/200x200bb.jpg",
        previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview116/v4/45/65/04/45650424-3e6c-4b74-1b10-22e039ee7907/mzaf_8578688195781003469.plus.aac.p.m4a",
        tag: "মুক্তমঞ্চ ব্যান্ড",
      },
      {
        id: "mukto_2",
        title: "Boshe Achi",
        artist: "Warfaze",
        artwork: "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/c9/38/75/c93875ae-3a97-d36e-2117-dd8af15326cc/447e8a51-6317-4d32-9bd7-c74887ed19fd.jpg/200x200bb.jpg",
        previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/78/a2/a6/78a2a68d-b200-7cf5-c3ee-271d2df112d0/mzaf_10679641256958330486.plus.aac.p.m4a",
        tag: "কাল্ট রক",
      },
      {
        id: "mukto_3",
        title: "Oniket Prantor",
        artist: "Artcell",
        artwork: "https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/bb/29/c2/bb29c23f-8e69-4647-119e-4851f465e83d/151235.jpg/200x200bb.jpg",
        previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview116/v4/c0/28/0f/c0280fb7-5684-16a6-147f-a84c2626fe56/mzaf_14338113654976771860.plus.aac.p.m4a",
        tag: "রাতজাগা কনসার্ট",
      },
    ],
  },
  "কেন্দ্রীয় শহীদ মিনার": {
    tag: "স্মৃতিকথা ও ক্যাম্পাসের সুর",
    defaultQuery: "anupam roy",
    recommendations: [
      {
        id: "smriti_1",
        title: "Amake Amar Moto Thakte Dao",
        artist: "Anupam Roy",
        artwork: "https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/a7/81/cb/a781cb19-1bf6-f76b-1ca9-3d80c424b458/840123914354.png/200x200bb.jpg",
        previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview116/v4/03/6b/9f/036b9fa6-f19a-7d29-592c-4aebb720ee2f/mzaf_14338565631606129050.plus.aac.p.m4a",
        tag: "ইমোশনাল স্মৃতি",
      },
      {
        id: "smriti_2",
        title: "Purano Sei Diner Kotha",
        artist: "Sahana Bajpaie",
        artwork: "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/44/43/44/444344f7-46f7-c98f-e416-de2e0572521f/840123901040.png/200x200bb.jpg",
        previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview112/v4/a1/aa/fb/a1aafbec-4932-f4dc-952e-bdc177e75e69/mzaf_17508685309311398613.plus.aac.p.m4a",
        tag: "বিদায়ের গান",
      },
    ],
  },
  "টারজান পয়েন্ট": {
    tag: "গিটার, আড্ডা ও আনপ্লাগড সুর",
    defaultQuery: "acoustic guitar instrumental",
    recommendations: [
      {
        id: "tarzan_1",
        title: "Sunflower",
        artist: "Post Malone & Swae Lee",
        artwork: "https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/4b/30/2c/4b302cb6-7a14-5464-4e97-0577e9d0be49/18UMGIM82277.rgb.jpg/200x200bb.jpg",
        previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/98/f0/d6/98f0d67e-f8bf-762d-cac7-1c6b3b6b35dd/mzaf_4543283896248560946.plus.aac.p.m4a",
        tag: "চিল ভাইব",
      },
      {
        id: "tarzan_2",
        title: "Riptide",
        artist: "Vance Joy",
        artwork: "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/7a/1c/65/7a1c6571-34e9-bb77-32be-90c72ba003c0/075679920355.jpg/200x200bb.jpg",
        previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/1e/de/ea/1edeea50-c0f4-9d95-f0b8-b23a1af561db/mzaf_6343110017276582270.plus.aac.p.m4a",
        tag: "ইউকুলেলে ভাইব",
      },
    ],
  },
};

/**
 * Quick Category Search Tags (Facebook/Instagram Style)
 */
export const TRENDING_SEARCH_TAGS = [
  "Shironamhin",
  "Arijit Singh",
  "Anupam Roy",
  "Coke Studio Bangla",
  "Tahsan",
  "Warfaze",
  "Habib Wahid",
  "Lofi Bangla",
  "Bollywood Romance",
  "Taylor Swift",
];

/**
 * Searches Apple iTunes Store API for real tracks with 30s previews
 */
export async function searchAppleMusic(query: string, limit = 15): Promise<MusicTrackItem[]> {
  const cleanTerm = query.trim().toLowerCase();
  if (!cleanTerm) return [];

  if (searchCache.has(cleanTerm)) {
    return searchCache.get(cleanTerm)!;
  }

  try {
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(
      cleanTerm
    )}&limit=${limit}&media=music&entity=song`;

    const res = await fetch(url);
    if (!res.ok) throw new Error("Music search failed");

    const data = await res.json();
    const tracks: MusicTrackItem[] = (data.results || [])
      .filter((r: any) => r.previewUrl) // Must have 30s audio preview
      .map((r: any) => ({
        id: String(r.trackId),
        title: r.trackName,
        artist: r.artistName,
        artwork: r.artworkUrl100?.replace("100x100bb", "200x200bb") || r.artworkUrl100,
        previewUrl: r.previewUrl,
        tag: r.primaryGenreName,
      }));

    searchCache.set(cleanTerm, tracks);
    return tracks;
  } catch (err) {
    console.warn("iTunes search error:", err);
    return [];
  }
}

/**
 * Get Smart Song Recommendations for a specific campus spot
 */
export async function getSmartRecommendations(spotName?: string): Promise<MusicTrackItem[]> {
  const spotKey = spotName && SPOT_MUSIC_PRESETS[spotName] ? spotName : "বটতলা";
  const preset = SPOT_MUSIC_PRESETS[spotKey] || SPOT_MUSIC_PRESETS["বটতলা"];
  return preset.recommendations;
}
