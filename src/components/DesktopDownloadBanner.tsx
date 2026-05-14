export const DesktopDownloadBanner = () => {
  // Don't show in Electron app
  if (typeof window !== 'undefined' && (window as any).electron?.isElectron) {
    return null;
  }

  return (
    <div className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-3">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 2a1 1 0 011 1v1.22l3.97 1.987a2 2 0 01.9 2.605L13.72 9.9a2.009 2.009 0 01.428.678h3.341a2 2 0 110 4h-.464a2 2 0 01-.268 3.519l1.43 4.605a2 2 0 01-1.903 2.668H5.75a2 2 0 01-1.903-2.668l1.43-4.605A2 2 0 013.544 14H3a2 2 0 110-4h3.341a2.009 2.009 0 01.428-.678l-1.147-1.481a2 2 0 01.9-2.605L9 4.22V3a1 1 0 011-1h0z" />
          </svg>
          <span className="font-medium">TheFilmLab Desktop App</span>
        </div>
        <p className="text-blue-100 text-sm flex-1">Faster performance and offline support with our native desktop application</p>
        <a
          href="https://github.com/yourusername/thefilmlab/releases"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-white text-blue-600 px-4 py-2 rounded-lg font-semibold whitespace-nowrap hover:bg-blue-50 transition-colors text-sm"
        >
          Download for Windows
        </a>
      </div>
    </div>
  );
};

export default DesktopDownloadBanner;
