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

const COLLECTION_BUCKET_NAME = 'collection-sprites';
const UPLOAD_CONCURRENCY = 5;

async function createBucketIfNotExists() {
  try {
    // Check if bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Error listing buckets:', listError.message);
      return false;
    }

    const bucketExists = buckets.some(bucket => bucket.name === COLLECTION_BUCKET_NAME);
    
    if (!bucketExists) {
      console.log(`Creating bucket: ${COLLECTION_BUCKET_NAME}`);
      const { data, error } = await supabase.storage.createBucket(COLLECTION_BUCKET_NAME, {
        public: true,
        allowedMimeTypes: ['image/gif', 'image/png'],
        fileSizeLimit: 10485760 // 10MB
      });

      if (error) {
        console.error('Error creating bucket:', error.message);
        return false;
      }
      console.log('Bucket created successfully');
    } else {
      console.log(`Bucket ${COLLECTION_BUCKET_NAME} already exists`);
    }
    return true;
  } catch (error) {
    console.error('Error in createBucketIfNotExists:', error.message);
    return false;
  }
}

async function uploadFile(filePath, supabasePath) {
  try {
    const fileContent = await fs.readFile(filePath);

    // Get the file's MIME type
    const contentType = 'image/gif';

    const { data, error } = await supabase.storage
      .from(COLLECTION_BUCKET_NAME)
      .upload(supabasePath, fileContent, {
        contentType,
        upsert: true, // Overwrite if file exists
      });

    if (error) {
      throw error;
    }

    console.log(`Successfully uploaded ${path.basename(filePath)} to ${data.path}`);
    return true;
  } catch (error) {
    console.error(`Error uploading ${filePath}:`, error.message);
    return false;
  }
}

async function uploadDirectory(localDir, remoteDir) {
  if (!fsSync.existsSync(localDir)) {
    console.error(`Directory not found: ${localDir}`);
    return false;
  }

  const files = await fs.readdir(localDir);
  const gifFiles = files.filter(file => file.endsWith('.gif'));

  console.log(`Found ${gifFiles.length} GIF files in ${localDir}`);

  // Upload files with concurrency control
  const semaphore = Array(UPLOAD_CONCURRENCY).fill(null);
  let currentIndex = 0;
  let successCount = 0;
  let failCount = 0;

  const uploadNext = async () => {
    while (currentIndex < gifFiles.length) {
      const index = currentIndex++;
      const file = gifFiles[index];
      const localPath = path.join(localDir, file);
      const remotePath = `${remoteDir}/${file}`;
      
      const success = await uploadFile(localPath, remotePath);
      if (success) {
        successCount++;
      } else {
        failCount++;
      }
    }
  };

  await Promise.all(semaphore.map(() => uploadNext()));

  console.log(`Upload complete for ${remoteDir}: ${successCount} successful, ${failCount} failed`);
  return failCount === 0;
}

async function uploadCollectionSprites() {
  console.log('Starting collection sprite upload...');

  const spritesDir = path.resolve(__dirname, '../public/collection-sprites');
  const normalDir = path.join(spritesDir, 'normal');
  const shinyDir = path.join(spritesDir, 'shiny');
  
  if (!fsSync.existsSync(spritesDir)) {
    console.error(`Directory not found: ${spritesDir}`);
    console.error('Please run the download-collection-sprites.js script first.');
    return false;
  }

  // Create bucket if it doesn't exist
  const bucketReady = await createBucketIfNotExists();
  if (!bucketReady) {
    console.error('Failed to create or access bucket');
    return false;
  }

  let allSuccess = true;

  // Upload normal sprites
  if (fsSync.existsSync(normalDir)) {
    console.log('Uploading normal sprites...');
    const normalSuccess = await uploadDirectory(normalDir, 'normal');
    allSuccess = allSuccess && normalSuccess;
  } else {
    console.warn('Normal sprites directory not found');
  }

  // Upload shiny sprites
  if (fsSync.existsSync(shinyDir)) {
    console.log('Uploading shiny sprites...');
    const shinySuccess = await uploadDirectory(shinyDir, 'shiny');
    allSuccess = allSuccess && shinySuccess;
  } else {
    console.warn('Shiny sprites directory not found');
  }

  return allSuccess;
}

async function generateStorageUrls() {
  console.log('Generating storage URLs...');
  
  const { data: normalFiles } = await supabase.storage
    .from(COLLECTION_BUCKET_NAME)
    .list('normal');
    
  const { data: shinyFiles } = await supabase.storage
    .from(COLLECTION_BUCKET_NAME)
    .list('shiny');

  if (!normalFiles || !shinyFiles) {
    console.error('Error listing uploaded files');
    return;
  }

  console.log(`Found ${normalFiles.length} normal sprites and ${shinyFiles.length} shiny sprites uploaded`);

  // Generate URLs for verification
  const baseUrl = `${supabaseUrl}/storage/v1/object/public/${COLLECTION_BUCKET_NAME}`;
  
  console.log('\nSample URLs:');
  if (normalFiles.length > 0) {
    console.log(`Normal sprite example: ${baseUrl}/normal/${normalFiles[0].name}`);
  }
  if (shinyFiles.length > 0) {
    console.log(`Shiny sprite example: ${baseUrl}/shiny/${shinyFiles[0].name}`);
  }
}

async function main() {
  try {
    const success = await uploadCollectionSprites();
    
    if (success) {
      console.log('\n✅ All collection sprites uploaded successfully!');
      await generateStorageUrls();
    } else {
      console.log('\n❌ Some uploads failed. Check the logs above.');
      process.exit(1);
    }
  } catch (error) {
    console.error('Error during upload:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
} 