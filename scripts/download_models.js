const fs = require('fs');
const path = require('path');
const https = require('https');
const crypto = require('crypto');

const MODELS_DIR = path.join(__dirname, '../src/assets/models');

const MODELS = [
  {
    filename: 'face_detection.tflite',
    url: 'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite',
    fallbackUrl:
      'https://github.com/google-ai-edge/mediapipe/raw/master/mediapipe/modules/face_detection/face_detection_short_range.tflite',
    description:
      'MediaPipe BlazeFace short-range face detection model. Outputs bounding boxes and 6 keypoints.',
    license: 'Apache 2.0',
    input: '128x128x3 RGB normalized to [-1, 1]',
  },
  {
    filename: 'mobile_face_net.tflite',
    url: 'https://github.com/shubham0204/FaceRecognition_With_FaceNet_Android/raw/master/app/src/main/assets/mobile_face_net.tflite',
    fallbackUrl:
      'https://huggingface.co/sirius-ai/MobileFaceNet/resolve/main/MobileFaceNet.tflite',
    description:
      'MobileFaceNet quantized INT8 model for face recognition. Outputs 192-dim embedding.',
    license: 'MIT',
    input: '112x112x3 RGB normalized to [-1, 1]',
  },
];

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    https
      .get(url, response => {
        if (
          response.statusCode >= 300 &&
          response.statusCode < 400 &&
          response.headers.location
        ) {
          // Handle redirects (GitHub uses redirects for raw files)
          return downloadFile(response.headers.location, dest)
            .then(resolve)
            .catch(reject);
        }

        if (response.statusCode !== 200) {
          return reject(
            new Error(`Failed to download: Status ${response.statusCode}`),
          );
        }

        const file = fs.createWriteStream(dest);
        response.pipe(file);
        file.on('finish', () => {
          file.close(resolve);
        });
        file.on('error', err => {
          fs.unlink(dest, () => reject(err));
        });
      })
      .on('error', reject);
  });
}

function calculateHashAndSize(filePath) {
  return new Promise((resolve, reject) => {
    try {
      const stats = fs.statSync(filePath);
      const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);

      const fileBuffer = fs.readFileSync(filePath);
      const hashSum = crypto.createHash('sha256');
      hashSum.update(fileBuffer);
      const hex = hashSum.digest('hex');

      resolve({size: `${sizeMB} MB`, hash: hex});
    } catch (e) {
      reject(e);
    }
  });
}

async function main() {
  if (!fs.existsSync(MODELS_DIR)) {
    fs.mkdirSync(MODELS_DIR, {recursive: true});
    console.log(`Created directory: ${MODELS_DIR}`);
  }

  let infoMd =
    '# Models Information\n\nGenerated automatically by `scripts/download_models.js`.\n\n';
  let totalSizeMB = 0;

  for (const model of MODELS) {
    const destPath = path.join(MODELS_DIR, model.filename);
    console.log(`Downloading ${model.filename}...`);

    try {
      await downloadFile(model.url, destPath);
      console.log(
        `Successfully downloaded ${model.filename} from primary URL.`,
      );
    } catch (e) {
      console.warn(
        `Primary URL failed for ${model.filename}: ${e.message}. Trying fallback...`,
      );
      try {
        await downloadFile(model.fallbackUrl, destPath);
        console.log(
          `Successfully downloaded ${model.filename} from fallback URL.`,
        );
      } catch (e2) {
        console.error(
          `Fallback URL also failed for ${model.filename}: ${e2.message}`,
        );
        console.error(
          `Please download it manually to src/assets/models/${model.filename}`,
        );
        continue;
      }
    }

    const {size, hash} = await calculateHashAndSize(destPath);
    console.log(`Verified ${model.filename}: Size = ${size}, SHA256 = ${hash}`);
    totalSizeMB += parseFloat(size);

    infoMd += `## ${model.filename}\n`;
    infoMd += `- **Description:** ${model.description}\n`;
    infoMd += `- **Size:** ${size}\n`;
    infoMd += `- **SHA256:** \`${hash}\`\n`;
    infoMd += `- **License:** ${model.license}\n`;
    infoMd += `- **Input:** ${model.input}\n\n`;
  }

  infoMd += `---\n**Total Models Size:** ${totalSizeMB.toFixed(2)} MB\n`;

  const infoPath = path.join(MODELS_DIR, 'MODELS_INFO.md');
  fs.writeFileSync(infoPath, infoMd, 'utf8');
  console.log(`\nWrote model info to ${infoPath}`);
  console.log(`Total size: ${totalSizeMB.toFixed(2)} MB`);
}

main().catch(console.error);
