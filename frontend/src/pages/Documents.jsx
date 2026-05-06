import { useState } from 'react';
import axios from 'axios';
import { UploadCloud, FileText, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { API_URL, DEFAULT_PROVIDER, HOSTED_OLLAMA_MESSAGE, isHostedDeployment } from '../lib/api';
import { callHostedProviderDocumentFromImage } from '../lib/hosted-provider-vision';

export default function Documents() {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('idle'); // idle, processing, success, error
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setStatus('idle');
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setStatus('processing');
    const formData = new FormData();
    formData.append('file', file);

    const provider = localStorage.getItem('medilens_provider') || DEFAULT_PROVIDER;
    const api_key = localStorage.getItem('medilens_api_key') || '';
    const model = localStorage.getItem('medilens_model') || '';
    const isImageFile = file.type?.startsWith('image/');

    if (provider === 'ollama' && isHostedDeployment) {
      setStatus('error');
      setErrorMsg(HOSTED_OLLAMA_MESSAGE);
      return;
    }

    if (isHostedDeployment && !isImageFile) {
      setStatus('error');
      setErrorMsg('PDF and OCR report analysis stay local-only on Vercel. Use the local app for reports.');
      return;
    }

    formData.append('provider', provider);
    formData.append('api_key', api_key);
    formData.append('model', model);

    try {
      if (isHostedDeployment && isImageFile) {
        const hostedVision = await callHostedProviderDocumentFromImage({
          provider,
          apiKey: api_key,
          model,
          file,
        });

        setStatus('success');
        setResult({
          processing: {
            success: true,
            extracted_text: hostedVision.extractedText,
            processing_method: `Hosted vision OCR via ${hostedVision.modelUsed}`,
          },
          analysis: {
            analysis: hostedVision.analysisText,
          },
        });
        return;
      }

      const response = await axios.post(`${API_URL}/analyze_document`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (response.data.processing?.success || response.data.success) {
        setStatus('success');
        setResult(response.data);
      } else {
        setStatus('error');
        setErrorMsg(response.data.processing?.error || response.data.error || 'Unknown error during processing');
      }
    } catch (error) {
      setStatus('error');
      setErrorMsg(error.response?.data?.detail || error.message);
    }
  };

  const renderAnalysis = () => {
    if (!result?.analysis) return null;
    
    let text = "";
    if (result.analysis.analysis) text = result.analysis.analysis;
    else if (result.analysis.original_analysis) text = result.analysis.original_analysis;
    
    if (text) {
      return (
        <div className="prose prose-invert max-w-none">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw]}
            components={{
              table: ({node, ...props}) => <div className="overflow-x-auto my-4 rounded-lg border border-slate-600"><table className="w-full text-sm text-left border-collapse" {...props} /></div>,
              thead: ({node, ...props}) => <thead className="bg-slate-800/80" {...props} />,
              th: ({node, ...props}) => <th className="px-4 py-2.5 font-semibold border-b border-slate-600 text-blue-300 text-xs uppercase tracking-wider" {...props} />,
              td: ({node, ...props}) => <td className="px-4 py-2 border-b border-slate-600/50 align-top" {...props} />,
              tr: ({node, ...props}) => <tr className="even:bg-slate-800/30 hover:bg-slate-600/20 transition-colors" {...props} />,
              h1: ({node, ...props}) => <h1 className="text-2xl font-bold mt-5 mb-3 text-slate-100" {...props} />,
              h2: ({node, ...props}) => <h2 className="text-lg font-bold mt-5 mb-2 text-slate-100 border-b border-slate-600/50 pb-1" {...props} />,
              h3: ({node, ...props}) => <h3 className="text-base font-semibold mt-4 mb-1.5 text-slate-200" {...props} />,
              p: ({node, ...props}) => <p className="mb-2 last:mb-0 text-slate-300 leading-relaxed" {...props} />,
              ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-2 space-y-1 text-slate-300" {...props} />,
              ol: ({node, ...props}) => <ol className="list-decimal pl-5 mb-2 space-y-1 text-slate-300" {...props} />,
              li: ({node, ...props}) => <li className="mb-1 leading-relaxed" {...props} />,
              strong: ({node, ...props}) => <strong className="text-slate-100 font-semibold" {...props} />,
              a: ({node, ...props}) => <a className="text-blue-400 hover:underline" {...props} />,
              hr: ({node, ...props}) => <hr className="border-slate-600/50 my-3" {...props} />,
              code: ({node, inline, ...props}) => inline ? <code className="bg-slate-800 px-1 rounded text-blue-300" {...props} /> : <pre className="bg-slate-800 p-2 rounded overflow-x-auto mb-2"><code {...props} /></pre>
            }}
          >
            {text}
          </ReactMarkdown>
        </div>
      );
    }
    
    if (result.analysis.medical_values?.length > 0) {
      return (
        <div>
          <h3 className="font-bold text-lg mb-2 text-slate-100">Extracted Medical Values:</h3>
          <ul className="space-y-2">
            {result.analysis.medical_values.map((v, i) => (
              <li key={i} className="bg-slate-800 p-2 rounded">
                <span className="font-medium text-slate-200">{v.name}:</span> <span className="text-slate-100">{v.value}</span> <span className="text-slate-400">{v.unit}</span>
              </li>
            ))}
          </ul>
        </div>
      );
    }
    
    return <p className="text-slate-300">No analysis generated.</p>;
  };

  return (
    <div className="h-full overflow-y-auto p-8 pb-24 relative z-10 no-scrollbar">
      <div className="max-w-4xl mx-auto space-y-8">
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-100 mb-2 flex items-center justify-center space-x-3">
            <FileText className="text-slate-300" />
            <span>Medical Report Analysis</span>
          </h1>
          <p className="text-slate-400">
            Upload medical documents, lab reports, or test results for AI-powered analysis and interpretation.
          </p>
        </div>

        <div className="bg-slate-800 border-2 border-dashed border-slate-600 rounded-2xl p-8 text-center transition-all hover:border-slate-400">
          <input
            type="file"
            id="file-upload"
            className="hidden"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleFileChange}
          />
          <label 
            htmlFor="file-upload"
            className="cursor-pointer flex flex-col items-center justify-center space-y-4"
          >
            <div className="p-4 bg-slate-700 rounded-full">
              <UploadCloud size={48} className="text-slate-300" />
            </div>
            <div>
              <span className="text-blue-400 font-medium hover:underline">Click to upload</span> <span className="text-slate-300">or drag and drop</span>
              <p className="text-sm text-slate-500 mt-1">Supports PDF documents and images (Max 10MB)</p>
            </div>
          </label>

          {file && (
            <div className="mt-6 flex items-center justify-center space-x-4">
              <div className="flex items-center space-x-2 text-slate-100 bg-slate-700 px-4 py-2 rounded-lg">
                <FileText size={18} />
                <span className="truncate max-w-xs">{file.name}</span>
              </div>
              <button
                onClick={handleUpload}
                disabled={status === 'processing'}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition-all disabled:opacity-50"
              >
                {status === 'processing' ? (
                  <span className="flex items-center space-x-2">
                    <Loader2 size={18} className="animate-spin" />
                    <span>Processing...</span>
                  </span>
                ) : (
                  'Analyze Document'
                )}
              </button>
            </div>
          )}
        </div>

        {status === 'error' && (
          <div className="bg-red-900 border border-red-500 text-red-200 rounded-xl px-4 py-3 flex items-start space-x-3">
            <AlertCircle className="shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium">Analysis Failed</h3>
              <p className="text-sm mt-1 opacity-90">{errorMsg}</p>
            </div>
          </div>
        )}

        {status === 'success' && result && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-slate-800 border border-green-500 text-green-400 px-4 py-3 rounded-xl flex items-center space-x-2">
              <CheckCircle size={20} />
              <span className="font-medium">Document processed successfully</span>
            </div>

            <details className="group bg-slate-800 border border-slate-700 rounded-xl overflow-hidden" open>
              <summary className="flex cursor-pointer items-center justify-between bg-slate-700 px-6 py-4 font-medium text-slate-100">
                <span className="flex items-center space-x-2">
                  <FileText size={18} className="text-slate-300" />
                  <span>Extracted Text</span>
                </span>
                <span className="transition group-open:rotate-180">
                  <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                </span>
              </summary>
              <div className="px-6 py-4 text-slate-300 text-sm whitespace-pre-wrap max-h-64 overflow-y-auto font-mono">
                {result.processing?.extracted_text || 'No text extracted.'}
              </div>
            </details>

            <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-xl">
              <div className="bg-slate-700 px-6 py-4 border-b border-slate-600 flex items-center space-x-2">
                <span className="text-2xl">🧠</span>
                <h2 className="text-lg font-bold text-slate-100">AI Medical Analysis</h2>
              </div>
              <div className="p-6">
                {renderAnalysis()}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
