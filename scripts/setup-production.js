#!/usr/bin/env node

/**
 * Production Setup Script
 * 
 * Run this after cloning/forking to set up production builds
 * Usage: node scripts/setup-production.js [YOUR_GITHUB_USERNAME]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

function setupProduction(githubUser) {
  if (!githubUser) {
    console.error('❌ GitHub username required');
    console.log('Usage: node scripts/setup-production.js your-github-username');
    process.exit(1);
  }

  const repoName = 'thefilmlab'; // Update if different
  const files = [
    {
      path: path.join(rootDir, 'electron', 'main.ts'),
      find: /https:\/\/github\.com\/yourusername\/thefilmlab/g,
      replace: `https://github.com/${githubUser}/${repoName}`,
    },
    {
      path: path.join(rootDir, '.github', 'workflows', 'build-release.yml'),
      find: /yourusername\/thefilmlab/g,
      replace: `${githubUser}/${repoName}`,
    },
    {
      path: path.join(rootDir, 'src', 'components', 'DesktopDownloadBanner.tsx'),
      find: /https:\/\/github\.com\/yourusername\/thefilmlab\/releases/g,
      replace: `https://github.com/${githubUser}/${repoName}/releases`,
    },
  ];

  let updated = 0;

  files.forEach(({ path: filePath, find, replace: replaceWith }) => {
    try {
      let content = fs.readFileSync(filePath, 'utf-8');
      if (find.test(content)) {
        content = content.replace(find, replaceWith);
        fs.writeFileSync(filePath, content, 'utf-8');
        console.log(`✅ Updated: ${path.relative(rootDir, filePath)}`);
        updated++;
      }
    } catch (err) {
      console.warn(`⚠️  Could not update: ${path.relative(rootDir, filePath)}`);
    }
  });

  if (updated > 0) {
    console.log(`\n✨ Setup complete! ${updated} files updated.`);
    console.log('\nNext steps:');
    console.log('1. npm install');
    console.log('2. npm run build:web');
    console.log('3. npm run dist:win (on Windows for installers)');
    console.log('\nSee PRODUCTION.md for full documentation');
  } else {
    console.log('No files needed updating.');
  }
}

const githubUser = process.argv[2];
setupProduction(githubUser);
