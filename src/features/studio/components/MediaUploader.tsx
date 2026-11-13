import { Icon } from '../../../components/ui/Icon';
﻿import { useState, useRef } from 'react';

interface MediaUploaderProps {
  onUpload: (url: string, type: 'image' | 'video') => void;
  currentUrl?: string;
}

export function MediaUploader({ onUpload, currentUrl }: MediaUploaderProps) {
  const [preview, setPreview] = useState<string | null>(currentUrl || null);
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    // Détecter le type
    const isVideo = file.type.startsWith('video/');
    setMediaType(isVideo ? 'video' : 'image');

    // Lire le fichier en base64 (pour l'aperçu et le stockage local)
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setPreview(dataUrl);
      onUpload(dataUrl, isVideo ? 'video' : 'image');
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemove = () => {
    setPreview(null);
    onUpload('', 'image');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="w-full">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {preview ? (
        <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-black animate-scale-in">
          {mediaType === 'video' ? (
            <video
              src={preview}
              controls
              className="w-full h-full object-cover"
            />
          ) : (
            <img
              src={preview}
              alt="Aperçu"
              className="w-full h-full object-cover"
            />
          )}

          {/* Bouton supprimer */}
          <button
            onClick={handleRemove}
            className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/70 backdrop-blur-md flex items-center justify-center text-white text-lg active:scale-90 transition-all"
          >
            <Icon name="x" size={20} />
          </button>

          {/* Badge type */}
          <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-black/70 backdrop-blur-md">
            <span className="text-white text-xs font-semibold">
              {mediaType === 'video' ? '🎥 Vidéo' : '📸 Photo'}
            </span>
          </div>
        </div>
      ) : (
        <button
          onClick={handleClick}
          disabled={uploading}
          className="w-full aspect-square bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-2 border-dashed border-white/20 rounded-2xl flex flex-col items-center justify-center text-gray-400 active:scale-[0.98] transition-all hover:border-purple-500/50 group"
        >
          {uploading ? (
            <>
              <div className="w-10 h-10 rounded-full border-2 border-purple-500 border-t-transparent animate-spin mb-3" />
              <span className="text-sm">Traitement...</span>
            </>
          ) : (
            <>
              <div className="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <span className="text-3xl"><Icon name="camera" size={28} /></span>
              </div>
              <span className="text-sm font-semibold text-white">
                Ajouter une photo ou vidéo
              </span>
              <span className="text-xs mt-2 text-gray-500">
                JPG, PNG, MP4 — Max 10 Mo
              </span>
            </>
          )}
        </button>
      )}
    </div>
  );
}
