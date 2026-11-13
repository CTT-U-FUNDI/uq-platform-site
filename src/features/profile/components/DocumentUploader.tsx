import { Icon } from '../../../components/ui/Icon';
﻿import React, { useState, useRef } from 'react';

export type DocumentType = 'identity' | 'selfie' | 'mobile_money' | 'address';

interface DocumentUploaderProps {
  type: DocumentType;
  onUpload: (file: File, base64: string) => void;
  label: string;
  description: string;
  icon?: string;
  accept?: string;
}

export const DocumentUploader: React.FC<DocumentUploaderProps> = ({
  type,
  onUpload,
  label,
  description,
  icon = '📄',
  accept = 'image/*',
}) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setUploading(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setPreview(base64);
      setFileName(file.name);
      onUpload(file, base64);
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div className="bg-[var(--uq-card)] border border-[var(--uq-border)] rounded-2xl p-5">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-[#8B5CF6]/15 flex items-center justify-center text-xl">
          {icon}
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-bold text-[var(--uq-text)]">{label}</h4>
          <p className="text-[11px] text-[var(--uq-text-secondary)]">{description}</p>
        </div>
        {preview && (
          <div className="w-6 h-6 rounded-full bg-[#0ECB81] flex items-center justify-center text-xs text-black font-bold">
            <Icon name="check" size={14} tone="success" />
          </div>
        )}
      </div>

      {/* Preview ou Zone d'upload */}
      {preview ? (
        <div className="relative">
          <img
            src={preview}
            alt={label}
            className="w-full h-40 object-cover rounded-xl border border-[var(--uq-border)]"
          />
          <div className="absolute bottom-2 left-2 right-2 bg-black/70 backdrop-blur px-3 py-2 rounded-lg flex items-center justify-between">
            <span className="text-[10px] text-white truncate">{fileName}</span>
            <button
              onClick={() => {
                setPreview(null);
                setFileName('');
              }}
              className="text-[#F6465D] text-xs font-bold hover:text-white"
            >
              Supprimer
            </button>
          </div>
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-[var(--uq-border)] hover:border-[#8B5CF6] rounded-xl p-6 text-center cursor-pointer transition-colors"
        >
          {uploading ? (
            <div className="text-sm text-[var(--uq-text-secondary)]">Chargement...</div>
          ) : (
            <>
              <div className="text-3xl mb-2"><Icon name="camera" size={28} /></div>
              <p className="text-xs text-[var(--uq-text)] font-medium mb-1">
                Clique ou glisse ton fichier
              </p>
              <p className="text-[10px] text-[var(--uq-text-muted)]">
                JPG, PNG · Max 5 Mo
              </p>
            </>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        className="hidden"
      />
    </div>
  );
};

export default DocumentUploader;
