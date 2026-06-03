import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://enebjlvbaipggzswnzme.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVuZWJqbHZiYWlwZ2d6c3duem1lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyODc4NzEsImV4cCI6MjA4OTg2Mzg3MX0.JDWbZ0ce9CfoypVto-ndXRBTKBselqXj1SlQjpWYuk0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumn() {
  console.log('Checking for tricks_history column in twenty_nine_rooms table...');
  const { data, error } = await supabase
    .from('twenty_nine_rooms')
    .select('tricks_history')
    .limit(1);

  if (error) {
    if (error.message.includes('column') && error.message.includes('does not exist')) {
      console.log('RESULT: COLUMN_DOES_NOT_EXIST');
    } else {
      console.error('Error during query:', error);
      console.log('RESULT: ERROR');
    }
  } else {
    console.log('RESULT: COLUMN_EXISTS');
  }
}

checkColumn();
