import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const SUPABASE_URL = "https://enebjlvbaipggzswnzme.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVuZWJqbHZiYWlwZ2d6c3duem1lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyODc4NzEsImV4cCI6MjA4OTg2Mzg3MX0.JDWbZ0ce9CfoypVto-ndXRBTKBselqXj1SlQjpWYuk0";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export async function seed() {
  console.log('🔍 Checking if batch52_students table exists in Supabase...');
  const { data: testData, error: testError } = await supabase
    .from('batch52_students')
    .select('id')
    .limit(1);

  if (testError) {
    console.log('❌ Table does not exist yet:', testError.message);
    console.log('👉 Please run supabase_batch52_students.sql in your Supabase SQL Editor first!');
    return false;
  }

  console.log('✓ Table exists! Reading cleaned 1951 records...');
  const dataPath = path.resolve('C:/Users/atiqu/.gemini/antigravity/scratch/ju52_data_cleaned_1951.json');
  const parsed = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
  const records = parsed.records;
  console.log(`Found ${records.length} records. Uploading in batches of 100...`);

  const batchSize = 100;
  let success = 0;

  for (let i = 0; i < records.length; i += batchSize) {
    const chunk = records.slice(i, i + batchSize).map(r => ({
      id: r.id,
      sl_no: r.slNo,
      name: r.name,
      department: r.department,
      hall: r.hall,
      reg_no: r.regNo,
      roll_no: r.rollNo,
      session: r.session || '2022-2023',
      is_batch52: true
    }));

    const { error } = await supabase.from('batch52_students').upsert(chunk, { onConflict: 'id' });
    if (error) {
      console.error(`Error uploading batch ${i}-${i + chunk.length}:`, error.message);
    } else {
      success += chunk.length;
      process.stdout.write(`\r✓ Uploaded ${success}/${records.length} students...`);
    }
  }

  console.log('\n🎉 Finished! All', success, 'students are now live in Supabase database!');
  return true;
}

seed();
