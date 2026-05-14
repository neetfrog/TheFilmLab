# TheFilmLab - Production Setup Guide

This guide covers the production build setup for TheFilmLab, including both web and Electron desktop applications.

## Overview

TheFilmLab is available in two formats:
- **Web Version**: Accessible via GitHub Pages or your own hosting
- **Desktop Version**: Windows installer and portable executable via GitHub Releases

## Prerequisites

- Node.js 18+ and npm
- Git
- Windows 10+ (for building Windows installers)
- A GitHub repository with release permissions

## Building for Production

### 1. Web Version Build

```bash
npm run build:web
```

This creates a single-file HTML build in `dist/web/` optimized for web hosting.

Deploy to GitHub Pages or your own hosting service.

### 2. Electron Desktop Build (Windows)

#### Development Testing
```bash
npm run electron:dev
```

#### Production Build
```bash
npm run dist:win
```

This creates both:
- `TheFilmLab-x.x.x.exe` - Windows installer
- `TheFilmLab.exe` - Portable executable (no installation needed)

Output files are in the `dist/` directory.

### 3. Full Build (Web + Desktop)

```bash
npm run build:all
npm run dist:win
```

## Versioning & Releases

### Updating Version

1. Edit `package.json` and update the `version` field:
```json
{
  "version": "1.0.1"
}
```

2. Commit and tag:
```bash
git add package.json
git commit -m "Bump version to 1.0.1"
git tag -a v1.0.1 -m "Release 1.0.1"
git push origin main --tags
```

### Automated GitHub Releases

When you push a tag (`v*.*.*`), the GitHub Actions workflow automatically:
1. Builds the Electron app
2. Creates Windows installer and portable executables
3. Creates a GitHub Release with the binaries as downloadable assets

The workflow is defined in `.github/workflows/build-release.yml`

### Manual Release Creation (if needed)

```bash
npm run dist:win
```

Then manually:
1. Go to GitHub → Releases → Draft a new release
2. Select your tag
3. Upload the `.exe` files from `dist/`
4. Write release notes
5. Publish

## Web Version Deployment

### GitHub Pages (Free)

The `.github/workflows/deploy-web.yml` workflow automatically deploys the web version to GitHub Pages on pushes to `main`.

**Setup:**
1. Go to repository Settings → Pages
2. Set Source to "GitHub Actions"
3. Enable GitHub Pages

### Custom Hosting

Deploy the contents of `dist/web/` to your hosting service (Netlify, Vercel, AWS, etc.)

## Desktop App Features

- Native Windows experience
- Offline support
- Better performance than web version
- Auto-update ready (can be added later)
- File system integration

## Web Version Features

- No installation required
- Works on any modern browser
- Responsive design (mobile-friendly)
- Desktop download banner for users to get the native app

## File Structure

```
.
├── electron/
│   ├── main.ts        # Electron main process
│   └── preload.ts     # Electron preload script
├── src/
│   ├── App.layout.tsx # Includes DesktopDownloadBanner
│   ├── components/
│   │   └── DesktopDownloadBanner.tsx  # Link to download desktop app
│   └── ...
├── .github/
│   └── workflows/
│       ├── build-release.yml  # Creates Windows releases
│       └── deploy-web.yml     # Deploys web version
├── package.json       # Configure in build.win section
└── vite.config.ts
```

## Troubleshooting

### Electron won't start in development
```bash
npm install
npm run build:electron
npm run electron:preview
```

### Windows build fails
- Ensure you have administrator privileges
- Try clearing `node_modules` and reinstalling: `npm ci`
- Check that you're on a Windows machine (for Windows builds)

### GitHub Actions workflow not triggering
- Verify you created an annotated tag: `git tag -a v1.0.0 -m "Release 1.0.0"`
- Push tags: `git push origin --tags`
- Check Actions tab for workflow status

## Security Notes

- No code signing is currently configured (can add to build config)
- Electron app runs in secure mode with contextIsolation enabled
- All image processing is done locally (no data sent to servers)

## Next Steps for Production

1. **Update GitHub URLs**: Replace `yourusername` in:
   - `electron/main.ts` (Help → GitHub Repository link)
   - `.github/workflows/build-release.yml` (release body)
   - `src/components/DesktopDownloadBanner.tsx` (download link)

2. **Add app icons** (optional):
   - Place in `assets/icons/icon.png` (256x256 or larger)
   - electron-builder will automatically create Windows icons

3. **Code Signing** (optional but recommended for production):
   - Add Windows certificate to package.json build config
   - Update electron/main.ts with certificate details

4. **Auto-Updates** (future enhancement):
   - Can be added using electron-updater
   - Requires hosting release files on a server

## Build Scripts Reference

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start web dev server |
| `npm run build:web` | Build web version |
| `npm run build:electron` | Build Electron app |
| `npm run electron:dev` | Test Electron locally |
| `npm run dist:win` | Create Windows installer + portable |
| `npm run dist:portable` | Create only portable exe |

## Environment Variables

- `NODE_ENV=production` - Set automatically during production builds
- `VITE_IS_ELECTRON=true` - Set when building Electron version (not used yet, for future optimization)

## Support

For issues:
1. Check GitHub Issues
2. Review error logs in `electron-debug.log`
3. Ensure all dependencies are up to date: `npm update`
