import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const SUPABASE_URL = "https://enebjlvbaipggzswnzme.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVuZWJqbHZiYWlwZ2d6c3duem1lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyODc4NzEsImV4cCI6MjA4OTg2Mzg3MX0.JDWbZ0ce9CfoypVto-ndXRBTKBselqXj1SlQjpWYuk0";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function seed() {
  console.log('🔍 Checking if batch52_students table exists in Supabase...');
  const { data: testData, error: testError } = await supabase
    .from('batch52_students')
    .select('id')
    .limit(1);

  if (testError) {
    console.error('❌ Table check failed:', testError.message);
    console.log('💡 Please run supabase_batch52_students.sql in your Supabase SQL Editor first!');
    return;
  }

  console.log('✓ Table exists! Reading batch52_records.json...');
  const recordsPath = path.resolve('C:/Projects/ju-52-analytics/batch52_records.json');
  const records = JSON.parse(fs.readFileSync(recordsPath, 'utf-8'));
  console.log(`Found ${records.length} records. Preparing batch upsert...`);

  const batchSize = 100;
  let successCount = 0;

  for (let i = 0; i < records.length; i += batchSize) {
    const chunk = records.slice(i, i + batchSize).map((r) => ({
      id: r.id,
      sl_no: r.slNo,
      name: r.name,
      department: r.department,
      hall: r.hall,
      reg_no: r.regNo,
      roll_no: r.rollNo || '',
      session: r.session || '2022-2023',
      is_batch52: true,
    }));

    const { error } = await supabase.from('batch52_students').upsert(chunk, { onConflict: 'id' });
    if (error) {
      console.error(`Error uploading chunk ${i} - ${i + chunk.length}:`, error.message);
    } else {
      successCount += chunk.length;
      process.stdout.write(`\r✓ Uploaded ${successCount}/${records.length} students...`);
    }
  }

  console.log('\n🎉 Finished seeding batch52_students table!');
}

seed();
