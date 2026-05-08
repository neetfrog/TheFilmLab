import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { decodeImage } from './utils/imageDecoder';

interface NegativeConverterToolProps {
  isOpen: boolean;
  onClose: () => void;
  onFileSelected: (file: File, imageData: ImageData) => void;
}

export default function NegativeConverterTool({
  isOpen,
  onClose,
  onFileSelected,
}: NegativeConverterToolProps) {
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState('');
  const [error, setError] = useState<string | null>(null);

  const loadFile = useCallback(
    async (file: File) => {
      setLoading(true);
      setError(null);
      setLoadingStage('Loading image...');

      try {
        const imageData = await decodeImage(file, {
          maxDim: 3200,
          onProgress: setLoadingStage,
        });

        onFileSelected(file, imageData);
        onClose();
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to load image'
        );
        setLoading(false);
      }
    },
    [onFileSelected, onClose]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      if (acceptedFiles[0]) loadFile(acceptedFiles[0]);
    },
    accept: {
      'image/*': ['.jpg', '.jpeg', '.png', '.tif', '.tiff', '.bmp', '.webp'],
      'application/octet-stream': [
        '.raw', '.dng', '.nef', '.cr2', '.crw', '.arw', '.orf', '.raf',
        '.rw2', '.pef', '.srw', '.mrw', '.3fr', '.mef', '.mos',
      ],
    },
    multiple: false,
    disabled: loading,
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-zinc-900 rounded-lg w-full max-w-md border border-zinc-700 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <div>
            <h2 className="text-xl font-bold text-white">Load Negative</h2>
            <p className="text-xs text-zinc-500 mt-1">
              Import RAW or image file to edit in main app
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-zinc-400 hover:text-white text-2xl leading-none disabled:opacity-50"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-amber-400/30 border-t-amber-400 rounded-full animate-spin mx-auto mb-4" />
              <p className="text-amber-400 font-medium text-sm">{loadingStage}</p>
            </div>
          ) : (
            <>
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer ${
                  isDragActive
                    ? 'border-amber-400 bg-amber-400/10'
                    : 'border-zinc-600 hover:border-zinc-500'
                }`}
              >
                <input {...getInputProps()} />
                <div className="text-5xl mb-4">📸</div>
                <p className="text-white font-semibold mb-2">
                  Drop your negative here
                </p>
                <p className="text-xs text-zinc-400 mb-2">
                  or click to browse
                </p>
                <p className="text-xs text-zinc-500">
                  RAW (CR2, NEF, ARW, DNG) • JPEG • PNG • TIFF
                </p>
              </div>

              {error && (
                <div className="mt-4 p-3 rounded bg-red-500/20 border border-red-500/50 text-red-200 text-xs">
                  {error}
                </div>
              )}

              <p className="text-xs text-zinc-400 mt-4 text-center">
                Image will open in main app with the invert negative preset applied.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
