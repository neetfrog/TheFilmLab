#!/bin/bash
# TheFilmLab Production Setup - Complete Command Sequence

echo "🎬 TheFilmLab Production Setup"
echo "=============================="
echo ""

# Step 1: Update GitHub URLs
read -p "Enter your GitHub username: " GITHUB_USER

if [ -z "$GITHUB_USER" ]; then
    echo "❌ Username required"
    exit 1
fi

echo "📝 Updating GitHub URLs for $GITHUB_USER..."
node scripts/setup-production.js "$GITHUB_USER"

# Step 2: Build verification
echo ""
echo "🔨 Building web and Electron versions..."
npm run build:all

if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "📦 Build outputs:"
echo "  - Web:     dist/web/index.html"
echo "  - Electron: dist/electron/main.js"
echo ""
echo "🚀 Next steps:"
echo ""
echo "1. Review the blue banner in web version:"
echo "   npm run dev"
echo "   # Open http://localhost:5173"
echo ""
echo "2. Test Electron app:"
echo "   npm run electron:dev"
echo ""
echo "3. Create your first release:"
echo "   git tag -a v1.0.0 -m 'Initial Release'"
echo "   git push origin main --tags"
echo ""
echo "   GitHub Actions will automatically:"
echo "   - Build Windows installer"
echo "   - Create GitHub Release"
echo "   - Deploy web version to GitHub Pages"
echo ""
echo "📖 Read these for more info:"
echo "   - QUICK_START.md - Quick reference"
echo "   - GETTING_STARTED_PRODUCTION.md - Detailed guide"
echo "   - PRODUCTION.md - Advanced topics"
