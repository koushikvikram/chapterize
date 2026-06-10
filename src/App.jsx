import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenerativeAI } from "@google/generative-ai";

// We need to inject the libraries dynamically since we are in a single-file React environment
// and can't use standard npm imports for these specific heavy libraries.
const useScript = (url, integrity) => {
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    const script = document.createElement('script');
    script.src = url;
    if (integrity) {
        script.integrity = integrity;
        script.crossOrigin = "anonymous";
    }
    script.onload = () => setLoaded(true);
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, [url, integrity]);
  return loaded;
};

// SVG Icons
const Icons = {
  Upload: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
  ),
  File: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
  ),
  Check: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
  ),
  Download: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
  ),
  Loader: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
  ),
  Alert: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
  ),
  Zip: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" x2="12" y1="22.08" y2="12"/></svg>
  ),
  Eye: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
  ),
  Close: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
  )
};

export default function App() {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('idle'); // idle, processing, complete, error
  const [logs, setLogs] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [apiKey] = useState(import.meta.env.VITE_GEMINI_API_KEY || '');
  const [previewChapter, setPreviewChapter] = useState(null);
  const fileInputRef = useRef(null);

  // Close preview on Escape
  useEffect(() => {
    if (!previewChapter) return;
    const onKey = (e) => { if (e.key === 'Escape') setPreviewChapter(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [previewChapter]);

  // Load PDF libraries
  const pdfJsLoaded = useScript('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js');
  const pdfLibLoaded = useScript('https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.min.js');
  // Load JSZip for zipping files
  useScript('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js');

  const addLog = (message) => {
    setLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), message }]);
  };

  const handleFileUpload = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setStatus('idle');
      setChapters([]);
      setLogs([]);
      addLog(`File loaded: ${selectedFile.name} (${(selectedFile.size / 1024 / 1024).toFixed(2)} MB)`);
    } else {
      alert("Please upload a valid PDF file.");
    }
  };

  const processPDF = async () => {
    if (!file || !pdfJsLoaded || !pdfLibLoaded) return;

    // Use environment API key if available, otherwise rely on the empty string constant which the preview environment fills
    const effectiveApiKey = apiKey || ""; 
    
    setStatus('processing');
    addLog("Starting analysis...");

    try {
      // 1. Setup PDF.js
      const pdfjsLib = window['pdfjs-dist/build/pdf'];
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

      // We get the buffer specifically for analysis. PDF.js might transfer/detach this buffer.
      const analysisBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument(analysisBuffer);
      const pdf = await loadingTask.promise;
      
      addLog(`PDF Loaded. Total pages: ${pdf.numPages}`);

      // 2. Extract Text Summaries (First 300 chars per page to save tokens)
      addLog("Extracting text preview from pages...");
      const pageSummaries = [];
      
      // We'll batch this to avoid blocking the UI too much, though await helps
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        // Join the items, limit length
        const text = textContent.items.map(item => item.str).join(' ').slice(0, 300); // First 300 chars
        pageSummaries.push({ page: i, text });
        
        if (i % 10 === 0 || i === pdf.numPages) addLog(`Scanned ${i}/${pdf.numPages} pages...`);
      }

      // 3. Send to Gemini
      addLog("Consulting Gemini to identify chapter boundaries...");
      
      const prompt = `
        I have a book in PDF format with ${pdf.numPages} pages. 
        I need to split it into separate files for each chapter.
        Here is a list of the first 300 characters of text from every page.
        
        Your task is to identify the PAGE NUMBER where each new chapter begins.
        Look for cues like "Chapter 1", "I.", "Introduction", "Prologue", or capitalized chapter titles.
        
        Return ONLY a valid JSON object. Do not include markdown formatting.
        The JSON should look like this:
        {
          "chapters": [
            { "title": "Chapter 1", "startPage": 5 },
            { "title": "Chapter 2", "startPage": 12 }
          ]
        }

        Important rules:
        1. The first chapter usually starts after the front matter (copyright, TOC).
        2. "startPage" must be the integer page number from my list.
        3. Cover the entire book if possible, or at least the main chapters.
        4. If the book is short or has no chapters, just return one entry starting at page 1.

        Here is the page data:
        ${JSON.stringify(pageSummaries)}
      `;

      const genAI = new GoogleGenerativeAI(effectiveApiKey);
      const model = genAI.getGenerativeModel({ 
        model: "gemini-3-flash-preview",
        generationConfig: { responseMimeType: "application/json" }
      });

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      const structure = JSON.parse(responseText);
      
      addLog(`Gemini identified ${structure.chapters.length} sections.`);

      // 4. Split PDF using pdf-lib
      addLog("Splitting PDF files...");
      const { PDFDocument } = window.PDFLib;
      
      // IMPORTANT: Request a FRESH buffer. The previous one might be detached by PDF.js workers.
      const splitBuffer = await file.arrayBuffer(); 
      const srcDoc = await PDFDocument.load(splitBuffer);
      const generatedChapters = [];

      for (let i = 0; i < structure.chapters.length; i++) {
        const currentChapter = structure.chapters[i];
        const nextChapter = structure.chapters[i + 1];
        
        // Calculate page range (0-indexed for pdf-lib, but 1-indexed from human/Gemini)
        const start = currentChapter.startPage - 1; 
        const end = nextChapter ? (nextChapter.startPage - 1) : pdf.numPages;
        
        // Validations
        if (start < 0 || start >= pdf.numPages) continue;

        const pageIndices = [];
        for (let p = start; p < end; p++) {
          pageIndices.push(p);
        }

        if (pageIndices.length === 0) continue;

        // Create new doc
        const newPdf = await PDFDocument.create();
        const copiedPages = await newPdf.copyPages(srcDoc, pageIndices);
        copiedPages.forEach((page) => newPdf.addPage(page));
        
        const pdfBytes = await newPdf.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        
        generatedChapters.push({
          title: currentChapter.title,
          url,
          pageCount: pageIndices.length,
          fileName: `${currentChapter.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`
        });
        
        addLog(`Generated: ${currentChapter.title}`);
      }

      setChapters(generatedChapters);
      setStatus('complete');
      addLog("All done! Download links ready.");

    } catch (error) {
      console.error(error);
      setStatus('error');
      addLog(`Error: ${error.message}. Try refreshing or using a smaller file.`);
    }
  };

  const downloadAll = async () => {
    if (!window.JSZip) {
      addLog("Error: ZIP library not loaded.");
      return;
    }
    
    addLog("Preparing ZIP archive...");
    const zip = new window.JSZip();
    
    // Create a folder name based on the original filename
    const baseName = file ? file.name.replace(/\.pdf$/i, '') : 'book';
    const folder = zip.folder(`${baseName}_chapters`);

    try {
      // Loop through chapters, fetch blob data, and add to zip
      for (const chapter of chapters) {
        const response = await fetch(chapter.url);
        const blob = await response.blob();
        folder.file(chapter.fileName, blob);
      }

      addLog("Compressing files...");
      const content = await zip.generateAsync({ type: "blob" });
      
      // Create download link for zip
      const zipUrl = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = zipUrl;
      link.download = `${baseName}_chapters.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up object URL after a short delay
      setTimeout(() => URL.revokeObjectURL(zipUrl), 100);
      
      addLog("ZIP downloaded successfully.");
    } catch (err) {
      console.error(err);
      addLog("Error creating ZIP file: " + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#b7e7cb]/45 via-emerald-50 to-slate-100 text-slate-900 font-sans antialiased p-4 md:p-8">
      <div className="max-w-4xl mx-auto bg-white/95 shadow-xl shadow-emerald-900/10 rounded-3xl overflow-hidden border border-[#b7e7cb]/70">
        {/* Main Content */}
        <div className="p-6 md:p-8 space-y-10">
          <div className="max-w-2xl mx-auto text-center">
            <div className="flex items-center justify-center gap-3 mb-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#b7e7cb]/45 text-2xl shadow-inner shadow-emerald-900/5" aria-hidden="true">
                ✂️
              </span>
              <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-slate-900">Chapterize</h1>
            </div>
            <p className="text-sm md:text-base leading-7 text-slate-600">Upload a PDF book to identify chapter boundaries and export each chapter as a separate file.</p>
          </div>
          
          {/* Upload Section */}
          <div className="space-y-4">
            <div 
              onClick={() => fileInputRef.current?.click()}
              className={`rounded-3xl p-7 md:p-9 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 border shadow-sm
                ${file ? 'border-[#b7e7cb] bg-[#b7e7cb]/35 shadow-emerald-900/5' : 'border-slate-200 bg-white hover:border-[#b7e7cb] hover:bg-[#b7e7cb]/20 hover:shadow-md hover:shadow-emerald-900/5'}
              `}
            >
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileUpload} 
                accept="application/pdf"
                className="hidden" 
              />
              
              {file ? (
                <div className="text-center">
                  <div className="w-14 h-14 bg-white text-[#2f7d5a] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                    <Icons.File />
                  </div>
                  <p className="font-semibold text-base text-slate-800">Ready to split</p>
                  <p className="mt-1 text-sm text-slate-600">{file.name}</p>
                  <p className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  <button onClick={(e) => {e.stopPropagation(); setFile(null); setChapters([]);}} className="mt-4 text-sm text-[#2f7d5a] hover:underline">Remove</button>
                </div>
              ) : (
                <div className="text-center text-slate-400">
                  <div className="w-14 h-14 bg-[#b7e7cb]/45 text-[#2f7d5a] rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Icons.Upload />
                  </div>
                  <p className="font-semibold text-lg text-slate-800">Drop a PDF book here to begin</p>
                  <p className="text-sm mt-1 leading-6 text-slate-500">or click to browse your files</p>
                  <p className="mt-3 text-xs font-medium uppercase tracking-wide text-slate-400">PDF files only</p>
                </div>
              )}
            </div>

            <p className="text-center text-xs md:text-sm leading-6 text-slate-500">
              PDF splitting happens locally in your browser. Only short page text snippets are sent to Gemini for chapter detection.
            </p>

            <div className="grid grid-cols-3 gap-3 text-center">
              {['Upload', 'Detect', 'Export'].map((step, index) => (
                <div key={step} className="rounded-2xl border border-slate-200 bg-white/70 px-3 py-3">
                  <span className="mx-auto mb-2 flex h-6 w-6 items-center justify-center rounded-full bg-[#b7e7cb]/45 text-xs font-semibold text-[#2f7d5a]">
                    {index + 1}
                  </span>
                  <p className="text-xs font-medium text-slate-600">{step}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 2. Action Section */}
          {file && status !== 'complete' && (
            <div className="flex flex-col items-center justify-center">
               {status === 'processing' ? (
                 <button disabled className="bg-slate-800 text-white px-7 py-3 rounded-xl text-sm font-medium flex items-center gap-3 cursor-not-allowed opacity-80">
                   <Icons.Loader />
                   Processing Book...
                 </button>
               ) : (
                 <button onClick={processPDF} className="bg-[#2f7d5a] hover:bg-[#286b4d] text-white px-7 py-3 rounded-xl text-sm font-medium shadow-md shadow-emerald-900/20 hover:shadow-lg hover:shadow-emerald-900/25 transition-all flex items-center gap-2">
                   <span>Split into Chapters</span>
                 </button>
               )}
               {status === 'error' && (
                 <p className="text-sm text-red-600 mt-3 flex items-center gap-2"><Icons.Alert /> process failed. Check logs below.</p>
               )}
            </div>
          )}

          {/* 3. Results Section */}
          {status === 'complete' && chapters.length > 0 && (
             <div className="space-y-4 animate-fade-in">
              <h2 className="text-lg font-semibold flex items-center gap-3 text-slate-800">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-[#b7e7cb]/45 text-[#2f7d5a] text-xs font-semibold border border-[#b7e7cb]"><Icons.Check /></span>
                Chapters Ready ({chapters.length})
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {chapters.map((chapter, idx) => (
                  <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-4 hover:shadow-md hover:shadow-emerald-900/10 transition-shadow flex items-center justify-between group">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="bg-[#b7e7cb]/35 text-slate-700 p-2 rounded-lg flex-shrink-0">
                        <Icons.File />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-medium text-slate-800 truncate" title={chapter.title}>{chapter.title}</h3>
                        <p className="text-xs text-slate-500">{chapter.pageCount} pages</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => setPreviewChapter(chapter)}
                        className="bg-[#b7e7cb]/35 text-slate-600 hover:bg-[#2f7d5a] hover:text-white p-2 rounded-xl transition-colors"
                        title="Preview Chapter"
                      >
                        <Icons.Eye />
                      </button>
                      <a
                        href={chapter.url}
                        download={chapter.fileName}
                        className="bg-[#b7e7cb]/35 text-slate-600 hover:bg-[#2f7d5a] hover:text-white p-2 rounded-xl transition-colors"
                        title="Download Chapter"
                      >
                        <Icons.Download />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="flex flex-col md:flex-row gap-3 justify-center pt-4">
                <button 
                  onClick={downloadAll}
                  className="bg-[#2f7d5a] hover:bg-[#286b4d] text-white px-7 py-3 rounded-xl text-sm font-medium shadow-md shadow-emerald-900/20 hover:shadow-lg hover:shadow-emerald-900/25 transition-all flex items-center justify-center gap-2"
                >
                  <Icons.Zip /> Download All (ZIP)
                </button>
                <button 
                  onClick={() => { setFile(null); setChapters([]); setStatus('idle'); }}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 px-7 py-3 rounded-xl text-sm font-medium transition-all shadow-sm hover:shadow-md"
                >
                  Process Another Book
                </button>
              </div>
             </div>
          )}

          {/* 4. Console/Logs */}
          {logs.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 font-mono text-xs text-slate-600">
              <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-200 text-slate-400">
                <span className="uppercase tracking-wider font-semibold">Activity Log</span>
                <span>{status === 'processing' ? 'Running...' : 'Ready'}</span>
              </div>
              <div className="max-h-32 overflow-y-auto">
                {logs.map((log, i) => (
                  <div key={i} className="mb-1">
                    <span className="text-slate-400 mr-2">[{log.time}]</span>
                    <span className={log.message.includes('Error') ? 'text-red-600' : 'text-slate-600'}>{log.message}</span>
                  </div>
                ))}
                <div ref={(el) => el?.scrollIntoView({ behavior: 'smooth' })} />
              </div>
            </div>
          )}

        </div>
      </div>

      {/* PDF Preview Modal */}
      {previewChapter && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setPreviewChapter(null)}
        >
          <div
            className="bg-white rounded-3xl shadow-xl shadow-slate-950/25 w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 md:p-5 border-b border-[#b7e7cb] bg-[#b7e7cb]/25">
              <div className="min-w-0">
                <h3 className="font-semibold text-slate-800 truncate" title={previewChapter.title}>
                  {previewChapter.title}
                </h3>
                <p className="text-xs text-slate-500">{previewChapter.pageCount} pages</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                <a
                  href={previewChapter.url}
                  download={previewChapter.fileName}
                  className="bg-[#2f7d5a] hover:bg-[#286b4d] text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition-colors"
                >
                  <Icons.Download />
                  <span className="hidden sm:inline">Download</span>
                </a>
                <button
                  onClick={() => setPreviewChapter(null)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-600 p-2 rounded-xl transition-colors"
                  title="Close (Esc)"
                >
                  <Icons.Close />
                </button>
              </div>
            </div>
            <iframe
              src={previewChapter.url}
              title={previewChapter.title}
              className="flex-1 w-full bg-slate-100"
            />
          </div>
        </div>
      )}
    </div>
  );
}