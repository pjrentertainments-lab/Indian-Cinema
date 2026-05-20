'use client';

import React, { useState, useEffect } from 'react';
import { Home, BookOpen, Film, Layers, Eye, Key, X, AlertTriangle, Lightbulb, Clapperboard, Video, Palette, Loader2, Sparkles, Copy, Check } from 'lucide-react';
import { generateContent } from '@/app/actions';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';

type Tab = 'home' | 'story' | 'scene' | 'shot' | 'visual';
type Language = 'TELUGU' | 'TE-ENGLISH' | 'ENGLISH';

export default function FilmmakerApp() {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [userApiKey, setUserApiKey] = useState('');
  const [pendingTargetTab, setPendingTargetTab] = useState<Tab | null>(null);
  
  // Modals
  const [isApiModalOpen, setIsApiModalOpen] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'error' | 'notice' } | null>(null);
  const [tempKeyInput, setTempKeyInput] = useState('');

  // States
  const [storyState, setStoryState] = useState({ inputIdea: '', targetLanguage: 'TELUGU' as Language, isGenerating: false, generatedStory: null as any, error: null as string | null });
  const [sceneState, setSceneState] = useState({ inputStory: '', targetLanguage: 'TELUGU' as Language, isGenerating: false, generatedScenes: null as any, error: null as string | null });
  const [shotState, setShotState] = useState({ inputScene: '', targetLanguage: 'TELUGU' as Language, isGenerating: false, generatedDivision: null as any, error: null as string | null });
  const [visualState, setVisualState] = useState({ inputDivision: '', targetLanguage: 'TELUGU' as Language, isGenerating: false, visualizationPlan: null as any, error: null as string | null });

  useEffect(() => {
    const savedKey = localStorage.getItem('filmmaker_gemini_api_key');
    if (savedKey) {
      setUserApiKey(savedKey);
    }
  }, []);

  const verifyKeyAndSwitch = (tabId: Tab) => {
    if (tabId === 'home') {
      setActiveTab(tabId);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (!userApiKey) {
      setPendingTargetTab(tabId);
      setTempKeyInput(userApiKey);
      setIsApiModalOpen(true);
      return;
    }

    setActiveTab(tabId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const saveUserApiKey = () => {
    const keyVal = tempKeyInput.trim();
    if (!keyVal) {
      setNotification({ message: 'Please enter a valid API Key!', type: 'error' });
      return;
    }
    setUserApiKey(keyVal);
    localStorage.setItem('filmmaker_gemini_api_key', keyVal);
    setIsApiModalOpen(false);

    if (pendingTargetTab) {
      setActiveTab(pendingTargetTab);
      setPendingTargetTab(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  // Generation Handlers
  const handleGenerateStory = async () => {
    if (!storyState.inputIdea.trim()) {
      setStoryState(prev => ({ ...prev, error: 'Please enter a concept first.' }));
      return;
    }
    setStoryState(prev => ({ ...prev, isGenerating: true, error: null }));
    try {
      const result = await generateContent('story', storyState.inputIdea, storyState.targetLanguage, userApiKey);
      setStoryState(prev => ({ ...prev, generatedStory: result, isGenerating: false }));
      setSceneState(prev => ({ ...prev, inputStory: result.story })); // Transfer to next step
    } catch (err: any) {
      setStoryState(prev => ({ ...prev, error: err.message || 'Error generating story', isGenerating: false }));
    }
  };

  const handleGenerateScenes = async () => {
    if (!sceneState.inputStory.trim()) {
      setSceneState(prev => ({ ...prev, error: 'Please enter a story first.' }));
      return;
    }
    setSceneState(prev => ({ ...prev, isGenerating: true, error: null }));
    try {
      const result = await generateContent('scene', sceneState.inputStory, sceneState.targetLanguage, userApiKey);
      setSceneState(prev => ({ ...prev, generatedScenes: result, isGenerating: false }));
      // Generate text to pass to next step
      const sceneText = result.scenes.map((s: any) => `SCENE ${s.sceneNo}\nINT/EXT: ${s.intExt} - ${s.dayNight}\nLOCATION: ${s.location}\n\n${s.sceneDescription}`).join('\n\n---\n\n');
      setShotState(prev => ({ ...prev, inputScene: sceneText }));
    } catch (err: any) {
      setSceneState(prev => ({ ...prev, error: err.message || 'Error generating scenes', isGenerating: false }));
    }
  };

  const handleGenerateShots = async () => {
    if (!shotState.inputScene.trim()) {
      setShotState(prev => ({ ...prev, error: 'Please enter scenes first.' }));
      return;
    }
    setShotState(prev => ({ ...prev, isGenerating: true, error: null }));
    try {
      const result = await generateContent('shot', shotState.inputScene, shotState.targetLanguage, userApiKey);
      setShotState(prev => ({ ...prev, generatedDivision: result, isGenerating: false }));
      
      const shotText = result.scenes.map((sc: any) => {
        let txt = `SCENE ${sc.sceneNo}\nINT/EXT: ${sc.intExt}\nDAY/NIGHT: ${sc.dayNight}\nLOCATION: ${sc.location}\n\n${sc.sceneDescription}\n\n`;
        txt += sc.shots.map((sh: any) => `SHOT ${sh.shotNo}\nTYPE: ${sh.shotType}\nCAMERA: ${sh.camera}\nVISUAL: ${sh.visual}`).join('\n\n');
        return txt;
      }).join('\n\n======================\n\n');
      setVisualState(prev => ({ ...prev, inputDivision: shotText }));
    } catch (err: any) {
      setShotState(prev => ({ ...prev, error: err.message || 'Error generating shots', isGenerating: false }));
    }
  };

  const handleGenerateVisuals = async () => {
    if (!visualState.inputDivision.trim()) {
      setVisualState(prev => ({ ...prev, error: 'Please enter shot divisions first.' }));
      return;
    }
    setVisualState(prev => ({ ...prev, isGenerating: true, error: null }));
    try {
      const result = await generateContent('visual', visualState.inputDivision, visualState.targetLanguage, userApiKey);
      setVisualState(prev => ({ ...prev, visualizationPlan: result, isGenerating: false }));
    } catch (err: any) {
      setVisualState(prev => ({ ...prev, error: err.message || 'Error generating visuals', isGenerating: false }));
    }
  };

  return (
    <div className="bg-black text-white font-sans min-h-screen relative selection:bg-yellow-500/30">
      {/* Background Glows */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-900/10 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-900/10 blur-[120px] rounded-full"></div>
      </div>

      {/* Header Status */}
      <div className="absolute top-6 right-6 z-40 flex items-center gap-3">
        <button 
          onClick={() => { setTempKeyInput(userApiKey); setIsApiModalOpen(true); }}
          className={cn(
            "px-5 py-2.5 bg-white text-black text-[10px] font-black tracking-widest rounded-xl uppercase shadow-lg hover:bg-gray-200 transition-all duration-300 transform hover:scale-105 flex items-center gap-1.5 border border-white/20",
            !userApiKey && "animate-pulse"
          )}
        >
          <Key className="w-3.5 h-3.5" />
          {userApiKey ? 'CHANGE API KEY' : 'ADD API KEY'}
        </button>
      </div>

      {/* Main Content Area */}
      <div className="pb-32 min-h-screen">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3 }}
            className="w-full"
          >
            {activeTab === 'home' && <HomeView onSwitch={verifyKeyAndSwitch} />}
            {activeTab === 'story' && <StoryView state={storyState} setState={setStoryState} onGenerate={handleGenerateStory} copyToClipboard={copyToClipboard} />}
            {activeTab === 'scene' && <SceneView state={sceneState} setState={setSceneState} onGenerate={handleGenerateScenes} copyToClipboard={copyToClipboard} />}
            {activeTab === 'shot' && <ShotView state={shotState} setState={setShotState} onGenerate={handleGenerateShots} copyToClipboard={copyToClipboard} />}
            {activeTab === 'visual' && <VisualView state={visualState} setState={setVisualState} onGenerate={handleGenerateVisuals} copyToClipboard={copyToClipboard} />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom Nav */}
      <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 w-[95%] max-w-4xl mx-auto">
        <div className="bg-[#1a1a1a]/90 backdrop-blur-xl border border-white/10 rounded-[35px] px-6 md:px-10 py-5 shadow-2xl flex items-center justify-between gap-2 md:gap-16 overflow-x-auto no-scrollbar">
          {(['home', 'story', 'scene', 'shot', 'visual'] as Tab[]).map((tab) => {
            const isActive = activeTab === tab;
            const icons = {
              home: <Home className="w-6 h-6 md:w-8 md:h-8" />,
              story: <BookOpen className="w-6 h-6 md:w-8 md:h-8" />,
              scene: <Film className="w-6 h-6 md:w-8 md:h-8" />,
              shot: <Layers className="w-6 h-6 md:w-8 md:h-8" />,
              visual: <Eye className="w-6 h-6 md:w-8 md:h-8" />
            };
            return (
              <button
                key={tab}
                onClick={() => verifyKeyAndSwitch(tab)}
                className={cn(
                  "flex flex-col items-center gap-2 transition-all duration-300 relative min-w-[60px]",
                  isActive ? "text-white scale-110" : "text-gray-500 hover:text-gray-300"
                )}
              >
                {icons[tab]}
                <span className="text-[9px] md:text-[10px] font-bold tracking-widest uppercase">{tab}</span>
                {isActive && <div className="absolute -bottom-2 w-1 h-1 bg-yellow-400 rounded-full" />}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Modals */}
      <AnimatePresence>
        {isApiModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
          >
            <motion.div 
               initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="w-full max-w-md bg-[#0f111a] border-2 border-yellow-500 rounded-3xl p-8 text-center space-y-5 shadow-2xl relative"
            >
              <button onClick={() => { setIsApiModalOpen(false); setPendingTargetTab(null); }} className="absolute top-4 right-4 text-gray-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
              <div className="w-14 h-14 bg-yellow-500/10 border border-yellow-500/40 rounded-full flex items-center justify-center mx-auto text-yellow-400">
                <Key className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black tracking-widest text-white uppercase">ENTER YOUR API KEY</h3>
              <p className="text-gray-400 text-xs leading-relaxed text-justify">
                This application utilizes your own Google Gemini API key to operate for free. Your API key remains saved locally inside your browser and never leaves your machine. Alternatively, the app will use the server environment API key if provided.
              </p>
              <div className="space-y-3 pt-2">
                <input 
                  type="password" 
                  value={tempKeyInput}
                  onChange={(e) => setTempKeyInput(e.target.value)}
                  placeholder="Paste your Gemini AI API Key here..." 
                  className="w-full bg-black border border-white/20 rounded-xl px-4 py-3.5 text-center text-white text-sm focus:outline-none focus:border-yellow-500 placeholder:text-gray-600 font-mono" 
                />
                <button onClick={saveUserApiKey} className="w-full py-4 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-black font-black uppercase tracking-widest text-xs transition-colors shadow-md">
                  SAVE KEY & ACTIVATE
                </button>
              </div>
              <a href="https://aistudio.google.com/" target="_blank" rel="noreferrer" className="text-[10px] text-gray-500 hover:text-yellow-400 transition-colors block uppercase font-bold tracking-wider">
                Don't have a Key? Get Free API Key Here →
              </a>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {notification && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[60] flex items-center justify-center p-4"
          >
            <motion.div 
               initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className={cn(
                "w-full max-w-md bg-[#0f111a] border-2 rounded-3xl p-8 text-center space-y-5 shadow-2xl relative",
                notification.type === 'error' ? 'border-red-500' : 'border-yellow-500'
              )}
            >
              <div className={cn(
                "w-14 h-14 border rounded-full flex items-center justify-center mx-auto",
                notification.type === 'error' ? 'bg-red-500/10 text-red-500 border-red-500/30' : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30'
              )}>
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black tracking-widest text-white uppercase">{notification.type === 'error' ? 'ALERT' : 'NOTICE'}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{notification.message}</p>
              <button onClick={() => setNotification(null)} className="w-full py-3.5 rounded-xl bg-white text-black font-black uppercase tracking-widest text-xs transition-colors hover:bg-gray-200">
                OK
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- Home View ---
function HomeView({ onSwitch }: { onSwitch: (tab: Tab) => void }) {
  return (
    <>
      <header className="pt-24 pb-8 px-4 text-center">
        <h1 className="text-4xl md:text-6xl font-black italic tracking-tighter mb-2">
          INDIAN CINEMA <span className="text-yellow-400 not-italic">WITH AI</span>
        </h1>
        <div className="inline-block mt-1">
          <p className="text-sm md:text-lg tracking-widest font-semibold text-yellow-400 uppercase pb-2 border-b-2 border-yellow-400">
            BUILD YOUR IMAGINATION WITH AI
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 pb-32">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
          
          <div onClick={() => onSwitch('story')} className="group relative bg-[#0a0a0a] border border-[#facc15]/40 rounded-2xl p-8 flex flex-col items-center text-center transition-all duration-300 hover:border-[#facc15] hover:bg-[#121212] cursor-pointer shadow-[0_4px_30px_rgba(250,204,21,0.05)] hover:shadow-[0_4px_40px_rgba(250,204,21,0.2)] hover:scale-[1.02]">
            <div className="relative mb-8 p-5 rounded-2xl bg-blue-900/30 border border-blue-500/50 transition-transform duration-300 group-hover:scale-110">
              <div className="absolute inset-0 blur-xl opacity-50 bg-blue-500/20"></div>
              <Lightbulb className="w-8 h-8 text-blue-400" />
            </div>
            <h3 className="text-xl font-bold mb-4 tracking-tight leading-tight px-4 text-white">IDEA TO STORY BUILDER</h3>
            <p className="text-gray-400 text-sm leading-relaxed mb-8 h-16 line-clamp-3">Transform Your Raw Concepts Into Structured Narrative Arcs Using Cinematic Intelligence.</p>
            <button className="mt-auto text-[#facc15] text-xs font-bold tracking-widest uppercase hover:text-yellow-400 transition-colors">EXPLORE WORKFLOW →</button>
          </div>

          <div onClick={() => onSwitch('scene')} className="group relative bg-[#0a0a0a] border border-[#facc15]/40 rounded-2xl p-8 flex flex-col items-center text-center transition-all duration-300 hover:border-[#facc15] hover:bg-[#121212] cursor-pointer shadow-[0_4px_30px_rgba(250,204,21,0.05)] hover:shadow-[0_4px_40px_rgba(250,204,21,0.2)] hover:scale-[1.02]">
            <div className="relative mb-8 p-5 rounded-2xl bg-purple-900/30 border border-purple-500/50 transition-transform duration-300 group-hover:scale-110">
              <div className="absolute inset-0 blur-xl opacity-50 bg-purple-500/20"></div>
              <Clapperboard className="w-8 h-8 text-purple-400" />
            </div>
            <h3 className="text-xl font-bold mb-4 tracking-tight leading-tight px-4 text-white">STORY TO SCENE BUILDER</h3>
            <p className="text-gray-400 text-sm leading-relaxed mb-8 h-16 line-clamp-3">Break Down Your Story Into Dramatic Sequences And Intense Cinematic Scenes.</p>
            <button className="mt-auto text-[#facc15] text-xs font-bold tracking-widest uppercase hover:text-yellow-400 transition-colors">EXPLORE WORKFLOW →</button>
          </div>

          <div onClick={() => onSwitch('shot')} className="group relative bg-[#0a0a0a] border border-[#facc15]/40 rounded-2xl p-8 flex flex-col items-center text-center transition-all duration-300 hover:border-[#facc15] hover:bg-[#121212] cursor-pointer shadow-[0_4px_30px_rgba(250,204,21,0.05)] hover:shadow-[0_4px_40px_rgba(250,204,21,0.2)] hover:scale-[1.02]">
            <div className="relative mb-8 p-5 rounded-2xl bg-emerald-900/30 border border-emerald-500/50 transition-transform duration-300 group-hover:scale-110">
              <div className="absolute inset-0 blur-xl opacity-50 bg-emerald-500/20"></div>
              <Video className="w-8 h-8 text-emerald-400" />
            </div>
            <h3 className="text-xl font-bold mb-4 tracking-tight leading-tight px-4 text-white">SCENE TO SHOT DIVISION</h3>
            <p className="text-gray-400 text-sm leading-relaxed mb-8 h-16 line-clamp-3">Technical Shot Breakdown Including Camera Angles, Movement, And Framing.</p>
            <button className="mt-auto text-[#facc15] text-xs font-bold tracking-widest uppercase hover:text-yellow-400 transition-colors">EXPLORE WORKFLOW →</button>
          </div>

          <div onClick={() => onSwitch('visual')} className="group relative bg-[#0a0a0a] border border-[#facc15]/40 rounded-2xl p-8 flex flex-col items-center text-center transition-all duration-300 hover:border-[#facc15] hover:bg-[#121212] cursor-pointer shadow-[0_4px_30px_rgba(250,204,21,0.05)] hover:shadow-[0_4px_40px_rgba(250,204,21,0.2)] hover:scale-[1.02]">
            <div className="relative mb-8 p-5 rounded-2xl bg-yellow-900/30 border border-yellow-500/50 transition-transform duration-300 group-hover:scale-110">
              <div className="absolute inset-0 blur-xl opacity-50 bg-yellow-500/20"></div>
              <Palette className="w-8 h-8 text-yellow-400" />
            </div>
            <h3 className="text-xl font-bold mb-4 tracking-tight leading-tight px-4 text-white">SHOT TO VISUALIZATION</h3>
            <p className="text-gray-400 text-sm leading-relaxed mb-8 h-16 line-clamp-3">Generate Stunning AI Pre-Visualizations And Storyboards For Your Vision.</p>
            <button className="mt-auto text-[#facc15] text-xs font-bold tracking-widest uppercase hover:text-yellow-400 transition-colors">EXPLORE WORKFLOW →</button>
          </div>

        </div>
      </main>
    </>
  );
}

// --- Specific Views ---
const LangSelector = ({ 
  current, 
  onChange, 
  colorClass 
}: { 
  current: Language, 
  onChange: (l: Language) => void, 
  colorClass: string 
}) => {
  return (
    <div className="flex bg-black/40 border border-white/10 p-1 rounded-lg">
      {(['TELUGU', 'TE-ENGLISH', 'ENGLISH'] as Language[]).map(l => (
        <button 
          key={l}
          onClick={() => onChange(l)} 
          className={cn(
            "px-2 md:px-4 py-1.5 text-[9px] font-black rounded-md transition-colors", 
            current === l ? `${colorClass} text-white` : 'text-gray-500 hover:text-gray-300'
          )}
        >
          {l}
        </button>
      ))}
    </div>
  );
};

function StoryView({ state, setState, onGenerate, copyToClipboard }: any) {
  const { inputIdea, targetLanguage, isGenerating, generatedStory, error } = state;
  return (
    <div className="max-w-5xl mx-auto px-4 pt-20 pb-40">
      <div className="text-center mb-16">
        <h2 className="text-4xl md:text-6xl font-black italic tracking-tighter mb-4">
          <span className="text-blue-500">IDEA</span> <span className="text-white uppercase">TO STORY BUILDER</span>
        </h2>
        <div className="inline-block border-b-2 border-yellow-500/80 pb-2.5 px-4 mb-2">
          <p className="text-yellow-400 text-[10px] md:text-xs tracking-[0.4em] font-black uppercase opacity-95">
            TRANSFORMING IDEAS INTO POWERFUL STORIES
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex justify-between items-center px-2">
          <label className="text-yellow-500 text-[10px] font-black tracking-[0.2em] uppercase">INPUT YOUR MASTERPIECE CONCEPT</label>
          <LangSelector current={targetLanguage} onChange={(l: Language) => setState({ ...state, targetLanguage: l })} colorClass="bg-blue-600" />
        </div>
        <textarea 
          value={inputIdea} 
          onChange={(e) => setState({...state, inputIdea: e.target.value})}
          className="w-full h-64 bg-[#0a0a0a] border border-white/10 rounded-xl p-8 text-white focus:outline-none focus:border-blue-500/50 shadow-2xl" 
          placeholder="Type your idea... e.g. A sci-fi epic where humanity discovers a lost ancient civilization on Mars..." 
        />
        <button 
          onClick={onGenerate} 
          disabled={isGenerating} 
          className="w-full py-5 rounded-xl bg-blue-600 text-white font-black uppercase tracking-[0.3em] shadow-2xl hover:bg-blue-500 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGenerating ? <><Loader2 className="animate-spin w-5 h-5" /> GENERATING...</> : <><Sparkles className="w-5 h-5" /> GENERATE FILM STORY</>}
        </button>
      </div>

      <div id="story-results">
        {error && <div className="mt-8 p-6 bg-red-950/20 border border-red-500/30 rounded-xl text-red-400 text-center text-xs font-black uppercase tracking-widest">{error}</div>}
        {generatedStory && (
          <div className="mt-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 border-b border-white/5 pb-6">
              <div className="flex items-center gap-4">
                <span className="text-yellow-500 text-[10px] font-black uppercase block">TITLE:</span>
                <h3 className="text-xl md:text-3xl font-bold text-white uppercase">{generatedStory.title}</h3>
              </div>
              <button onClick={() => copyToClipboard(`TITLE: ${generatedStory.title}\n\n${generatedStory.story}`)} className="flex items-center gap-2 bg-[#111] border border-white/10 px-6 py-2 rounded-lg text-[9px] font-black uppercase hover:bg-white hover:text-black transition-colors self-end md:self-auto">
                <Copy className="w-4 h-4" /> COPY TOTAL STORY
              </button>
            </div>
            <div className="bg-[#030303] border border-white/5 rounded-2xl p-6 md:p-20 relative">
              <div className="absolute top-0 left-0 w-[4px] h-full bg-yellow-500"></div>
              <div className="mb-12 flex items-center gap-4">
                <div className="w-2 h-6 bg-yellow-500"></div>
                <span className="text-white text-xs font-black uppercase">CINEMATIC STORY</span>
              </div>
              <div className="space-y-8 text-gray-300 text-base md:text-2xl leading-[1.8] text-justify whitespace-pre-wrap">
                {generatedStory.story}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SceneView({ state, setState, onGenerate, copyToClipboard }: any) {
  const { inputStory, targetLanguage, isGenerating, generatedScenes, error } = state;
  return (
    <div className="max-w-5xl mx-auto px-4 pt-20 pb-40">
      <div className="text-center mb-16">
        <h2 className="text-4xl md:text-6xl font-black italic tracking-tighter mb-4">
          <span className="text-white">STORY TO</span> <span className="text-blue-500 uppercase">SCENE BUILDER</span>
        </h2>
        <div className="bg-black/50 py-2 inline-block px-10 border-b border-blue-500/30">
          <p className="text-yellow-400 text-[10px] md:text-sm tracking-[0.2em] font-bold uppercase">BUILD YOUR FILM SCENE BY SCENE</p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex justify-between items-center px-2">
          <label className="text-yellow-500 text-[10px] font-black tracking-[0.2em] uppercase">INPUT YOUR MASTER STORY</label>
          <LangSelector current={targetLanguage} onChange={(l: Language) => setState({ ...state, targetLanguage: l })} colorClass="bg-blue-600" />
        </div>
        <textarea 
          value={inputStory} 
          onChange={(e) => setState({...state, inputStory: e.target.value})}
          className="w-full h-64 bg-[#0a0a0a] border border-white/10 rounded-xl p-8 text-white focus:outline-none focus:border-blue-500/50 shadow-2xl" 
          placeholder="Paste your story here..." 
        />
        <button 
          onClick={onGenerate} 
          disabled={isGenerating} 
          className="w-full py-5 rounded-xl bg-blue-600 text-white font-black uppercase tracking-[0.2em] hover:bg-blue-500 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGenerating ? <><Loader2 className="animate-spin w-5 h-5" /> GENERATING...</> : 'GENERATE FILM SCENES'}
        </button>
      </div>

      <div id="scene-results">
        {error && <div className="mt-8 p-6 bg-red-950/20 border border-red-500/30 rounded-xl text-red-400 text-center text-xs font-black uppercase tracking-widest">{error}</div>}
        {generatedScenes && (
          <div className="mt-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 border-b border-white/5 pb-6">
              <h3 className="text-xl md:text-3xl font-bold text-white uppercase break-all">{generatedScenes.movieTitle}</h3>
              <button 
                onClick={() => {
                  const text = generatedScenes.scenes.map((s:any) => `Scene ${s.sceneNo}\nINT/EXT: ${s.intExt} - ${s.dayNight}\nLOCATION: ${s.location}\n\n${s.sceneDescription}`).join('\n\n-------\n\n');
                  copyToClipboard(`TITLE: ${generatedScenes.movieTitle}\n\n${text}`);
                }} 
                className="flex items-center gap-2 bg-[#111] border border-white/10 px-6 py-2 rounded-lg text-[9px] font-black uppercase hover:bg-white hover:text-black transition-colors self-end md:self-auto"
              >
                <Copy className="w-4 h-4" /> COPY ALL SCENES
              </button>
            </div>
            <div className="bg-[#030303] border border-white/5 rounded-2xl p-6 md:p-16 relative space-y-12">
              {generatedScenes.scenes.map((scene: any, idx: number) => (
                <div key={idx} className="border-b border-white/5 pb-8 last:border-0 last:pb-0">
                  <h4 className="text-white font-black text-xl mb-4 uppercase">Scene {scene.sceneNo}</h4>
                  <div className="text-gray-400 space-y-2 text-sm md:text-lg">
                    <p><span className="text-blue-400 font-bold uppercase">INT/EXT:</span> {scene.intExt} - {scene.dayNight}</p>
                    <p><span className="text-blue-400 font-bold uppercase">LOCATION:</span> {scene.location}</p>
                    <p className="mt-4 leading-relaxed text-gray-200 whitespace-pre-wrap">{scene.sceneDescription}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ShotView({ state, setState, onGenerate, copyToClipboard }: any) {
  const { inputScene, targetLanguage, isGenerating, generatedDivision, error } = state;
  return (
    <div className="max-w-5xl mx-auto px-4 pt-20 pb-40">
      <div className="text-center mb-16">
        <h2 className="text-4xl md:text-6xl font-black italic tracking-tighter mb-4">
          <span className="text-white">SCENE TO</span> <span className="text-emerald-500 uppercase">SHOT DIVISION</span>
        </h2>
        <div className="bg-black/50 py-2 inline-block px-10 border-b border-emerald-500/30">
          <p className="text-yellow-400 text-[10px] md:text-sm tracking-[0.2em] font-bold uppercase">
            TECHNICAL BREAKDOWN FOR CINEMATIC EXCELLENCE
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex justify-between items-center px-2">
          <label className="text-yellow-500 text-[10px] font-black tracking-[0.2em] uppercase">INPUT YOUR SCENE DETAILS</label>
          <LangSelector current={targetLanguage} onChange={(l: Language) => setState({ ...state, targetLanguage: l })} colorClass="bg-emerald-600" />
        </div>
        <textarea 
          value={inputScene} 
          onChange={(e) => setState({...state, inputScene: e.target.value})}
          className="w-full h-64 bg-[#0a0a0a]/80 backdrop-blur-sm border border-white/10 rounded-xl p-8 text-white focus:outline-none focus:border-emerald-500/50 shadow-2xl placeholder:text-gray-700 text-base" 
          placeholder="SCENE 1..." 
        />
        <button 
          onClick={onGenerate} 
          disabled={isGenerating} 
          className="w-full py-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGenerating ? <><Loader2 className="animate-spin w-5 h-5" /> GENERATING DIVISION...</> : 'GENERATE TECHNICAL SHOT DIVISION'}
        </button>
      </div>

      <div id="shot-results">
        {error && <div className="mt-8 p-6 bg-red-950/20 border border-red-500/30 rounded-xl text-red-400 text-center text-xs font-black uppercase tracking-widest">{error}</div>}
        {generatedDivision && (
          <div className="mt-16">
            <div className="border-2 border-yellow-500 rounded-[30px] p-6 md:p-14 bg-black relative shadow-[0_0_50px_rgba(234,179,8,0.15)]">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10 border-b border-white/10 pb-6">
                <span className="text-yellow-500 font-bold text-xl md:text-2xl tracking-wider uppercase">SCENE TO SHOT DIVISION</span>
                <button 
                  onClick={() => {
                    const text = generatedDivision.scenes.map((sc: any) => {
                      let txt = `SCENE ${sc.sceneNo}\nINT/EXT: ${sc.intExt}\nDAY/NIGHT: ${sc.dayNight}\nLOCATION: ${sc.location}\n\n${sc.sceneDescription}\n\n`;
                      txt += sc.shots.map((sh: any) => `SHOT ${sh.shotNo}\nTYPE: ${sh.shotType}\nCAMERA: ${sh.camera}\nVISUAL: ${sh.visual}`).join('\n\n');
                      return txt;
                    }).join('\n\n======================\n\n');
                    copyToClipboard(text);
                  }} 
                  className="flex items-center gap-2 bg-[#141414] border border-white/10 px-6 py-2.5 rounded-lg text-[9px] font-black uppercase tracking-widest text-white hover:bg-yellow-500 hover:text-black transition-colors"
                >
                  <Copy className="w-4 h-4" /> COPY ALL SHOT DIVISION
                </button>
              </div>
              <div className="space-y-16">
                {generatedDivision.scenes.map((scene: any, scIdx: number) => (
                  <div key={scIdx} className={scIdx > 0 ? "border-t border-white/10 pt-12" : ""}>
                    <h3 className="text-white font-black text-2xl md:text-3xl uppercase tracking-wider mb-6">SCENE {scene.sceneNo}</h3>
                    <div className="space-y-6">
                      <div>
                        <ul className="space-y-2 text-white text-base md:text-lg pl-2">
                          <li><strong className="text-gray-400 uppercase">INT/EXT:</strong> {scene.intExt}</li>
                          <li><strong className="text-gray-400 uppercase">DAY/NIGHT:</strong> {scene.dayNight}</li>
                          <li><strong className="text-gray-400 uppercase">LOCATION:</strong> {scene.location}</li>
                        </ul>
                      </div>
                      <div className="pt-4">
                        <p className="text-white text-base md:text-lg leading-relaxed whitespace-pre-wrap">{scene.sceneDescription}</p>
                      </div>
                    </div>
                    <div className="border-t border-white/5 my-8"></div>
                    <div className="space-y-10 pl-2">
                      {scene.shots.map((shot: any, idx: number) => (
                        <div key={idx} className="space-y-3">
                          <h4 className="text-white font-black text-md uppercase tracking-widest">SHOT {shot.shotNo || idx + 1}</h4>
                          <ul className="space-y-2 text-white text-sm md:text-base pl-4 border-l-2 border-emerald-500/50">
                            {shot.shotType && <li><strong className="text-gray-400 uppercase">SHOT TYPE:</strong> {shot.shotType}</li>}
                            {shot.camera && <li><strong className="text-gray-400 uppercase">CAMERA:</strong> {shot.camera}</li>}
                            {shot.visual && <li><strong className="text-gray-400 uppercase">VISUAL:</strong> {shot.visual}</li>}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function VisualView({ state, setState, onGenerate, copyToClipboard }: any) {
  const { inputDivision, targetLanguage, isGenerating, visualizationPlan, error } = state;
  const [copiedShotMap, setCopiedShotMap] = useState<Record<string, boolean>>({});

  const handleCopyShot = (idx: string, text: string) => {
    copyToClipboard(text);
    setCopiedShotMap(prev => ({...prev, [idx]: true}));
    setTimeout(() => {
      setCopiedShotMap(prev => ({...prev, [idx]: false}));
    }, 2000);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 pt-20 pb-40">
      <div className="text-center mb-16">
        <h2 className="text-4xl md:text-6xl font-black italic tracking-tighter mb-4">
          <span className="text-white">SHOT TO</span> <span className="text-yellow-500 uppercase">VISUALIZATION</span>
        </h2>
        <div className="bg-black/50 py-2 inline-block px-10 border-b border-yellow-500/30">
          <p className="text-yellow-400 text-[10px] md:text-sm tracking-[0.2em] font-bold uppercase">
            BUILD YOUR CINEMATIC ACTION AND CAMERA MAPS
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex justify-between items-center px-2">
          <label className="text-yellow-500 text-[10px] font-black tracking-[0.2em] uppercase">INPUT YOUR SHOT DETAILS</label>
          <LangSelector current={targetLanguage} onChange={(l: Language) => setState({ ...state, targetLanguage: l })} colorClass="bg-[#3b82f6]" />
        </div>
        <textarea 
          value={inputDivision} 
          onChange={(e) => setState({...state, inputDivision: e.target.value})}
          className="w-full h-64 bg-[#0a0a0a]/80 backdrop-blur-sm border border-white/10 rounded-xl p-8 text-white focus:outline-none focus:border-yellow-500/50 shadow-2xl text-base" 
          placeholder="SHOT 1..." 
        />
        <button 
          onClick={onGenerate} 
          disabled={isGenerating} 
          className="w-full py-5 rounded-xl bg-[#facc15] text-black font-black uppercase tracking-[0.2em] hover:bg-yellow-400 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGenerating ? <><Loader2 className="animate-spin w-5 h-5" /> GENERATING VISUALIZATION...</> : 'GENERATE VISUALIZATION'}
        </button>
      </div>

      <div id="visualization-result-section">
        {error && <div className="mt-8 p-6 bg-red-950/20 border border-red-500/30 rounded-xl text-red-400 text-center text-xs font-black uppercase tracking-widest">{error}</div>}
        {visualizationPlan && (
          <div className="mt-16">
            <div className="border-2 border-[#facc15] rounded-[24px] md:rounded-[35px] p-6 md:p-12 bg-black relative shadow-[0_0_60px_rgba(250,204,21,0.2)]">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10 border-b border-white/10 pb-6">
                <span className="text-[#facc15] font-black text-xl md:text-2xl tracking-widest uppercase">SHOT TO VISUALIZATION</span>
                <button 
                  onClick={() => {
                    const txt = visualizationPlan.visuals.map((vis: any) => `${vis.shotNo}\nIMAGE P: ${vis.imagePrompt}\nVIDEO P: ${vis.videoPrompt}\nTYPE: ${vis.shotType}\nCAMERA: ${vis.cameraMovement}\nLENS: ${vis.lens}\nVISUAL: ${vis.visual}`).join('\n\n');
                    copyToClipboard(txt);
                  }}
                  className="bg-[#111] hover:bg-white hover:text-black border border-white/10 px-6 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest text-white transition-all flex items-center gap-2"
                >
                  <Copy className="w-4 h-4" /> COPY ALL SHOT DIVISION
                </button>
              </div>
              <div className="space-y-16">
                {visualizationPlan.visuals.map((vis: any, idx: number) => (
                  <div key={idx} className="space-y-6">
                    <h3 className="text-[#00b0ff] font-black text-xl md:text-2xl uppercase tracking-wider">{vis.shotNo}</h3>
                    
                    {/* Image Prompt */}
                    <div className="bg-[#0c1324] border border-[#00b0ff]/50 rounded-xl p-6 space-y-4">
                      <div className="flex justify-between items-center border-b border-[#00b0ff]/20 pb-3">
                        <span className="text-sky-400 font-extrabold text-xs tracking-widest uppercase flex items-center gap-2">
                          <Eye className="w-4 h-4"/> IMAGE PROMPT (16:9)
                        </span>
                        <button 
                          onClick={() => handleCopyShot(`img_${idx}`, vis.imagePrompt)}
                          className="text-sky-400 font-bold text-[9px] tracking-widest hover:text-white uppercase flex items-center gap-1"
                        >
                          {copiedShotMap[`img_${idx}`] ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3"/>}
                          {copiedShotMap[`img_${idx}`] ? 'COPIED!' : 'COPY PROMPT'}
                        </button>
                      </div>
                      <p className="text-white text-sm md:text-base font-medium">{vis.imagePrompt}</p>
                    </div>

                    {/* Meta Data */}
                    <div className="bg-[#070b12] border border-white/10 rounded-2xl p-6 md:p-8 space-y-8 shadow-inner">
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-white/10 pb-4">
                        <span className="text-[#00b0ff] font-black text-sm tracking-widest">CINEMATIC METADATA</span>
                        <button 
                          onClick={() => {
                            const metaText = `VIDEO PROMPT: ${vis.videoPrompt}\nSHOT TYPE: ${vis.shotType}\nCAMERA: ${vis.cameraMovement}\nLENS: ${vis.lens}\nAPERTURE: ${vis.lensAperture}\nANGLE: ${vis.angle}\nVISUAL: ${vis.visual}\nLIGHTING: ${vis.lighting}`;
                            handleCopyShot(`meta_${idx}`, metaText);
                          }}
                          className="text-[#00b0ff] font-bold text-[10px] tracking-widest hover:text-white uppercase flex items-center gap-1"
                        >
                          {copiedShotMap[`meta_${idx}`] ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3"/>}
                          {copiedShotMap[`meta_${idx}`] ? 'COPIED!' : 'COPY ALL METADATA'}
                        </button>
                      </div>
                      
                      <div className="space-y-3 bg-[#0c1529] border border-blue-900/30 p-5 rounded-xl">
                        <span className="text-sky-400 font-black text-xs tracking-wider block uppercase">VIDEO PROMPT</span>
                        <p className="text-white text-sm md:text-base font-medium">{vis.videoPrompt}</p>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                          { label: 'SHOT TYPE', value: vis.shotType },
                          { label: 'CAMERA MOVEMENT', value: vis.cameraMovement },
                          { label: 'LENS', value: vis.lens },
                          { label: 'LENS APERTURE', value: vis.lensAperture },
                          { label: 'ANGLE', value: vis.angle },
                          { label: 'VISUAL', value: vis.visual },
                          { label: 'LIGHTING', value: vis.lighting }
                        ].map((item, i) => (
                          <div key={i} className="bg-[#0c1529] border border-[#1e40af] rounded-lg p-4 flex flex-col shadow-[0_2px_10px_rgba(30,64,175,0.15)] transition-all hover:border-[#00b0ff]/50">
                            <span className="text-[#00b0ff] text-[10px] font-black mb-1">{item.label}</span>
                            <span className="text-white text-sm font-semibold">{item.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
