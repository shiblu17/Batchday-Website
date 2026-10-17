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
        title: "Bondhu Tomay",
        artist: "Chandrabindoo",
        artwork: "https://is1-ssl.mzstatic.com/image/thumb/Music/v4/4a/5b/c2/4a5bc288-7523-d3c5-9018-095fa8090875/source/100x100bb.jpg",
        previewUrl: "",
        tag: "আড্ডা ভাইব",
      },
      {
        id: "bot_2",
        title: "Ami Banglay Gaan Gai",
        artist: "Pratul Mukhopadhyay",
        artwork: "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/1e/8c/6f/1e8c6f14-631c-b171-ec46-24e0374e2a7b/source/100x100bb.jpg",
        previewUrl: "",
        tag: "ক্যাম্পাস স্মৃতি",
      },
      {
        id: "bot_3",
        title: "Kotobar Bhebechinu",
        artist: "Sahana Bajpaie",
        artwork: "https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/b9/e1/9e/b9e19e91-72a3-2c4f-3ff8-55447164b3ef/source/100x100bb.jpg",
        previewUrl: "",
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
        title: "Hasimukhe",
        artist: "Shironamhin",
        artwork: "https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/a4/0c/b2/a40cb21b-cd5e-cba0-59f7-646eb7922d56/source/100x100bb.jpg",
        previewUrl: "",
        tag: "মুক্তমঞ্চ ব্যান্ড",
      },
      {
        id: "mukto_2",
        title: "Sei Tumi",
        artist: "Ayub Bachchu",
        artwork: "https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/d3/18/f2/d318f219-c967-bf09-22a9-b148bfebf94e/source/100x100bb.jpg",
        previewUrl: "",
        tag: "কাল্ট রক",
      },
      {
        id: "mukto_3",
        title: "Bhalobashi Jyotsnay",
        artist: "Shironamhin",
        artwork: "https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/a4/0c/b2/a40cb21b-cd5e-cba0-59f7-646eb7922d56/source/100x100bb.jpg",
        previewUrl: "",
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
        artwork: "https://is1-ssl.mzstatic.com/image/thumb/Music/v4/85/38/c1/8538c11e-84b2-2aa7-f2ba-a5be715bf85e/source/100x100bb.jpg",
        previewUrl: "",
        tag: "ইমোশনাল স্মৃতি",
      },
      {
        id: "smriti_2",
        title: "Purano Sei Diner Kotha",
        artist: "Rabindrasangeet",
        artwork: "https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/28/90/19/289019aa-7d5d-c60f-e221-50e50882e366/source/100x100bb.jpg",
        previewUrl: "",
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
        artwork: "https://is1-ssl.mzstatic.com/image/thumb/Music128/v4/33/c4/8c/33c48ce4-5544-77bf-93f8-8a8b1ef75d31/source/100x100bb.jpg",
        previewUrl: "",
        tag: "চিল ভাইব",
      },
      {
        id: "tarzan_2",
        title: "Riptide",
        artist: "Vance Joy",
        artwork: "https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/8e/3c/6f/8e3c6f89-c4c0-fae9-6f3e-5a0d33e72648/source/100x100bb.jpg",
        previewUrl: "",
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
  const preset = SPOT_MUSIC_PRESETS[spotKey];

  // Fetch real online preview URLs from iTunes using default query
  const liveResults = await searchAppleMusic(preset.defaultQuery, 6);
  if (liveResults.length > 0) {
    return liveResults;
  }

  return preset.recommendations;
}
