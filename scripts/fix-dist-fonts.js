const fs = require('fs');
const path = require('path');

const distPath = path.join(__dirname, '..', 'dist');

function replaceInTextFiles(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      replaceInTextFiles(fullPath);
    } else if (
      entry.isFile() &&
      (entry.name.endsWith('.js') ||
        entry.name.endsWith('.html') ||
        entry.name.endsWith('.css') ||
        entry.name.endsWith('.json') ||
        entry.name.endsWith('.map'))
    ) {
      let content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('node_modules')) {
        content = content.replace(/node_modules/g, 'vendor_modules');
        fs.writeFileSync(fullPath, content, 'utf8');
      }
    }
  }
}

function recursivelyRenameNodeModulesDirs(parentDir) {
  if (!fs.existsSync(parentDir)) return;
  const entries = fs.readdirSync(parentDir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(parentDir, entry.name);

    if (entry.isDirectory()) {
      // First process children recursively
      recursivelyRenameNodeModulesDirs(fullPath);

      // If this directory itself is named 'node_modules', rename it
      if (entry.name === 'node_modules') {
        const targetPath = path.join(parentDir, 'vendor_modules');
        if (fs.existsSync(targetPath)) {
          const files = fs.readdirSync(fullPath);
          for (const f of files) {
            const srcItem = path.join(fullPath, f);
            const destItem = path.join(targetPath, f);
            if (fs.existsSync(destItem)) {
              fs.rmSync(destItem, { recursive: true, force: true });
            }
            fs.renameSync(srcItem, destItem);
          }
          fs.rmdirSync(fullPath);
        } else {
          fs.renameSync(fullPath, targetPath);
        }
      }
    }
  }
}

if (fs.existsSync(distPath)) {
  console.log('Processing dist assets for Cloudflare Pages compatibility...');
  recursivelyRenameNodeModulesDirs(distPath);
  replaceInTextFiles(distPath);
  console.log('✓ Successfully eliminated node_modules paths and updated references in dist!');
} else {
  console.log('No dist directory found.');
}

