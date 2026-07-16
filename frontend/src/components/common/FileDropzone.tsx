import { useRef, useState, type DragEvent } from 'react';
import { UploadCloud, FileText, X } from 'lucide-react';

interface Props {
  onFileSelect: (file: File | null) => void;
  accept?: string;
  label?: string;
  hint?: string;
  currentFileName?: string;
}

export default function FileDropzone({ onFileSelect, accept, label = 'Upload a file', hint, currentFileName }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(currentFileName || null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = (file: File | null) => {
    setFileName(file ? file.name : null);
    onFileSelect(file);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0] || null;
    if (file) handleFile(file);
  };

  return (
    <div>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors ${
          isDragging ? 'border-primary-400 bg-primary-50' : 'border-slate-300 hover:border-primary-300 hover:bg-slate-50'
        }`}
      >
        {fileName ? (
          <div className="flex items-center gap-2 rounded-lg bg-primary-50 px-3 py-2 text-sm text-primary-700">
            <FileText size={16} />
            <span className="max-w-[220px] truncate">{fileName}</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleFile(null);
                if (inputRef.current) inputRef.current.value = '';
              }}
              className="text-primary-400 hover:text-primary-700"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <>
            <UploadCloud size={28} className="mb-2 text-slate-400" />
            <p className="text-sm font-medium text-slate-600">{label}</p>
            {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0] || null)}
        />
      </div>
    </div>
  );
}
