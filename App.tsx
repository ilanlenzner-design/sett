import React, { useState, useCallback, useEffect } from 'react';
import { describeImage, expandImage } from './services/geminiService';
import { fileToGenerativePart } from './utils/fileUtils';
import { ASPECT_RATIOS, AspectRatio } from './constants';
import { UploadIcon, SparklesIcon, ArrowPathIcon, ExclamationTriangleIcon } from './components/Icons';

type AppState = 'idle' | 'describing' | 'ready' | 'generating' | 'done' | 'error';

const App: React.FC = () => {
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [originalImagePreview, setOriginalImagePreview] = useState<string | null>(null);
  const [generatedPrompt, setGeneratedPrompt] = useState<string>('');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(ASPECT_RATIOS[0]);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [appState, setAppState] = useState<AppState>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  
  const handleReset = () => {
    setOriginalFile(null);
    setOriginalImagePreview(null);
    setGeneratedPrompt('');
    setAspectRatio(ASPECT_RATIOS[0]);
    setGeneratedImage(null);
    setErrorMessage('');
    setAppState('idle');
  };
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setOriginalFile(file);
      setOriginalImagePreview(URL.createObjectURL(file));
      setAppState('describing');
    }
  };

  const describeOriginalImage = useCallback(async () => {
    if (!originalFile) return;

    try {
      const imagePart = await fileToGenerativePart(originalFile);
      const promptText = "Describe this image in a detailed, single paragraph, suitable for an image generation prompt. Focus on the style, subject, and composition.";
      const description = await describeImage(imagePart, promptText);
      setGeneratedPrompt(description);
      setAppState('ready');
    } catch (err) {
      console.error(err);
      setErrorMessage('Could not generate a description for the image. Please try another one.');
      setAppState('error');
    }
  }, [originalFile]);

  useEffect(() => {
    if (appState === 'describing') {
      describeOriginalImage();
    }
  }, [appState, describeOriginalImage]);


  const handleGenerateClick = async () => {
    if (!generatedPrompt || !originalImagePreview) {
      setErrorMessage('A prompt and an original image are required.');
      setAppState('error');
      return;
    }
    setAppState('generating');
    setGeneratedImage(null);

    try {
      // 1. Create a canvas with the target aspect ratio
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');

      const [targetW, targetH] = aspectRatio.value.split(':').map(Number);
      const MAX_DIMENSION = 1024; // Define a max size for the output image

      // Set canvas dimensions based on aspect ratio
      if (targetW >= targetH) {
          canvas.width = MAX_DIMENSION;
          canvas.height = Math.round((MAX_DIMENSION * targetH) / targetW);
      } else {
          canvas.height = MAX_DIMENSION;
          canvas.width = Math.round((MAX_DIMENSION * targetW) / targetH);
      }

      // 2. Load the original image
      const img = new Image();
      img.src = originalImagePreview;
      await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = (err) => reject(new Error('Failed to load original image preview.'));
      });

      // 3. Calculate scaling to 'contain' original image inside canvas, preserving its aspect ratio
      const hRatio = canvas.width / img.width;
      const vRatio = canvas.height / img.height;
      const ratio = Math.min(hRatio, vRatio);

      const scaledWidth = img.width * ratio;
      const scaledHeight = img.height * ratio;

      // 4. Center and draw the original image onto the canvas
      const x = (canvas.width - scaledWidth) / 2;
      const y = (canvas.height - scaledHeight) / 2;
      ctx.drawImage(img, x, y, scaledWidth, scaledHeight);

      // 5. Get the composite image as a base64 PNG (to preserve transparency)
      const imageBase64 = canvas.toDataURL('image/png').split(',')[1];
      
      // 6. Create the expansion prompt
      const expansionPrompt = `Creatively expand the central image to fill the surrounding transparent areas. Maintain the original image's style, lighting, and subject matter. The original is about: ${generatedPrompt}`;
      
      // 7. Call the new service function to expand the image
      const imageB64 = await expandImage(imageBase64, expansionPrompt);
      setGeneratedImage(`data:image/png;base64,${imageB64}`);
      setAppState('done');

    } catch (err) {
      console.error(err);
      setErrorMessage('Failed to expand the image. The model might not support this type of edit. Please try again.');
      setAppState('error');
    }
  };


  const renderContent = () => {
    switch (appState) {
      case 'error':
        return (
          <div className="text-center p-8 bg-red-900/20 rounded-lg">
            <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-400" />
            <h3 className="mt-2 text-lg font-semibold text-white">An Error Occurred</h3>
            <p className="mt-2 text-sm text-red-300">{errorMessage}</p>
            <button
              onClick={handleReset}
              className="mt-6 inline-flex items-center gap-2 rounded-md bg-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
            >
              <ArrowPathIcon className="h-5 w-5"/>
              Start Over
            </button>
          </div>
        );
      case 'idle':
        return (
          <div className="relative block w-full rounded-lg border-2 border-dashed border-gray-600 p-12 text-center hover:border-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-900">
            <UploadIcon className="mx-auto h-12 w-12 text-gray-500" />
            <span className="mt-2 block text-sm font-semibold text-gray-400">Upload an image to start</span>
            <input type="file" accept="image/*" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
          </div>
        );
      default:
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column */}
            <div className="flex flex-col gap-4">
              <h2 className="text-xl font-bold text-gray-300">1. Original Image</h2>
              <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-gray-800">
                {originalImagePreview && <img src={originalImagePreview} alt="Original upload" className="object-contain w-full h-full" />}
                {(appState === 'describing') && (
                  <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-center p-4">
                    <div className="w-8 h-8 border-4 border-dashed rounded-full animate-spin border-indigo-400"></div>
                    <p className="mt-4 font-semibold">Analyzing your image...</p>
                  </div>
                )}
              </div>
              
              <h2 className="text-xl font-bold text-gray-300">2. Image Description</h2>
              <textarea
                value={generatedPrompt}
                onChange={(e) => setGeneratedPrompt(e.target.value)}
                rows={5}
                className="w-full p-2 bg-gray-800 border border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
                placeholder="AI is generating a description..."
                disabled={appState === 'describing'}
              />
              
              <h2 className="text-xl font-bold text-gray-300">3. Choose Aspect Ratio</h2>
              <select
                value={aspectRatio.value}
                onChange={(e) => setAspectRatio(ASPECT_RATIOS.find(ar => ar.value === e.target.value) || ASPECT_RATIOS[0])}
                className="w-full p-2 bg-gray-800 border border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                {ASPECT_RATIOS.map(ar => <option key={ar.value} value={ar.value}>{ar.label}</option>)}
              </select>

              <button
                onClick={handleGenerateClick}
                disabled={appState === 'describing' || appState === 'generating' || !generatedPrompt}
                className="mt-4 inline-flex w-full justify-center items-center gap-2 rounded-md bg-indigo-600 px-4 py-3 text-base font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:bg-gray-600 disabled:cursor-not-allowed"
              >
                {appState === 'generating' ? 'Expanding...' : <><SparklesIcon className="h-5 w-5" /> Expand Image</>}
              </button>
            </div>

            {/* Right Column */}
            <div className="flex flex-col gap-4">
              <h2 className="text-xl font-bold text-gray-300">4. Expanded Image</h2>
              <div
                className="relative w-full rounded-lg overflow-hidden bg-gray-800"
                style={{ aspectRatio: aspectRatio.value.replace(':', ' / ') }}
              >
                {generatedImage && <img src={generatedImage} alt="Generated" className="object-cover w-full h-full" />}
                {appState === 'generating' && (
                  <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-center p-4">
                    <div className="w-8 h-8 border-4 border-dashed rounded-full animate-spin border-indigo-400"></div>
                    <p className="mt-4 font-semibold">Creatively expanding...</p>
                    <p className="text-sm text-gray-400">This may take a moment.</p>
                  </div>
                )}
                 {appState !== 'generating' && !generatedImage && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
                        <SparklesIcon className="h-12 w-12 text-gray-600"/>
                        <p className="mt-2 font-semibold text-gray-500">Your expanded image will appear here</p>
                    </div>
                 )}
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans">
      <main className="container mx-auto p-4 md:p-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-indigo-500">AI Creative Expander</span>
          </h1>
          <p className="mt-2 text-lg text-gray-400 max-w-2xl mx-auto">Expand your images with AI. Upload a photo, choose a new aspect ratio, and let AI creatively fill in the rest.</p>
          {appState !== 'idle' && (
             <button
              onClick={handleReset}
              className="mt-6 inline-flex items-center gap-2 rounded-md bg-gray-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-600"
            >
              <ArrowPathIcon className="h-5 w-5"/>
              Start Over
            </button>
          )}
        </header>
        <div className="bg-gray-800/50 rounded-xl p-4 md:p-8 shadow-2xl border border-gray-700">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;
