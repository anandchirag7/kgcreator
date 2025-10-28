
import React, { useState, useCallback } from 'react';
import { FileUpload } from './components/FileUpload';
import { ResultsDisplay } from './components/ResultsDisplay';
import { GraphData, AppState, STATUS } from './types';
import { extractKnowledgeGraph } from './services/geminiService';
import { generateCypherQuery } from './utils/cypherGenerator';

// Define helper components within the same file but outside the main component
const Header: React.FC = () => (
  <header className="bg-slate-800 text-white p-4 shadow-md">
    <div className="container mx-auto flex items-center gap-4">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a10 10 0 1 0 10 10" />
        <path d="M12 2a10 10 0 0 0-10 10" />
        <path d="M12 12a5 5 0 1 0 5 5" />
        <path d="M12 12a5 5 0 0 0-5 5" />
        <path d="M2 12h5" />
        <path d="M17 12h5" />
        <path d="M12 2v5" />
        <path d="M12 17v5" />
      </svg>
      <h1 className="text-2xl font-bold tracking-tight">Knowledge Graph Extractor</h1>
    </div>
  </header>
);

const Footer: React.FC = () => (
  <footer className="bg-slate-800 text-slate-400 text-center p-4 mt-auto">
    <p>Powered by Gemini API</p>
  </footer>
);

const Loader: React.FC<{ message: string }> = ({ message }) => (
    <div className="flex flex-col items-center justify-center text-center p-8 bg-slate-700/50 rounded-lg shadow-lg">
        <svg className="animate-spin h-12 w-12 text-cyan-400 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="text-xl font-semibold text-white">{message}</p>
        <p className="text-slate-300 mt-2">Please wait while the knowledge graph is being generated...</p>
    </div>
);


export default function App() {
  const [appState, setAppState] = useState<AppState>({
    status: STATUS.IDLE,
    graphData: null,
    cypherQuery: '',
    error: null,
  });

  const handleFileUpload = useCallback(async (files: File[]) => {
    if (files.length === 0) return;

    setAppState({ status: STATUS.LOADING, graphData: null, cypherQuery: '', error: null });

    try {
      const graphData = await extractKnowledgeGraph(files);
      if (graphData.nodes.length === 0 && graphData.relationships.length === 0) {
        setAppState({
            status: STATUS.ERROR,
            graphData: null,
            cypherQuery: '',
            error: "The model couldn't extract any entities or relationships. Please try a different document or check the document quality."
        });
        return;
      }
      const cypherQuery = generateCypherQuery(graphData);
      setAppState({ status: STATUS.SUCCESS, graphData, cypherQuery, error: null });
    } catch (error) {
      console.error("Error extracting knowledge graph:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      setAppState({ status: STATUS.ERROR, graphData: null, cypherQuery: '', error: `Failed to generate graph. ${errorMessage}` });
    }
  }, []);

  const handleReset = () => {
    setAppState({ status: STATUS.IDLE, graphData: null, cypherQuery: '', error: null });
  };
  
  return (
    <div className="flex flex-col min-h-screen bg-slate-900 text-slate-200 font-sans">
      <Header />
      <main className="container mx-auto p-4 md:p-8 flex-grow">
        {appState.status === STATUS.IDLE && (
          <FileUpload onUpload={handleFileUpload} />
        )}
        {appState.status === STATUS.LOADING && (
          <div className="flex justify-center items-center h-full">
            <Loader message="Analyzing Document..." />
          </div>
        )}
        {appState.status === STATUS.ERROR && (
           <div className="text-center p-8 bg-red-900/20 border border-red-500 rounded-lg">
             <h2 className="text-2xl text-red-400 font-bold mb-4">An Error Occurred</h2>
             <p className="text-slate-300 mb-6">{appState.error}</p>
             <button
                onClick={handleReset}
                className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-6 rounded-lg transition-colors duration-300"
              >
                Try Again
              </button>
           </div>
        )}
        {appState.status === STATUS.SUCCESS && appState.graphData && (
          <ResultsDisplay 
            graphData={appState.graphData} 
            cypherQuery={appState.cypherQuery}
            onReset={handleReset}
          />
        )}
      </main>
      <Footer />
    </div>
  );
}
