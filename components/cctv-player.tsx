"use client";

import { useState } from "react";
import { Maximize2, Camera, MapPin } from "lucide-react";

interface Camera {
  id: string;
  name: string;
  location: string;
  youtubeUrl: string;
}

export function CctvPlayer({ camera }: { camera: Camera }) {
  const [fullscreen, setFullscreen] = useState(false);

  return (
    <>
      <div className="surface overflow-hidden group hover-lift">
        {/* Camera Header */}
        <div className="flex items-center justify-between p-3 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-sm font-semibold text-foreground">{camera.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {camera.location}
            </span>
            <button
              onClick={() => setFullscreen(true)}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/10 transition-all"
              title="Fullscreen"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Video */}
        <div className="relative aspect-video bg-black">
          <iframe
            src={camera.youtubeUrl}
            title={camera.name}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 w-full h-full"
          />
          <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/70 px-2 py-1 rounded-full pointer-events-none">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-[10px] text-white font-medium">LIVE</span>
          </div>
        </div>
      </div>

      {/* Fullscreen Modal */}
      {fullscreen && (
        <div
          className="fixed inset-0 z-50 bg-black flex flex-col"
          onClick={() => setFullscreen(false)}
        >
          <div className="flex items-center justify-between p-4 bg-black/80">
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-primary" />
              <span className="text-white font-semibold">{camera.name}</span>
              <span className="text-muted-foreground text-sm">· {camera.location}</span>
            </div>
            <button
              onClick={() => setFullscreen(false)}
              className="text-white/60 hover:text-white text-sm px-3 py-1 border border-white/20 rounded-lg"
            >
              Tutup
            </button>
          </div>
          <div className="flex-1 relative" onClick={(e) => e.stopPropagation()}>
            <iframe
              src={camera.youtubeUrl}
              title={camera.name}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 w-full h-full"
            />
          </div>
        </div>
      )}
    </>
  );
}
