import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

interface FileUploadProps {
  onUpload: (files: File[]) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onUpload }) => {
  const [files, setFiles] = useState<File[]>([]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(prevFiles => [...prevFiles, ...acceptedFiles].filter((file, index, self) => 
      index === self.findIndex((f) => f.name === file.name && f.size === file.size)
    ));
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': [],
      'image/png': [],
      'image/webp': [],
      'text/plain': [],
    },
  });

  const removeFile = (fileToRemove: File) => {
    setFiles(files.filter(file => file !== fileToRemove));
  };
  
  const handleUploadClick = () => {
    if (files.length > 0) {
      onUpload(files);
    }
  };

  return (
    <div className="bg-slate-800 p-8 rounded-lg shadow-xl text-center">
      <h2 className="text-3xl font-bold mb-4 text-white">Upload Your Document</h2>
      <p className="text-slate-400 mb-8">
        Upload pages of your technical document as images (PNG, JPG) or text files. <br /> For multi-page PDFs, please export each page as an image.
      </p>

      <div {...getRootProps()} className={`border-4 border-dashed rounded-lg p-12 cursor-pointer transition-colors duration-300 ${isDragActive ? 'border-cyan-400 bg-slate-700/50' : 'border-slate-600 hover:border-cyan-500'}`}>
        <input {...getInputProps()} />
        <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-16 w-16 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        {isDragActive ? (
          <p className="mt-4 text-xl text-cyan-300">Drop the files here...</p>
        ) : (
          <p className="mt-4 text-xl text-slate-300">Drag & drop files here, or click to select files</p>
        )}
      </div>

      {files.length > 0 && (
        <div className="mt-8 text-left max-h-60 overflow-y-auto pr-2">
            <h3 className="text-lg font-semibold text-slate-200 mb-4">Selected Files:</h3>
            <ul className="space-y-2">
                {files.map((file, index) => (
                    <li key={index} className="flex items-center justify-between bg-slate-700 p-3 rounded-md animate-fade-in">
                        <span className="text-slate-300 truncate">{file.name} ({Math.round(file.size / 1024)} KB)</span>
                        <button onClick={() => removeFile(file)} className="ml-4 text-red-400 hover:text-red-300 font-bold text-2xl leading-none">&times;</button>
                    </li>
                ))}
            </ul>
        </div>
      )}

      <div className="mt-8">
        <button
          onClick={handleUploadClick}
          disabled={files.length === 0}
          className="w-full md:w-auto bg-cyan-600 text-white font-bold py-3 px-8 rounded-lg transition-all duration-300 disabled:bg-slate-600 disabled:cursor-not-allowed hover:bg-cyan-500 hover:shadow-lg hover:shadow-cyan-500/20"
        >
          Extract Knowledge Graph
        </button>
      </div>
    </div>
  );
};
