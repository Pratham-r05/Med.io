import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Send, Loader2, MessageSquare } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { API_URL, DEFAULT_PROVIDER, HOSTED_OLLAMA_MESSAGE, isHostedDeployment } from '../lib/api';
import { callHostedProviderChat } from '../lib/hosted-provider-chat';

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const saved = localStorage.getItem('medilens_chat_history');
    if (saved) {
      setMessages(JSON.parse(saved));
    }

    const handleClearChat = () => setMessages([]);
    window.addEventListener('clear_chat', handleClearChat);
    return () => window.removeEventListener('clear_chat', handleClearChat);
  }, []);

  const saveHistory = (newMessages) => {
    localStorage.setItem('medilens_chat_history', JSON.stringify(newMessages));
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg = { role: 'user', content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    saveHistory(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const historyToSend = messages.map(m => ({ role: m.role, content: m.content }));
      
      const provider = localStorage.getItem('medilens_provider') || DEFAULT_PROVIDER;
      const api_key = localStorage.getItem('medilens_api_key') || '';
      const model = localStorage.getItem('medilens_model') || '';

      if (isHostedDeployment && provider === 'ollama') {
        const errorMsg = { role: 'assistant', content: HOSTED_OLLAMA_MESSAGE };
        const updatedMessages = [...newMessages, errorMsg];
        setMessages(updatedMessages);
        saveHistory(updatedMessages);
        setIsLoading(false);
        return;
      }

      console.log('🔑 API Config:', { provider, api_key: api_key ? '***set***' : '(empty)', model });

      if (isHostedDeployment && provider !== 'ollama') {
        const aiContent = await callHostedProviderChat({
          provider,
          apiKey: api_key,
          model,
          history: historyToSend,
          userMessage: userMsg.content,
        });

        const aiMsg = { role: 'assistant', content: aiContent };
        const updatedMessages = [...newMessages, aiMsg];
        setMessages(updatedMessages);
        saveHistory(updatedMessages);
        return;
      }

      const response = await axios.post(`${API_URL}/chat`, {
        message: userMsg.content,
        history: historyToSend,
        provider,
        api_key,
        model
      });

      const data = response.data;
      let aiContent = "❌ Unknown error occurred.";
      
      if (data.success) {
        if (typeof data.response === 'string') {
          aiContent = data.response;
        } else if (data.response?.summary) {
          aiContent = data.response.summary;
        } else if (data.response?.raw_response) {
          aiContent = data.response.raw_response;
        } else {
          aiContent = "❌ No response generated.";
        }
      } else {
        if (typeof data.response === 'string') {
          aiContent = data.response;
        } else if (data.error) {
          aiContent = `❌ ${data.error}`;
        } else {
          aiContent = `❌ Error: ${data.detail || 'Unknown error'}`;
        }
      }

      const aiMsg = { role: 'assistant', content: aiContent };
      const updatedMessages = [...newMessages, aiMsg];
      setMessages(updatedMessages);
      saveHistory(updatedMessages);

    } catch (error) {
      const responseText =
        error.response?.data?.response ||
        error.response?.data?.error ||
        error.response?.data?.detail ||
        error.message;
      const errorMsg = { role: 'assistant', content: `❌ ${responseText}` };
      const updatedMessages = [...newMessages, errorMsg];
      setMessages(updatedMessages);
      saveHistory(updatedMessages);
    } finally {
      setIsLoading(false);
    }
  };

  const getMessageRowClass = (role) => (
    role === 'user'
      ? 'flex w-full'
      : 'flex w-full'
  );

  const getMessageBubbleClass = (role) => (
    role === 'user'
      ? 'ml-auto w-fit max-w-[75%] lg:max-w-[30rem] whitespace-pre-wrap break-words bg-blue-600 text-white rounded-2xl px-4 py-2 rounded-tr-sm'
      : 'mr-auto max-w-[84%] lg:max-w-[48rem] break-words bg-slate-700 text-slate-100 rounded-2xl px-5 py-4 rounded-tl-sm prose prose-invert'
  );

  return (
    <div className="flex flex-col h-full w-full px-4 pb-4 lg:px-8 relative z-10">
      
      {messages.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 opacity-40">
          <MessageSquare size={48} className="mb-4 text-blue-500/50" />
          <p className="text-slate-500 font-medium tracking-wide">Start a conversation to get medical insights</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto px-2 py-4 lg:px-4 space-y-6 no-scrollbar rounded-xl bg-transparent">
          {messages.map((msg, idx) => (
            <div key={idx} className={getMessageRowClass(msg.role)}>
              <div className={getMessageBubbleClass(msg.role)}>
                {msg.role === 'user' ? (
                  msg.content
                ) : (
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeRaw]}
                    components={{
                      table: ({node, ...props}) => <div className="overflow-x-auto my-4 rounded-lg border border-slate-600"><table className="w-full text-sm text-left border-collapse" {...props} /></div>,
                      thead: ({node, ...props}) => <thead className="bg-slate-800/80" {...props} />,
                      th: ({node, ...props}) => <th className="px-4 py-2.5 font-semibold border-b border-slate-600 text-blue-300 text-xs uppercase tracking-wider" {...props} />,
                      td: ({node, ...props}) => <td className="px-4 py-2 border-b border-slate-600/50 align-top" {...props} />,
                      tr: ({node, ...props}) => <tr className="even:bg-slate-800/30 hover:bg-slate-600/20 transition-colors" {...props} />,
                      h2: ({node, ...props}) => <h2 className="text-lg font-bold mt-5 mb-2 text-slate-100 border-b border-slate-600/50 pb-1" {...props} />,
                      h3: ({node, ...props}) => <h3 className="text-base font-semibold mt-4 mb-1.5 text-slate-200" {...props} />,
                      p: ({node, ...props}) => <p className="mb-2 last:mb-0 leading-relaxed" {...props} />,
                      ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-2 space-y-1" {...props} />,
                      ol: ({node, ...props}) => <ol className="list-decimal pl-5 mb-2 space-y-1" {...props} />,
                      li: ({node, ...props}) => <li className="mb-1 leading-relaxed" {...props} />,
                      strong: ({node, ...props}) => <strong className="text-slate-50 font-semibold" {...props} />,
                      a: ({node, ...props}) => <a className="text-blue-400 hover:underline" {...props} />,
                      hr: ({node, ...props}) => <hr className="border-slate-600/50 my-3" {...props} />,
                      code: ({node, inline, ...props}) => inline ? <code className="bg-slate-800 px-1 rounded text-blue-300" {...props} /> : <pre className="bg-slate-800 p-2 rounded overflow-x-auto mb-2"><code {...props} /></pre>
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="mr-auto max-w-[84%] lg:max-w-[48rem] bg-slate-700 text-slate-100 rounded-2xl px-4 py-2 rounded-tl-sm flex items-center space-x-2">
                <Loader2 size={18} className="animate-spin text-blue-400" />
                <span>Analyzing...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      )}

      <div className="mt-4 shrink-0 px-2 lg:px-4">
        <form onSubmit={handleSend} className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            placeholder="Ask me anything medical..."
            className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 pl-6 pr-14 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/30 transition-all disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute right-2 p-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50 disabled:shadow-none"
          >
            {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </form>
      </div>
    </div>
  );
}
