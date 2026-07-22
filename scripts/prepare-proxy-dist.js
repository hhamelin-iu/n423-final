const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, '..', 'dist');
const targetDir = path.join(distDir, 'loreboards');

if (fs.existsSync(distDir)) {
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const items = fs.readdirSync(distDir);
  for (const item of items) {
    if (item === 'loreboards') continue;
    const src = path.join(distDir, item);
    const dest = path.join(targetDir, item);
    fs.cpSync(src, dest, { recursive: true });
  }
  console.log('✓ Successfully mirrored dist/ into dist/loreboards/ for subpath hosting!');
}
