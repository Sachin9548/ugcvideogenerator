"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";

export default function DashboardPage() {
  const { userId } = useAuth();
  const [topic, setTopic] = useState("");
  const [mode, setMode] = useState("Cinematic");
  const [quality, setQuality] = useState("Studio-Cinematic-Pro");
  const [duration, setDuration] = useState("5");

  const [characterImage, setCharacterImage] = useState<File | null>(null);
  const [productImage, setProductImage] = useState<File | null>(null);

  const [isGenerating, setIsGenerating] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [generatedVideo, setGeneratedVideo] = useState<any>(null);

  const [engine, setEngine] = useState("omni");

  useEffect(() => {
    if (mode === "Cinematic") setQuality("Studio-Cinematic-Pro");
    else setQuality("Studio-UGC-Omni-Pro");
  }, [mode]);

  const handleGenerate = async () => {
    if (!topic) return alert("Please describe your video first! 🎬");
    if (mode === "UGC" && (!characterImage || !productImage)) {
      return alert(
        "Please upload both Character and Product images for UGC mode! 📸",
      );
    }
    if (!userId) return alert("Please login again!");

    setIsGenerating(true);
    setGeneratedVideo(null);
    setStatusMessage("Adding to Queue... ⏳");

    try {
      const formData = new FormData();
      formData.append("userId", userId);
      formData.append("topic", topic);
      formData.append("mode", mode);
      formData.append("quality", quality);
      formData.append("duration", duration);
      formData.append("engine", engine);

      if (mode === "UGC" && characterImage && productImage) {
        formData.append("characterImage", characterImage);
        formData.append("productImage", productImage);
      }

      console.log(`🚀 Sending ${mode} request to Backend...`);

      // 1. Backend ko request bhejna
      const response = await fetch("https://ugcvideogenerator.onrender.com/video/generate", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success && data.jobId) {
        console.log("✅ Job added to queue! Job ID:", data.jobId);
        setStatusMessage(
          "AI is working on it. This may take 3-5 minutes... 🎥",
        );

        // 2. POLLING START: Har 5 second mein check karo
        let isFinished = false;

        while (!isFinished) {
          // 5 second wait karo
          await new Promise((resolve) => setTimeout(resolve, 5000));

          // Status pucho
          const statusRes = await fetch(
            `https://ugcvideogenerator.onrender.com/video/status/${data.jobId}`,
          );
          const statusData = await statusRes.json();

          console.log("Current Job Status:", statusData.state);

          if (statusData.state === "completed") {
            isFinished = true;
            setGeneratedVideo(statusData.result); // Video mil gayi!
            setStatusMessage("");
            setIsGenerating(false);
          } else if (statusData.state === "failed") {
            isFinished = true;
            alert("Oops! Video generation failed: " + statusData.failedReason);
            setStatusMessage("");
            setIsGenerating(false);
          }
          // Agar 'active' ya 'waiting' hai, toh loop wapas chalega
        }
      } else {
        alert("Oops! Generation failed: " + data.message);
        setIsGenerating(false);
      }
    } catch (error) {
      console.error("❌ Error:", error);
      alert("Failed to connect to backend server.");
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold mb-2">Create New Video</h1>
        <p className="text-gray-400">
          Choose your style, provide assets, and let AI do the magic.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT COLUMN: Input Form */}
        <div className="lg:col-span-2 space-y-6 bg-white/5 border border-white/10 p-6 rounded-2xl backdrop-blur-sm">
          <div className="flex bg-black/50 p-1 rounded-xl border border-white/10">
            <button
              onClick={() => setMode("Cinematic")}
              className={`flex-1 py-3 rounded-lg font-semibold transition ${mode === "Cinematic" ? "bg-purple-600 text-white shadow-lg" : "text-gray-400 hover:text-white"}`}
            >
              🎬 Cinematic B-Roll
            </button>
            <button
              onClick={() => setMode("UGC")}
              className={`flex-1 py-3 rounded-lg font-semibold transition ${mode === "UGC" ? "bg-pink-600 text-white shadow-lg" : "text-gray-400 hover:text-white"}`}
            >
              📱 UGC Lip-Sync Ad
            </button>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">
              Video Prompt / Product Name
            </label>
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full h-24 bg-black/50 border border-white/10 rounded-xl p-4 text-white placeholder:text-gray-600 focus:border-purple-500 transition resize-none"
              placeholder={
                mode === "Cinematic"
                  ? "E.g., A cinematic drone shot of..."
                  : "E.g., Multivitamin Nourishing Facial Cleanser"
              }
            ></textarea>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">
                AI Engine
              </label>
              <select
                value={quality}
                onChange={(e) => setQuality(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-purple-500 transition outline-none"
              >
                {mode === "Cinematic" ? (
                  <>
                    <option value="Studio-Cinematic-Fast">
                      Cinematic Fast (720p)
                    </option>
                    <option value="Studio-Cinematic-Pro">
                      Cinematic Pro (1080p)
                    </option>
                    <option value="Studio-Cinematic-Ultra 4K">
                      Cinematic Ultra (4K)
                    </option>
                  </>
                ) : (
                  <>
                    <option value="Studio-UGC-Omni">
                      UGC Director (Standard)
                    </option>
                    <option value="Studio-UGC-Omni-Pro">
                      UGC Director Pro (1080p)
                    </option>
                  </>
                )}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">
                Duration
              </label>
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-purple-500 transition outline-none"
              >
                {[5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map((sec) => (
                  <option key={sec} value={sec}>
                    {sec} Seconds
                  </option>
                ))}
              </select>
            </div>
          </div>

          {mode === "UGC" && (
            <>
              <div className="space-y-2 animate-in slide-in-from-top-1">
                <label className="text-sm font-medium text-gray-300">
                  AI Model
                </label>
                <select
                  value={engine}
                  onChange={(e) => setEngine(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-pink-500 transition outline-none"
                >
                  <option value="omni">Kling Omni V3 (Multi-Shot)</option>
                  <option value="standard">Kling Standard V3 (Lip-Sync)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-2">
                <div className="border-2 border-dashed border-white/20 p-4 rounded-xl text-center bg-black/30 hover:border-pink-500 transition">
                  <p className="text-sm text-gray-400 mb-2">
                    👤 Upload Character
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      setCharacterImage(e.target.files?.[0] || null)
                    }
                    className="text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-pink-500/10 file:text-pink-400 hover:file:bg-pink-500/20"
                  />
                </div>
                <div className="border-2 border-dashed border-white/20 p-4 rounded-xl text-center bg-black/30 hover:border-pink-500 transition">
                  <p className="text-sm text-gray-400 mb-2">
                    📦 Upload Product
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      setProductImage(e.target.files?.[0] || null)
                    }
                    className="text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-pink-500/10 file:text-pink-400 hover:file:bg-pink-500/20"
                  />
                </div>
              </div>
            </>
          )}

          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className={`w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 shadow-lg 
              ${isGenerating ? "bg-gray-600 cursor-not-allowed" : mode === "Cinematic" ? "bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90" : "bg-gradient-to-r from-pink-600 to-orange-500 hover:opacity-90"}`}
          >
            {isGenerating ? "⏳ Processing..." : `✨ Generate ${mode} Video`}
          </button>
        </div>

        {/* RIGHT COLUMN: Output Area */}
        <div className="lg:col-span-1 bg-white/5 border border-white/10 p-6 rounded-2xl flex flex-col justify-center text-center">
          {generatedVideo ? (
            <video
              src={generatedVideo.videoUrl}
              controls
              autoPlay
              loop
              className="w-full h-auto rounded-lg shadow-lg"
            />
          ) : isGenerating ? (
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-purple-400 font-medium animate-pulse">
                {statusMessage}
              </p>
            </div>
          ) : (
            <p className="text-gray-500 text-sm">
              Your AI masterpiece will appear here.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
