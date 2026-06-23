import React, { useRef, useState } from 'react';
import { UploadCloud, File, AlertCircle } from 'lucide-react';

interface FileUploaderProps {
  onFilesChange: (files: File[]) => void;
  maxFiles?: number;
}

export const FileUploader: React.FC<FileUploaderProps> = ({ onFilesChange, maxFiles = 5 }) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const maxFileSizeBytes = 10 * 1024 * 1024; // 10MB
  const allowedExtensions = ['pdf', 'docx', 'doc', 'xlsx', 'xls', 'jpg', 'jpeg', 'png', 'gif', 'txt'];

  const validateAndAddFiles = (files: FileList) => {
    setErrorMsg(null);
    const newFiles: File[] = [];
    let hasInvalidSize = false;
    let hasInvalidExt = false;

    // Verificar se ultrapassa o limite total de arquivos
    if (selectedFiles.length + files.length > maxFiles) {
      setErrorMsg(`Você pode enviar no máximo ${maxFiles} arquivos.`);
      return;
    }

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      
      if (file.size > maxFileSizeBytes) {
        hasInvalidSize = true;
      } else if (!allowedExtensions.includes(ext)) {
        hasInvalidExt = true;
      } else {
        newFiles.push(file);
      }
    }

    if (hasInvalidSize) {
      setErrorMsg('Um ou mais arquivos excedem o limite individual de 10MB.');
    } else if (hasInvalidExt) {
      setErrorMsg('Formato de arquivo não permitido. Extensões aceitas: PDF, Word, Excel, Imagens e Texto.');
    }

    if (newFiles.length > 0) {
      const updatedList = [...selectedFiles, ...newFiles];
      setSelectedFiles(updatedList);
      onFilesChange(updatedList);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files) {
      validateAndAddFiles(e.dataTransfer.files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      validateAndAddFiles(e.target.files);
    }
  };

  const removeFile = (indexToRemove: number) => {
    const updatedList = selectedFiles.filter((_, idx) => idx !== indexToRemove);
    setSelectedFiles(updatedList);
    onFilesChange(updatedList);
    setErrorMsg(null);
  };

  return (
    <div className="space-y-3">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`upload-dropzone p-6 rounded-xl flex flex-col items-center justify-center text-center cursor-pointer bg-slate-900/30 ${
          isDragOver ? 'dragover' : ''
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          multiple
          className="hidden"
        />
        <UploadCloud className="h-10 w-10 text-amber-500/80 mb-2" />
        <span className="text-sm font-semibold text-slate-200">
          Clique para selecionar ou arraste arquivos aqui
        </span>
        <span className="text-xs text-slate-500 mt-1">
          Formatos aceitos: PDF, Word, Excel, Imagens e TXT (Máx: {maxFiles} arquivos de 10MB cada)
        </span>
      </div>

      {errorMsg && (
        <div className="p-3 rounded-lg bg-red-950/40 border border-red-700/50 text-red-200 text-xs flex items-center space-x-2">
          <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">
            Arquivos selecionados ({selectedFiles.length}/{maxFiles})
          </span>
          <div className="grid grid-cols-1 gap-2">
            {selectedFiles.map((file, idx) => (
              <div
                key={idx}
                className="flex justify-between items-center p-2 rounded bg-slate-800/80 border border-slate-700/50 text-sm"
              >
                <div className="flex items-center space-x-2 min-w-0">
                  <File className="h-4 w-4 text-slate-400 flex-shrink-0" />
                  <span className="truncate max-w-[200px] font-medium text-slate-200">
                    {file.name}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(idx);
                  }}
                  className="text-xs text-red-400 hover:text-red-300 font-bold px-2 py-1 hover:bg-slate-700/40 rounded transition-colors"
                >
                  Remover
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
