"use client";

import React, { useState } from "react";
import { useAuth } from "@clerk/nextjs";

export default function AdvancedStudioPage() {
  const { userId } = useAuth();
  const [prompt, setPrompt] = useState("");
  const [advancedMode, setAdvancedMode] = useState("DirectModel");
  
  // Settings
  const [selectedModel, setSelectedModel] = useState("cogvideox-5b");
  const [selectedWorkflow, setSelectedWorkflow] = useState("indian-lipsync-v1");
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  const handleGenerateAdvanced = async () => {
    if (!prompt) return alert("Please enter a prompt!");
    setIsGenerating(true);
    setStatusMessage("Initializing Advanced Engine... ⏳");

    // Yahan hum nayi API call karenge jo hum backend mein banayenge
    try {
      const formData = new FormData();
      formData.append("userId", userId || "");
      formData.append("prompt", prompt);
      formData.append("advancedMode", advancedMode);
      formData.append("engine", advancedMode === "DirectModel" ? selectedModel : selectedWorkflow);
      
      if (uploadedImage) formData.append("image", uploadedImage);

      console.log(`🚀 Sending ${advancedMode} request to MuAPI Backend...`);
      
      // *Hum is api endpoint ko next step me backend me banayenge*
      const response = await fetch("https://ugcvideogenerator.onrender.com/video/generate-advanced", {
        method: "POST",
        body: formData, 
      });

      const data = await response.json();
      
      if (data.success) {
        setStatusMessage("MuAPI is processing your custom job... 🎥");
        // Yahan par humari purani BullMQ Polling wali logic aayegi...
        setTimeout(() => {
           setStatusMessage("Coming soon: Real API connection with MuAPI!");
           setIsGenerating(false);
        }, 3000);
      } else {
        alert("Error: " + data.message);
        setIsGenerating(false);
      }
    } catch (error) {
      console.error(error);
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold mb-2 text-indigo-400">Advanced Studio (Pro)</h1>
        <p className="text-gray-400">Full control using Direct Open-Source Models & Custom ComfyUI Workflows via MuAPI.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN */}
        <div className="lg:col-span-2 space-y-6 bg-white/5 border border-indigo-500/30 p-6 rounded-2xl backdrop-blur-sm shadow-[0_0_15px_rgba(99,102,241,0.1)]">
          
          <div className="flex bg-black/50 p-1 rounded-xl border border-white/10">
            <button 
              onClick={() => setAdvancedMode("DirectModel")}
              className={`flex-1 py-3 rounded-lg font-semibold transition ${advancedMode === "DirectModel" ? "bg-indigo-600 text-white shadow-lg" : "text-gray-400 hover:text-white"}`}
            >
              🤖 Direct Open-Source Models
            </button>
            <button 
              onClick={() => setAdvancedMode("Workflow")}
              className={`flex-1 py-3 rounded-lg font-semibold transition ${advancedMode === "Workflow" ? "bg-teal-600 text-white shadow-lg" : "text-gray-400 hover:text-white"}`}
            >
              ⚙️ Custom Workflows
            </button>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Master Prompt</label>
            <textarea 
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full h-24 bg-black/50 border border-white/10 rounded-xl p-4 text-white placeholder:text-gray-600 focus:border-indigo-500 transition resize-none"
              placeholder="Describe your video in extreme detail..."
            ></textarea>
          </div>

          {/* DYNAMIC SETTINGS */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Select Engine</label>
              {advancedMode === "DirectModel" ? (
                <select value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white outline-none">
                  <option value="cogvideox-5b">CogVideoX 5B (Best Open-Source)</option>
                  <option value="hunyuan-video">HunyuanVideo (Tencent)</option>
                  <option value="stable-video-diffusion">Stable Video Diffusion</option>
                  <option value="hallo-lipsync">Hallo Lip-Sync Model</option>
                </select>
              ) : (
                <select value={selectedWorkflow} onChange={(e) => setSelectedWorkflow(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white outline-none">
                  <option value="indian-lipsync-v1">Custom Indian Lip-Sync (Workflow A)</option>
                  <option value="product-promo-v2">Cinematic Product Promo (Workflow B)</option>
                </select>
              )}
            </div>

            <div className="border-2 border-dashed border-white/20 p-2 rounded-xl text-center bg-black/30 hover:border-indigo-500 transition flex flex-col justify-center">
              <p className="text-xs text-gray-400 mb-1">Optional Reference Image</p>
              <input type="file" accept="image/*" onChange={(e) => setUploadedImage(e.target.files?.[0] || null)} className="text-[10px] text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded-full file:border-0 file:bg-indigo-500/10 file:text-indigo-400" />
            </div>
          </div>

          <button 
            onClick={handleGenerateAdvanced}
            disabled={isGenerating}
            className={`w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 shadow-lg 
              ${isGenerating ? 'bg-gray-600 cursor-not-allowed' : 'bg-gradient-to-r from-indigo-600 to-teal-500 hover:opacity-90'}`}
          >
            {isGenerating ? "⏳ Processing via MuAPI..." : `✨ Launch Advanced Engine`}
          </button>
        </div>

        {/* RIGHT COLUMN */}
        <div className="lg:col-span-1 bg-black/40 border border-indigo-500/20 p-6 rounded-2xl flex flex-col justify-center text-center">
          {isGenerating ? (
            <div className="flex flex-col items-center space-y-4">
              <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-indigo-400 font-medium animate-pulse">{statusMessage}</p>
            </div>
          ) : (
            <div>
              <span className="text-5xl opacity-50 block mb-2">🚀</span>
              <p className="text-gray-400 text-sm">Advanced open-source results will appear here.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}