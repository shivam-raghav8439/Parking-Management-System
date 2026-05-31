import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const generateIcon = async (size, outputPath) => {
  const svg = `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" fill="#1a56db"/>
      <text x="50%" y="68%" font-family="system-ui, -apple-system, sans-serif" font-size="${size * 0.65}" font-weight="900" fill="white" text-anchor="middle">P</text>
    </svg>
  `;
  
  await sharp(Buffer.from(svg))
    .png()
    .toFile(outputPath);
  console.log(`Generated ${size}x${size} icon at ${outputPath}`);
};

const main = async () => {
  const publicDir = path.resolve(__dirname, '../../public');
  await generateIcon(192, path.join(publicDir, 'icon-192.png'));
  await generateIcon(512, path.join(publicDir, 'icon-512.png'));
};

main().catch(console.error);
