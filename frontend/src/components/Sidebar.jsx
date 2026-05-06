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
import { API_URL, DEFAULT_PROVIDER, HOSTED_OLLAMA_MESSAGE, isHostedDeployment } from '../lib/api';

export default function Sidebar({ onClose }) {
  const [status, setStatus] = useState({ online: false, models: [], active_model: '' });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isGuidelinesOpen, setIsGuidelinesOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // API Configuration State
  const [apiProvider, setApiProvider] = useState(localStorage.getItem('medilens_provider') || DEFAULT_PROVIDER);
  const [apiKey, setApiKey] = useState(localStorage.getItem('medilens_api_key') || '');
  const [apiModel, setApiModel] = useState(localStorage.getItem('medilens_model') || '');

  const navigate = useNavigate();
  const activeSidebarModel =
    apiProvider === 'ollama'
      ? (status.active_model || apiModel || 'None')
      : (apiModel || status.active_model || 'None');

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

  useEffect(() => {
    const syncApiSettings = () => {
      setApiProvider(localStorage.getItem('medilens_provider') || DEFAULT_PROVIDER);
      setApiKey(localStorage.getItem('medilens_api_key') || '');
      setApiModel(localStorage.getItem('medilens_model') || '');
    };

    window.addEventListener('api_settings_changed', syncApiSettings);
    return () => window.removeEventListener('api_settings_changed', syncApiSettings);
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
    <div className="w-80 h-full bg-black border-r border-white/10 flex flex-col text-white overflow-y-auto no-scrollbar relative">
      <button 
        onClick={onClose}
        className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-md border border-white/10 text-white/50 transition-colors hover:border-white/20 hover:text-white"
      >
        <PanelLeftClose size={20} />
      </button>

      <div className="border-b border-white/10 px-6 py-6">
        <div className="pr-12">
          <h1 className="mb-2 text-[2.1rem] font-semibold tracking-[-0.04em] text-white">
            <span className="font-serif italic font-normal text-white/92">medo</span>
            <span className="mx-0.5 font-light text-white/45">.</span>
            <span className="font-sans font-semibold tracking-[-0.06em] text-white">io</span>
          </h1>
          <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-white/45">
            Your Private Medical AI
          </p>
        </div>
      </div>

      <div className="border-b border-white/10 px-4 py-5">
        <nav className="space-y-2">
          <NavLink
            to="/chat"
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-md border px-4 py-3 text-[15px] font-medium transition-colors ${
                isActive 
                  ? 'border-white bg-white text-black' 
                  : 'border-transparent text-white/60 hover:border-white/10 hover:bg-white/5 hover:text-white'
              }`
            }
          >
            <MessageSquare size={19} className="min-w-[19px]" />
            <span>Medical Chat</span>
          </NavLink>
          
          <NavLink
            to="/documents"
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-md border px-4 py-3 text-[15px] font-medium transition-colors ${
                isActive 
                  ? 'border-white bg-white text-black' 
                  : 'border-transparent text-white/60 hover:border-white/10 hover:bg-white/5 hover:text-white'
              }`
            }
          >
            <FileText size={19} className="min-w-[19px]" />
            <span>Report Analysis</span>
          </NavLink>

          <NavLink
            to="/images"
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-md border px-4 py-3 text-[15px] font-medium transition-colors ${
                isActive 
                  ? 'border-white bg-white text-black' 
                  : 'border-transparent text-white/60 hover:border-white/10 hover:bg-white/5 hover:text-white'
              }`
            }
          >
            <ImageIcon size={19} className="min-w-[19px]" />
            <span>Image Analysis</span>
          </NavLink>
        </nav>
      </div>

      <div className="border-b border-white/10 px-6 py-5">
        <div className="mb-4 flex items-center gap-3">
          <div className={`h-2 w-2 rounded-full ${status.online ? 'bg-white' : 'bg-white/35'}`}></div>
          <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/70">
            {status.online ? 'System Online' : 'System Offline'}
          </span>
        </div>
        
        {(status.online || apiProvider !== 'ollama' || apiModel) && (
          <div className="rounded-md border border-white/10 bg-white/[0.02] px-4 py-3.5">
            <div className="mb-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-white/45">
              <Activity size={12} /> Active Model
            </div>
            <div className="flex items-start gap-2 text-sm font-medium text-white">
              <div className="h-1.5 w-1.5 rounded-full bg-white/70"></div>
              <div className="min-w-0 flex-1">
                <div className="break-all font-medium leading-6">{activeSidebarModel}</div>
                <div className="mt-1 text-[10px] uppercase tracking-[0.22em] text-white/35">
                  {apiProvider}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex-grow px-4 py-5">
        <div className="mb-3">
          <button 
            onClick={() => setIsGuidelinesOpen(!isGuidelinesOpen)}
            className="flex w-full items-center justify-between rounded-md border border-transparent px-4 py-3 text-left text-white/65 transition-colors hover:border-white/10 hover:bg-white/5 hover:text-white"
          >
            <div className="flex items-center gap-3">
              <Shield size={18} />
              <span className="text-sm font-medium">Medical Guidelines</span>
            </div>
            {isGuidelinesOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
          
          {isGuidelinesOpen && (
            <div className="mt-2 rounded-md border border-white/10 bg-white/[0.03] p-4 text-xs text-white/60 animate-in fade-in slide-in-from-top-1">
              <div>
                <strong className="mb-2 block font-semibold uppercase tracking-[0.2em] text-white/45">Disclaimer</strong>
                <ul className="list-disc space-y-1.5 pl-4">
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
            className="flex w-full items-center justify-between rounded-md border border-transparent px-4 py-3 text-left text-white/65 transition-colors hover:border-white/10 hover:bg-white/5 hover:text-white"
          >
            <div className="flex items-center gap-3">
              <Settings size={18} />
              <span className="text-sm font-medium">Settings</span>
            </div>
            {isSettingsOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
          
          {isSettingsOpen && (
            <div className="mt-2 rounded-md border border-white/10 bg-white/[0.02] p-5 text-sm animate-in fade-in slide-in-from-top-1">
              <div className="mb-3">
                <label className="mb-4 block text-[10px] font-semibold uppercase tracking-[0.24em] text-white/45">API Configuration</label>
                
                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-[11px] font-medium uppercase tracking-[0.16em] text-white/42">Provider</label>
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
                      className="w-full rounded-md border border-white/12 bg-black px-3 py-3 text-sm text-white outline-none transition-colors focus:border-white/40"
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
                      <label className="mb-2 block text-[11px] font-medium uppercase tracking-[0.16em] text-white/42">API Key</label>
                      <input
                        type="password"
                        placeholder="Enter API Key"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        className="w-full rounded-md border border-white/12 bg-black px-3 py-3 text-sm text-white outline-none transition-colors placeholder:text-white/20 focus:border-white/40"
                      />
                    </div>
                  )}

                  <div>
                    <label className="mb-2 block text-[11px] font-medium uppercase tracking-[0.16em] text-white/42">Model Name</label>
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
                      className="w-full rounded-md border border-white/12 bg-black px-3 py-3 text-[13px] font-mono text-white outline-none transition-colors placeholder:text-white/20 focus:border-white/40"
                    />
                  </div>

                  <button
                    onClick={handleSaveApiSettings}
                    className="mt-1 w-full rounded-md border border-white bg-white py-3 text-sm font-semibold text-black transition-colors hover:bg-white/90"
                  >
                    Save Settings
                  </button>

                  {isHostedDeployment && apiProvider === 'ollama' && (
                    <p className="text-xs leading-5 text-amber-300/85">
                      {HOSTED_OLLAMA_MESSAGE}
                    </p>
                  )}
                </div>
              </div>
              
              <button
                onClick={handleClearChat}
                className="flex w-full items-center justify-center gap-2 rounded-md border border-white/12 bg-transparent py-3 text-sm font-semibold text-white/72 transition-colors hover:border-white/25 hover:bg-white/5 hover:text-white"
              >
                <Trash2 size={14} />
                <span>Clear Conversation</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="mt-auto border-t border-white/10 px-6 py-7">
        <div className="mb-2 flex items-center gap-2 text-white/65">
          <div className="flex h-5 w-5 items-center justify-center rounded-full border border-white/12">
            <Shield size={12} className="text-white/65" />
          </div>
          <span className="text-[10px] font-semibold uppercase tracking-[0.24em]">Privacy Secured</span>
        </div>
        <p className="text-[11px] leading-6 text-white/38">
          {isHostedDeployment ? 'Hosted on Vercel. Use your own provider key in Settings.' : '100% local processing - your data never leaves your device'}
        </p>
      </div>
    </div>
  );
}
