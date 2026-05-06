import { useState, useRef } from 'react';
import axios from 'axios';
import { UploadCloud, Image as ImageIcon, Camera, Loader2, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { API_URL, DEFAULT_PROVIDER, HOSTED_OLLAMA_MESSAGE, isHostedDeployment } from '../lib/api';
import { callHostedProviderVision } from '../lib/hosted-provider-vision';

export default function Images() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [status, setStatus] = useState('idle');
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [useCamera, setUseCamera] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      setStatus('idle');
      setResult(null);
      stopCamera();
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      streamRef.current = stream;
      setUseCamera(true);
      setFile(null);
      setPreview('');
      setStatus('idle');
    } catch (err) {
      setErrorMsg('Camera access denied or unavailable.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setUseCamera(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      
      canvas.toBlob((blob) => {
        const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' });
        setFile(file);
        setPreview(URL.createObjectURL(file));
        stopCamera();
      }, 'image/jpeg', 0.9);
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

    if (provider === 'ollama' && isHostedDeployment) {
      setStatus('error');
      setErrorMsg(HOSTED_OLLAMA_MESSAGE);
      return;
    }

    try {
      if (isHostedDeployment) {
        const hostedVision = await callHostedProviderVision({
          provider,
          apiKey: api_key,
          model,
          file,
        });

        setStatus('success');
        setResult({
          success: true,
          analysis: hostedVision.text,
          model_used: hostedVision.modelUsed,
        });
        return;
      }

      const response = await axios.post(`${API_URL}/analyze_image`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (response.data.success) {
        setStatus('success');
        setResult(response.data);
      } else {
        setStatus('error');
        setErrorMsg(response.data.error || 'Unknown error during analysis');
      }
    } catch (error) {
      setStatus('error');
      setErrorMsg(error.response?.data?.detail || error.message);
    }
  };

  const resetAll = () => {
    setFile(null);
    setPreview('');
    setStatus('idle');
    setResult(null);
    stopCamera();
  };

  const renderAnalysis = () => {
    if (!result?.analysis) return null;
    
    if (result.analysis.parts && result.analysis.parts.length > 0) {
      return (
        <div className="space-y-4">
          {result.analysis.parts.map((part, index) => (
            <div key={index} className="bg-slate-800 rounded-lg p-4">
              <h3 className="font-bold text-slate-100 mb-2 capitalize border-b border-slate-700 pb-2">{part.title}</h3>
              <p className="text-slate-300">{part.content}</p>
            </div>
          ))}
        </div>
      );
    }
    
    const formatted = typeof result.analysis === 'string' ? result.analysis.split('\n').map((line, i) => {
      if (line.startsWith('## ')) return <h2 key={i} className="text-xl font-bold mt-4 mb-2 text-slate-100">{line.replace('## ', '')}</h2>;
      if (line.startsWith('# ')) return <h1 key={i} className="text-2xl font-bold mt-5 mb-3 text-slate-100">{line.replace('# ', '')}</h1>;
      if (line.startsWith('- ')) return <li key={i} className="ml-4 list-disc text-slate-300">{line.replace('- ', '')}</li>;
      if (line.trim() === '') return <br key={i} />;
      return <p key={i} className="mb-2 text-slate-300">{line}</p>;
    }) : <p className="text-slate-300">{JSON.stringify(result.analysis)}</p>;
    
    return <div className="space-y-1">{formatted}</div>;
  };

  return (
    <div className="h-full overflow-y-auto p-8 pb-24 relative z-10 no-scrollbar">
      <div className="max-w-4xl mx-auto space-y-8">
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-100 mb-2 flex items-center justify-center space-x-3">
            <ImageIcon className="text-slate-300" />
            <span>Image Analysis Triage</span>
          </h1>
          <p className="text-slate-400">
            Upload medical images, skin conditions, or wounds for AI vision analysis.
          </p>
        </div>

        {!preview && !useCamera && (
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-slate-800 border-2 border-dashed border-slate-600 rounded-2xl p-8 text-center transition-all hover:border-slate-400">
              <input
                type="file"
                id="image-upload"
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
              />
              <label 
                htmlFor="image-upload"
                className="cursor-pointer flex flex-col items-center justify-center space-y-4 h-full"
              >
                <div className="p-4 bg-slate-700 rounded-full">
                  <UploadCloud size={48} className="text-slate-300" />
                </div>
                <div>
                  <span className="text-blue-400 font-medium hover:underline">Upload Image</span>
                  <p className="text-sm text-slate-500 mt-1">Supports JPG, PNG (Max 10MB)</p>
                </div>
              </label>
            </div>

            <div 
              onClick={startCamera}
              className="bg-slate-800 border-2 border-dashed border-slate-600 rounded-2xl p-8 text-center cursor-pointer transition-all hover:border-slate-400 flex flex-col items-center justify-center space-y-4"
            >
              <div className="p-4 bg-slate-700 rounded-full">
                <Camera size={48} className="text-slate-300" />
              </div>
              <div>
                <span className="text-blue-400 font-medium hover:underline">Take Photo</span>
                <p className="text-sm text-slate-500 mt-1">Use your device camera</p>
              </div>
            </div>
          </div>
        )}

        {useCamera && (
          <div className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden relative">
            <video ref={videoRef} autoPlay playsInline className="w-full max-h-[60vh] object-contain" />
            <div className="absolute bottom-4 inset-x-0 flex justify-center space-x-4">
              <button 
                onClick={capturePhoto}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg"
              >
                <Camera size={24} />
              </button>
              <button 
                onClick={stopCamera}
                className="bg-slate-600 hover:bg-slate-500 text-white rounded-full p-4 shadow-lg"
              >
                <AlertCircle size={24} />
              </button>
            </div>
          </div>
        )}

        {preview && (
          <div className="space-y-6 animate-in fade-in zoom-in duration-300">
            <div className="relative rounded-xl overflow-hidden border border-slate-700 max-h-[50vh] flex justify-center bg-slate-900/50">
              <img src={preview} alt="Preview" className="max-h-[50vh] object-contain" />
              <button 
                onClick={resetAll}
                className="absolute top-2 right-2 p-2 bg-slate-800/80 hover:bg-red-500 text-white rounded-full transition-colors"
              >
                <RefreshCw size={16} />
              </button>
            </div>

            <div className="flex justify-center">
              <button
                onClick={handleUpload}
                disabled={status === 'processing' || status === 'success'}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-all disabled:opacity-50"
              >
                {status === 'processing' ? (
                  <span className="flex items-center space-x-2">
                    <Loader2 size={20} className="animate-spin" />
                    <span>Analyzing Image...</span>
                  </span>
                ) : status === 'success' ? (
                  <span className="flex items-center space-x-2">
                    <CheckCircle size={20} />
                    <span>Analysis Complete</span>
                  </span>
                ) : (
                  'Analyze Image'
                )}
              </button>
            </div>
          </div>
        )}

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
          <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-xl animate-in slide-in-from-bottom-4 duration-500">
            <div className="bg-slate-700 px-6 py-4 border-b border-slate-600 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-2xl">👁️</span>
                <h2 className="text-lg font-bold text-slate-100">AI Vision Analysis</h2>
              </div>
              <span className="text-xs bg-slate-600 text-slate-300 px-2 py-1 rounded">
                {result.model || 'Vision Model'}
              </span>
            </div>
            
            <div className="p-6">
              {result.safety_flags && result.safety_flags.length > 0 && (
                <div className="mb-6 bg-red-900 border border-red-500 text-red-200 p-4 rounded-xl">
                  <h3 className="font-bold mb-2 flex items-center"><AlertCircle size={18} className="mr-2"/> Safety Warnings</h3>
                  <ul className="list-disc pl-5 space-y-1 text-sm">
                    {result.safety_flags.map((flag, i) => (
                      <li key={i}>{flag}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {renderAnalysis()}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
