import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

async function testUpdate() {
  console.log("Testing update on site_settings...");
  const { data, error } = await supabase
    .from('site_settings')
    .update({ sponsor_video_url: 'https://youtu.be/test' })
    .eq('id', 1)
    .select();

  if (error) {
    console.error("Error updating:", error);
  } else {
    console.log("Update successful:", data);
  }
}

testUpdate();
