"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";

export default function GalleryPage() {
  const { userId } = useAuth();
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    const fetchGallery = async () => {
      try {
        const res = await fetch(`http://localhost:3001/video/gallery/${userId}`);
        const data = await res.json();
        if (data.success) setVideos(data.data);
      } catch (error) {
        console.error("Failed to load gallery");
      } finally {
        setLoading(false);
      }
    };
    fetchGallery();
  }, [userId]);

  if (loading) return <div className="text-center text-white mt-20">Loading your masterpieces...</div>;

  return (
    <div className="space-y-8 animate-in fade-in">
      <div>
        <h1 className="text-3xl font-bold mb-2 text-white">My Gallery</h1>
        <p className="text-gray-400">All your generated AI videos are securely stored here.</p>
      </div>

      {videos.length === 0 ? (
        <div className="text-center p-20 border border-white/10 rounded-2xl bg-white/5 backdrop-blur-sm">
          <span className="text-6xl opacity-50 block mb-4">🎬</span>
          <h3 className="text-xl text-white font-semibold">No videos yet</h3>
          <p className="text-gray-400">Your generated videos will appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map((video) => (
            <div key={video.id} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden group">
              <video 
                src={video.videoUrl} 
                controls 
                className="w-full aspect-[9/16] object-cover bg-black"
              />
              <div className="p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className={`text-xs px-2 py-1 rounded font-bold ${video.style === 'UGC' ? 'bg-pink-500/20 text-pink-400' : 'bg-purple-500/20 text-purple-400'}`}>
                    {video.style}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(video.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-gray-300 line-clamp-2" title={video.prompt}>{video.prompt}</p>
                <a 
                  href={video.videoUrl} 
                  target="_blank"
                  className="mt-4 block text-center w-full bg-white/10 hover:bg-white/20 py-2 rounded-lg text-sm text-white transition"
                >
                  Download HD
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}