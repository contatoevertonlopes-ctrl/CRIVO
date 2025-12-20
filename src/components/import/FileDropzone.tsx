import { useCallback } from "react";
import { Upload, FileSpreadsheet, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileDropzoneProps {
  onFileSelect: (file: File) => void;
  fileName: string | null;
  onClear: () => void;
  isProcessing: boolean;
}

const FileDropzone = ({ onFileSelect, fileName, onClear, isProcessing }: FileDropzoneProps) => {
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      const ext = file.name.toLowerCase();
      if (ext.endsWith(".csv") || ext.endsWith(".xlsx") || ext.endsWith(".xls") || ext.endsWith(".ofx") || ext.endsWith(".qfx")) {
        onFileSelect(file);
      }
    }
  }, [onFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFileSelect(file);
  }, [onFileSelect]);

  if (fileName) {
    return (
      <div className="relative p-4 rounded-xl border-2 border-primary/50 bg-primary/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-sm">{fileName}</p>
              <p className="text-xs text-muted-foreground">
                {isProcessing ? "Processando..." : "Arquivo carregado"}
              </p>
            </div>
          </div>
          {!isProcessing && (
            <button
              onClick={onClear}
              className="p-2 rounded-lg hover:bg-destructive/10 transition-colors"
            >
              <X className="w-4 h-4 text-muted-foreground hover:text-destructive" />
            </button>
          )}
        </div>
        {isProcessing && (
          <div className="mt-3">
            <div className="h-1 bg-primary/20 rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full animate-pulse" style={{ width: "60%" }} />
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      className={cn(
        "relative p-8 rounded-xl border-2 border-dashed transition-all duration-200",
        "border-border hover:border-primary/50 hover:bg-primary/5",
        "cursor-pointer group"
      )}
    >
      <input
        type="file"
        accept=".csv,.xlsx,.xls,.ofx,.qfx"
        onChange={handleFileInput}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      />
      
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
          <Upload className="w-7 h-7 text-primary" />
        </div>
        <div>
          <p className="font-medium text-sm">
            Arraste seu extrato aqui
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            ou clique para selecionar
          </p>
        </div>
        <div className="flex gap-2 mt-2">
          <span className="px-2 py-1 rounded-md bg-muted text-[10px] font-medium">CSV</span>
          <span className="px-2 py-1 rounded-md bg-muted text-[10px] font-medium">XLSX</span>
          <span className="px-2 py-1 rounded-md bg-muted text-[10px] font-medium">OFX</span>
        </div>
      </div>
    </div>
  );
};

export default FileDropzone;
