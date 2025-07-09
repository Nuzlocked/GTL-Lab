require('dotenv').config();
const fs = require('fs/promises');
const fsSync = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const { Buffer } = require('buffer');

// This script requires REACT_APP_SUPABASE_URL and SUPABASE_SERVICE_KEY to be set as environment variables
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: REACT_APP_SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables must be set.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const BUCKET_NAME = 'sprites';

async function uploadFile(filePath, supabasePath) {
  try {
    const fileContent = await fs.readFile(filePath);

    // Get the file's MIME type
    const contentType = 'image/png';

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(supabasePath, fileContent, {
        contentType,
        upsert: true, // Overwrite if file exists
      });

    if (error) {
      throw error;
    }

    console.log(`Successfully uploaded ${filePath} to ${data.path}`);
  } catch (error) {
    console.error(`Error uploading ${filePath}:`, error.message);
  }
}

async function uploadSprites() {
  const spritesDir = path.resolve(__dirname, '../public/sprites');
  
  if (!fsSync.existsSync(spritesDir)) {
    console.error(`Directory not found: ${spritesDir}`);
    console.error('Please run the download-sprites.js script first.');
    return;
  }

  const files = await fs.readdir(spritesDir);

  for (const file of files) {
    const localPath = path.join(spritesDir, file);
    const supabasePath = file;
    await uploadFile(localPath, supabasePath);
  }
}

uploadSprites(); 