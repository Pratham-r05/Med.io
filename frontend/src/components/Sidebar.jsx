import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  MessageSquare, 
  FileText, 
  Image as ImageIcon, 
  Activity, 
  Settings, 
  Shield, 
  Trash2, 
  ChevronDown, 
  ChevronRight,
  PanelLeftClose
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function Sidebar({ onClose }) {
  const [status, setStatus] = useState({ online: false, models: [], active_model: '' });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isGuidelinesOpen, setIsGuidelinesOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // API Configuration State
  const [apiProvider, setApiProvider] = useState(localStorage.getItem('medilens_provider') || 'ollama');
  const [apiKey, setApiKey] = useState(localStorage.getItem('medilens_api_key') || '');
  const [apiModel, setApiModel] = useState(localStorage.getItem('medilens_model') || '');

  const navigate = useNavigate();

  const fetchStatus = async () => {
    try {
      const res = await axios.get(`${API_URL}/status`);
      setStatus(res.data);
    } catch (error) {
      setStatus(prev => ({ ...prev, online: false }));
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleModelSwitch = async (modelName) => {
    try {
      await axios.post(`${API_URL}/switch_model`, { model: modelName });
      fetchStatus();
    } catch (error) {
      console.error('Failed to switch model', error);
    }
  };

  const handleClearChat = () => {
    localStorage.removeItem('medilens_chat_history');
    window.dispatchEvent(new Event('clear_chat'));
  };

  const handleSaveApiSettings = () => {
    localStorage.setItem('medilens_provider', apiProvider);
    localStorage.setItem('medilens_api_key', apiKey);
    localStorage.setItem('medilens_model', apiModel);
    
    // Dispatch event so other components can read the new settings
    window.dispatchEvent(new Event('api_settings_changed'));
  };

  const filteredModels = status.models.filter(m => 
    m.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-80 h-full bg-black border-r border-white/5 flex flex-col text-slate-100 overflow-y-auto no-scrollbar relative group">
      {/* Close Toggle Button */}
      <button 
        onClick={onClose}
        className="absolute right-4 top-6 p-2 text-slate-500 hover:text-white transition-all hover:bg-white/5 rounded-lg z-50"
      >
        <PanelLeftClose size={20} />
      </button>

      <div className="p-6">
        <div>
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-500 mb-1 flex items-center gap-2">
            <span className="text-blue-500">🏥</span> Med.io
          </h1>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Your Private Medical AI</p>
        </div>
      </div>

      <div className="px-3 py-2">
        <nav className="space-y-1 mt-4">
          <NavLink
            to="/chat"
            className={({ isActive }) =>
              `flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                isActive 
                  ? 'bg-blue-600/10 text-blue-400 shadow-[inset_0_0_10px_rgba(59,130,246,0.1)] border border-blue-500/20' 
                  : 'hover:bg-white/5 text-slate-400 hover:text-slate-100 border border-transparent'
              }`
            }
          >
            <MessageSquare size={22} className="min-w-[22px]" />
            <span className="font-medium">Medical Chat</span>
          </NavLink>
          
          <NavLink
            to="/documents"
            className={({ isActive }) =>
              `flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                isActive 
                  ? 'bg-purple-600/10 text-purple-400 shadow-[inset_0_0_10px_rgba(168,85,247,0.1)] border border-purple-500/20' 
                  : 'hover:bg-white/5 text-slate-400 hover:text-slate-100 border border-transparent'
              }`
            }
          >
            <FileText size={22} className="min-w-[22px]" />
            <span className="font-medium">Report Analysis</span>
          </NavLink>

          <NavLink
            to="/images"
            className={({ isActive }) =>
              `flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                isActive 
                  ? 'bg-teal-600/10 text-teal-400 shadow-[inset_0_0_10px_rgba(20,184,166,0.1)] border border-teal-500/20' 
                  : 'hover:bg-white/5 text-slate-400 hover:text-slate-100 border border-transparent'
              }`
            }
          >
            <ImageIcon size={22} className="min-w-[22px]" />
            <span className="font-medium">Image Analysis</span>
          </NavLink>
        </nav>
      </div>

      <div className="px-4 py-6 mt-4">
        <div className="flex items-center space-x-2 mb-4 px-2">
          <div className={`w-2 h-2 rounded-full ${status.online ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
          <span className={`text-xs font-bold uppercase tracking-wider ${status.online ? 'text-green-500' : 'text-red-500'}`}>
            {status.online ? 'System Online' : 'System Offline'}
          </span>
        </div>
        
        {status.online && (
          <div className="bg-white/[0.03] rounded-2xl p-4 border border-white/[0.05] mb-2 backdrop-blur-sm">
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <Activity size={10} className="text-blue-500" /> Active Model
            </div>
            <div className="text-sm font-semibold text-white truncate flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
              {status.active_model || 'None'}
            </div>
          </div>
        )}
      </div>

      <div className="px-3 py-2 flex-grow">
        <div className="mb-2">
          <button 
            onClick={() => setIsGuidelinesOpen(!isGuidelinesOpen)}
            className="w-full flex items-center justify-between px-4 py-3 text-slate-400 hover:text-white transition-colors rounded-xl hover:bg-white/5"
          >
            <div className="flex items-center space-x-3">
              <Shield size={20} className="text-indigo-400" />
              <span className="font-medium text-sm">Medical Guidelines</span>
            </div>
            {isGuidelinesOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
          
          {isGuidelinesOpen && (
            <div className="mx-2 p-4 bg-white/[0.02] rounded-xl border border-white/[0.05] text-xs text-slate-400 space-y-3 mt-1 animate-in fade-in slide-in-from-top-1">
              <div>
                <strong className="text-red-400/80 block mb-1 font-bold uppercase tracking-tighter">Disclaimer:</strong>
                <ul className="list-disc pl-4 space-y-1.5 opacity-80">
                  <li>AI assistance, not diagnosis</li>
                  <li>Consult healthcare professionals</li>
                  <li>For emergencies, call 911</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        <div className="mb-4">
          <button 
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            className="w-full flex items-center justify-between px-4 py-3 text-slate-400 hover:text-white transition-colors rounded-xl hover:bg-white/5"
          >
            <div className="flex items-center space-x-3">
              <Settings size={20} className="text-slate-400" />
              <span className="font-medium text-sm">Settings</span>
            </div>
            {isSettingsOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
          
          {isSettingsOpen && (
            <div className="mx-2 p-4 bg-white/[0.02] rounded-xl border border-white/[0.05] text-sm mt-1 animate-in fade-in slide-in-from-top-1">
              <div className="mb-4">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">API Configuration</label>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Provider</label>
                    <select
                      value={apiProvider}
                      onChange={(e) => {
                        setApiProvider(e.target.value);
                        // Optional: Set default models based on provider
                        if (e.target.value === 'openai') setApiModel('gpt-4o-mini');
                        else if (e.target.value === 'anthropic') setApiModel('claude-3-haiku-20240307');
                        else if (e.target.value === 'gemini') setApiModel('gemini-2.0-flash');
                        else if (e.target.value === 'openrouter') setApiModel('google/gemini-2.0-flash-exp:free');
                      }}
                      className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-blue-500/50"
                    >
                      <option value="ollama">Ollama (Local)</option>
                      <option value="openai">OpenAI</option>
                      <option value="anthropic">Anthropic</option>
                      <option value="openrouter">OpenRouter</option>
                      <option value="gemini">Google Gemini</option>
                    </select>
                  </div>
                  
                  {apiProvider !== 'ollama' && (
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">API Key</label>
                      <input
                        type="password"
                        placeholder="Enter API Key"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-blue-500/50 placeholder:text-slate-600"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Model Name</label>
                    <input
                      type="text"
                      placeholder={
                        apiProvider === 'ollama' ? 'e.g., gpt-oss:20b' : 
                        apiProvider === 'openrouter' ? 'e.g., google/gemini-2.0-flash-exp:free' :
                        apiProvider === 'openai' ? 'e.g., gpt-4o-mini' :
                        apiProvider === 'anthropic' ? 'e.g., claude-3-haiku-20240307' :
                        apiProvider === 'gemini' ? 'e.g., gemini-2.0-flash' : 'e.g., model-name'
                      }
                      value={apiModel}
                      onChange={(e) => setApiModel(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-blue-500/50 placeholder:text-slate-600"
                    />
                  </div>

                  <button
                    onClick={handleSaveApiSettings}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg text-xs font-semibold transition-all shadow-md shadow-blue-500/20"
                  >
                    Save Settings
                  </button>
                </div>
              </div>
              
              <button
                onClick={handleClearChat}
                className="w-full flex items-center justify-center space-x-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 py-2.5 rounded-lg transition-all text-xs font-semibold border border-red-500/10"
              >
                <Trash2 size={14} />
                <span>Clear Conversation</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="mt-auto px-6 py-8 border-t border-white/[0.05]">
        <div className="flex items-center space-x-2 mb-2 text-slate-400">
          <div className="w-5 h-5 rounded-full bg-green-500/10 flex items-center justify-center">
            <Shield size={12} className="text-green-500" />
          </div>
          <span className="font-bold text-[10px] uppercase tracking-widest">Privacy Secured</span>
        </div>
        <p className="text-[10px] text-slate-600 leading-relaxed font-medium">
          100% local processing - your data never leaves your device
        </p>
      </div>
    </div>
  );
}
