"use client";

import { useEffect, useState } from "react";

type PreviewType = "image" | "pdf" | "audio" | "video" | null;

interface PreviewModalProps {
  url: string | null;
  filename: string;
  onClose: () => void;
  onDownload: () => void;
}

function getPreviewType(filename: string): PreviewType {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  
  if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) return "image";
  if (ext === "pdf") return "pdf";
  if (["mp3", "wav", "m4a", "aac", "ogg"].includes(ext)) return "audio";
  if (["mp4", "webm", "mov", "avi", "mkv"].includes(ext)) return "video";
  
  return null;
}

function getImageDimensions(url: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => resolve({ width: 800, height: 600 });
    img.src = url;
  });
}

function getVideoDimensions(url: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.onloadedmetadata = () => resolve({ width: video.videoWidth, height: video.videoHeight });
    video.onerror = () => resolve({ width: 1024, height: 576 });
    video.src = url;
  });
}

export function PreviewModal({ url, filename, onClose, onDownload }: PreviewModalProps) {
  const [previewType, setPreviewType] = useState<PreviewType>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  // Prevent default browser scroll when modal is open
  useEffect(() => {
    if (url) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "auto";
      };
    }
  }, [url]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!url) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [url, onClose]);

  useEffect(() => {
    if (!url) return;

    const type = getPreviewType(filename);
    setPreviewType(type);

    if (type === "image") {
      getImageDimensions(url).then((dims) => {
        // Constrain to viewport
        const maxWidth = window.innerWidth - 120;
        const maxHeight = window.innerHeight - 240;
        const ratio = dims.width / dims.height;
        
        let width = Math.min(dims.width, maxWidth);
        let height = width / ratio;
        
        if (height > maxHeight) {
          height = maxHeight;
          width = height * ratio;
        }
        
        setDimensions({ width, height });
      });
    } else if (type === "video") {
      getVideoDimensions(url).then((dims) => {
        const maxWidth = window.innerWidth - 120;
        const maxHeight = window.innerHeight - 240;
        const ratio = dims.width / dims.height;
        
        let width = Math.min(Math.max(dims.width, 800), maxWidth);
        let height = width / ratio;
        
        if (height > maxHeight) {
          height = maxHeight;
          width = height * ratio;
        }
        
        setDimensions({ width, height });
      });
    }
  }, [url, filename]);

  if (!url || !previewType) return null;

  const baseClasses = "fixed inset-0 z-50 flex items-center justify-center bg-black/50";
  const containerClasses = "relative bg-white rounded-2xl shadow-2xl overflow-hidden";
  const headerClasses = "sticky top-0 flex items-center justify-between bg-stone-50 border-b border-stone-200 px-6 py-4";
  const closeButtonClasses =
    "relative flex h-8 w-8 items-center justify-center rounded-lg hover:bg-stone-200 transition text-stone-600 hover:text-stone-900 font-bold text-xl leading-none";
  const downloadButtonClasses =
    "flex items-center gap-2 rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-800 transition";

  return (
    <div className={baseClasses} onClick={onClose}>
      <div
        className={containerClasses}
        style={{
          width: Math.min(dimensions.width + 32, window.innerWidth - 60),
          maxHeight: window.innerHeight - 120,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={headerClasses}>
          <div className="flex-1 truncate">
            <p className="font-medium text-stone-900 truncate">{filename}</p>
          </div>
          <div className="flex items-center gap-2">
            <button className={downloadButtonClasses} onClick={onDownload} title="Download file">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              <span>Download</span>
            </button>
            <button className={closeButtonClasses} onClick={onClose} title="Close preview">
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-auto" style={{ maxHeight: window.innerHeight - 200 }}>
          {previewType === "image" && (
            <img src={url} alt={filename} className="w-full h-auto display-block" />
          )}

          {previewType === "pdf" && (
            <iframe
              src={url}
              className="w-full bg-stone-200"
              style={{ height: "600px", border: "none" }}
              title={filename}
            />
          )}

          {previewType === "audio" && (
            <div className="flex flex-col items-center justify-center gap-6 bg-gradient-to-br from-stone-50 to-stone-100 p-12" style={{ height: "300px" }}>
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-stone-200">
                <svg className="h-10 w-10 text-stone-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 3v9.28c-.47-.46-1.12-.75-1.84-.75-1.66 0-3 1.34-3 3s1.34 3 3 3c1.66 0 3-1.34 3-3V7h4V3h-4z" />
                </svg>
              </div>
              <audio controls className="w-full max-w-sm">
                <source src={url} />
                Your browser does not support the audio element.
              </audio>
              <p className="text-sm text-stone-600">{filename}</p>
            </div>
          )}

          {previewType === "video" && (
            <div className="flex items-center justify-center bg-black">
              <video
                controls
                autoPlay
                className="w-full h-auto"
                style={{
                  maxWidth: `${dimensions.width}px`,
                  maxHeight: `${dimensions.height}px`,
                }}
              >
                <source src={url} />
                Your browser does not support the video element.
              </video>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
