import { Icon } from '../../../components/ui/Icon';
import { useState, useRef } from 'react';

interface MediaUploaderProps {
  onUpload: (url: string, type: 'image' | 'video') => void;
  currentUrl?: string;
}

export function MediaUploader({ onUpload, currentUrl }: MediaUploaderProps) {
  const [preview, setPreview] = useState<string | null>(currentUrl || null);
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [uploading, setUploading] = useState(false);
  // Photo/vidéo candidate en attente de confirmation (on ne l'envoie pas sans validation)
  const [pending, setPending] = useState<{ url: string; type: 'image' | 'video' } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    const isVideo = file.type.startsWith('video/');
    const type = isVideo ? 'video' : 'image';

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      // On montre l'aperçu et on ATTEND la confirmation — rien n'est envoyé.
      setPending({ url: dataUrl, type });
      setMediaType(type);
      setPreview(dataUrl);
      setUploading(false);
      // reset l'input pour pouvoir re-choisir le même fichier
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.onerror = () => setUploading(false);
    reader.readAsDataURL(file);
  };

  const confirmer = () => {
    if (!pending) return;
    onUpload(pending.url, pending.type);
    setPending(null);
  };

  const reprendre = () => {
    setPending(null);
    setPreview(currentUrl || null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemove = () => {
    setPreview(null);
    setPending(null);
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

          {/* Badge type */}
          <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-black/70 backdrop-blur-md">
            <span className="text-white text-xs font-semibold">
              {mediaType === 'video' ? '🎥 Vidéo' : '📸 Photo'}
            </span>
          </div>

          {pending ? (
            <>
              {/* En attente de confirmation : on voit la photo avant envoi */}
              <div className="absolute bottom-3 left-3 right-3 flex gap-2">
                <button
                  onClick={reprendre}
                  className="flex-1 py-2.5 rounded-xl bg-black/70 backdrop-blur-md border border-white/20 text-white text-sm font-semibold active:scale-95 transition-all"
                >
                  Reprendre
                </button>
                <button
                  onClick={confirmer}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-bold active:scale-95 transition-all"
                >
                  Confirmer
                </button>
              </div>
            </>
          ) : (
            <>
              <button
                onClick={handleRemove}
                className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/70 backdrop-blur-md flex items-center justify-center text-white text-lg active:scale-90 transition-all"
              >
                <Icon name="x" size={20} />
              </button>
              <button
                onClick={handleClick}
                className="absolute bottom-3 left-3 px-3 py-1.5 rounded-full bg-black/70 backdrop-blur-md text-white text-xs font-semibold active:scale-95"
              >
                Changer
              </button>
            </>
          )}
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
