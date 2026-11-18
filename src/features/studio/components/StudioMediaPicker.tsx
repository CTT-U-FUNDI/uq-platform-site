import { Icon } from '../../../components/ui/Icon';
import { useRef, useState } from 'react';

interface Props {
  photos: string[];          // max 5 dataURL
  video?: string | null;     // dataURL video <= 30s
  onChange: (photos: string[], video: string | null) => void;
}

const MAX_PHOTOS = 5;
const MAX_VIDEO_SEC = 30;

/** Studio solo : jusqu'a 5 photos + 1 video de 30s max, avec bouton "enregistrer". */
export function StudioMediaPicker({ photos, video, onChange }: Props) {
  const photoInput = useRef<HTMLInputElement>(null);
  const [recording, setRecording] = useState(false);
  const [recSeconds, setRecSeconds] = useState(0);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);

  const addFiles = async (files: FileList | null) => {
    if (!files) return;
    const restantes = MAX_PHOTOS - photos.length;
    const pris = Array.from(files).slice(0, restantes).filter((f) => f.type.startsWith('image/'));
    const lus = await Promise.all(
      pris.map(
        (f) =>
          new Promise<string>((res) => {
            const r = new FileReader();
            r.onload = () => res(r.result as string);
            r.readAsDataURL(f);
          }),
      ),
    );
    if (lus.length) onChange([...photos, ...lus].slice(0, MAX_PHOTOS), video || null);
  };

  const removePhoto = (i: number) => onChange(photos.filter((_, j) => j !== i), video || null);
  const removeVideo = () => onChange(photos, null);

  const startRecord = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      const rec = new MediaRecorder(stream);
      chunksRef.current = [];
      rec.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data);
      rec.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        const r = new FileReader();
        r.onload = () => onChange(photos, r.result as string);
        r.readAsDataURL(blob);
        stream.getTracks().forEach((t) => t.stop());
        clearInterval(timerRef.current);
        setRecording(false);
        setRecSeconds(0);
      };
      rec.start();
      recorderRef.current = rec;
      setRecording(true);
      setRecSeconds(0);
      timerRef.current = setInterval(() => {
        setRecSeconds((s) => {
          if (s + 1 >= MAX_VIDEO_SEC) stopRecord();
          return s + 1;
        });
      }, 1000);
    } catch {
      alert('Camera indisponible — autorise la camera pour enregistrer.');
    }
  };

  const stopRecord = () => recorderRef.current?.state !== 'inactive' && recorderRef.current?.stop();

  return (
    <div className="space-y-3">
      {/* Grille photos */}
      <div className="grid grid-cols-3 gap-2">
        {photos.map((p, i) => (
          <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-black">
            <img src={p} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
            <button
              onClick={() => removePhoto(i)}
              className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/70 text-white text-xs"
            >✕</button>
            <span className="absolute bottom-1 left-1 text-[9px] bg-black/60 text-white px-1 rounded">{i + 1}</span>
          </div>
        ))}
        {photos.length < MAX_PHOTOS && (
          <button
            onClick={() => photoInput.current?.click()}
            className="aspect-square rounded-xl border-2 border-dashed border-white/20 flex flex-col items-center justify-center text-gray-400 active:scale-95"
          >
            <Icon name="camera" size={22} />
            <span className="text-[10px] mt-1">Photo {photos.length + 1}/5</span>
          </button>
        )}
      </div>

      {/* Video */}
      {video ? (
        <div className="relative rounded-xl overflow-hidden bg-black">
          <video src={video} controls className="w-full max-h-48 object-cover" />
          <button onClick={removeVideo} className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/70 text-white">✕</button>
          <span className="absolute bottom-2 left-2 text-[10px] bg-black/60 text-white px-2 py-0.5 rounded-full">Vidéo ≤30s</span>
        </div>
      ) : (
        <button
          onClick={recording ? stopRecord : startRecord}
          className={`w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
            recording ? 'bg-red-500 text-white animate-pulse' : 'bg-white/10 border border-white/20 text-white'
          }`}
        >
          {recording ? (
            <>⏹ Arrêter ({MAX_VIDEO_SEC - recSeconds}s)</>
          ) : (
            <>🎥 Enregistrer une vidéo (30s max)</>
          )}
        </button>
      )}

      <input
        ref={photoInput}
        type="file"
        accept="image/*"
        multiple
        capture="environment"
        className="hidden"
        onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }}
      />
      <p className="text-[10px] text-gray-500 text-center">
        {photos.length}/5 photos{video ? ' + vidéo' : ''} — la vidéo est limitée à {MAX_VIDEO_SEC}s
      </p>
    </div>
  );
}
