const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const env = fs.readFileSync('.env', 'utf8').split('\n').reduce((acc, line) => {
  const [key, ...values] = line.split('=');
  if (key && values.length > 0) acc[key.trim()] = values.join('=').trim();
  return acc;
}, {});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_PUBLISHABLE_KEY);

async function clean() {
  const { data: settings } = await supabase.from('site_settings').select('*').single();
  const activeUrls = [
    settings.sponsor_video_url,
    settings.sponsor_video_url_2,
    settings.sponsor_video_url_3,
    settings.sponsor_video_url_4,
    settings.sponsor_video_url_5
  ].filter(Boolean);

  const activePaths = activeUrls.map(url => {
    try {
      const u = new URL(url);
      return decodeURIComponent(u.pathname.split('/').pop());
    } catch {
      return null;
    }
  }).filter(Boolean);

  console.log("Active files:", activePaths);

  const { data: files, error } = await supabase.storage.from('photos').list('sponsor_videos');
  if (error) {
    console.error(error);
    return;
  }

  const toDelete = files
    .filter(f => f.name !== '.emptyFolderPlaceholder' && !activePaths.includes(f.name))
    .map(f => `sponsor_videos/${f.name}`);
    
  console.log("Files to delete:", toDelete);

  if (toDelete.length > 0) {
    const { data, error: delErr } = await supabase.storage.from('photos').remove(toDelete);
    if (delErr) console.error("Error deleting:", delErr);
    else console.log("Deleted successfully:", data);
  } else {
    console.log("Nothing to delete.");
  }
}
clean();
