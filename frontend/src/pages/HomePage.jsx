import { useState } from 'react';
import PromptForm from '../components/PromptForm.jsx';
import ImageDisplay from '../components/ImageDisplay.jsx';
import { generateImage } from '../api/client.js';
import { useToast } from '../context/ToastContext.jsx';

function extractErrorMessage(err) {
  if (err?.response?.data?.detail) {
    const detail = err.response.data.detail;
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail) && detail[0]?.msg) return detail[0].msg;
  }
  if (err?.message) return err.message;
  return 'Unexpected error. Please try again.';
}

export default function HomePage() {
  const toast = useToast();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleGenerate = async (payload) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await generateImage(payload);
      setResult(data);
      if (data.cached) {
        toast.info('Returned a cached image (no API cost). Toggle "Force re-generation" to generate a new one.');
      } else if (data.was_translated) {
        toast.success('Image generated — your prompt was auto-translated to English first.');
      } else {
        toast.success('Image generated and saved');
      }
    } catch (err) {
      const message = extractErrorMessage(err);
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="mb-8 text-center sm:mb-10">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Turn words into{' '}
          <span className="bg-gradient-to-r from-indigo-500 to-violet-500 bg-clip-text text-transparent">
            images
          </span>
        </h2>
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-400 sm:text-base">
          Powered by <span className="font-semibold">gpt-image-1</span>. Arabic prompts are auto-translated.
          Duplicate prompts return instantly from cache.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <PromptForm onSubmit={handleGenerate} loading={loading} />
        <ImageDisplay result={result} loading={loading} error={error} />
      </div>
    </main>
  );
}
