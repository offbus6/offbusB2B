import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  maxSize?: number;
  className?: string;
}

export default function FileUpload({ 
  onFileSelect, 
  accept = ".csv,.xlsx,.xls",
  maxSize = 5 * 1024 * 1024, // 5MB
  className = ""
}: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFile = useCallback((file: File) => {
    if (file.size > maxSize) {
      alert(`File size must be less than ${maxSize / (1024 * 1024)}MB`);
      return;
    }
    
    setSelectedFile(file);
    onFileSelect(file);
  }, [maxSize, onFileSelect]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, [handleFile]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  }, [handleFile]);

  const removeFile = () => {
    setSelectedFile(null);
  };

  return (
    <div className={cn("w-full", className)}>
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-6 text-center transition-colors",
          dragActive 
            ? "border-[var(--airbnb-primary)] bg-red-50" 
            : "border-[var(--airbnb-border)]"
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {selectedFile ? (
          <div className="flex items-center justify-center space-x-4">
            <FileText className="w-8 h-8 text-[var(--airbnb-teal)]" />
            <div className="flex-1 text-left">
              <p className="text-[var(--airbnb-dark)] font-medium">{selectedFile.name}</p>
              <p className="text-[var(--airbnb-gray)] text-sm">
                {(selectedFile.size / 1024).toFixed(1)} KB
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={removeFile}
              className="text-red-500 hover:text-red-700"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <>
            <Upload className="w-12 h-12 text-[var(--airbnb-gray)] mx-auto mb-4" />
            <p className="text-[var(--airbnb-dark)] font-medium mb-2">
              Drag & drop your CSV/Excel file here
            </p>
            <p className="text-[var(--airbnb-gray)] text-sm mb-4">
              or click to browse files
            </p>
            <input
              type="file"
              accept={accept}
              onChange={handleChange}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload">
              <Button
                type="button"
                className="bg-[var(--airbnb-primary)] hover:bg-[var(--airbnb-primary)]/90 text-white"
              >
                Choose File
              </Button>
            </label>
          </>
        )}
      </div>
    </div>
  );
}
