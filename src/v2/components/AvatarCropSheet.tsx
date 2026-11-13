import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { Button, Sheet } from './Ui';
import { Icon } from './Icon';

interface CropPosition {
  x: number;
  y: number;
  zoom: number;
}

interface ImageSize {
  width: number;
  height: number;
}

interface AvatarCropSheetProps {
  file: File | null;
  busy?: boolean;
  onClose: () => void;
  onConfirm: (file: File) => Promise<void>;
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

function clampPosition(position: CropPosition, image: ImageSize, side: number): CropPosition {
  const scale = Math.max(side / image.width, side / image.height) * position.zoom;
  const renderedWidth = image.width * scale;
  const renderedHeight = image.height * scale;

  return {
    ...position,
    x: clamp(position.x, (side - renderedWidth) / 2, (renderedWidth - side) / 2),
    y: clamp(position.y, (side - renderedHeight) / 2, (renderedHeight - side) / 2),
  };
}

export function AvatarCropSheet({
  file,
  busy = false,
  onClose,
  onConfirm,
}: AvatarCropSheetProps) {
  const [source, setSource] = useState('');
  const [imageSize, setImageSize] = useState<ImageSize | null>(null);
  const [position, setPosition] = useState<CropPosition>({ x: 0, y: 0, zoom: 1 });
  const [error, setError] = useState('');
  const imageRef = useRef<HTMLImageElement>(null);
  const cropRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    x: number;
    y: number;
  } | null>(null);

  useEffect(() => {
    if (!file) {
      setSource('');
      setImageSize(null);
      setError('');
      return;
    }

    const url = URL.createObjectURL(file);
    setSource(url);
    setImageSize(null);
    setPosition({ x: 0, y: 0, zoom: 1 });
    setError('');
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const close = () => {
    if (!busy) onClose();
  };

  const confirmCrop = async () => {
    const image = imageRef.current;
    const crop = cropRef.current;
    if (!image || !imageSize || !crop) return;

    const side = crop.getBoundingClientRect().width;
    const scale = Math.max(side / imageSize.width, side / imageSize.height) * position.zoom;
    const sourceSide = side / scale;
    const sourceX = clamp(
      imageSize.width / 2 - position.x / scale - sourceSide / 2,
      0,
      imageSize.width - sourceSide,
    );
    const sourceY = clamp(
      imageSize.height / 2 - position.y / scale - sourceSide / 2,
      0,
      imageSize.height - sourceSide,
    );
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const context = canvas.getContext('2d');
    if (!context) {
      setError('Le recadrage est indisponible sur cet appareil.');
      return;
    }

    context.drawImage(image, sourceX, sourceY, sourceSide, sourceSide, 0, 0, 512, 512);

    try {
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (result) => (result ? resolve(result) : reject(new Error('Création de la photo impossible.'))),
          'image/webp',
          0.92,
        );
      });
      await onConfirm(new File([blob], 'photo-profil.webp', { type: blob.type }));
    } catch (cropError) {
      setError(cropError instanceof Error ? cropError.message : 'Création de la photo impossible.');
    }
  };

  const moveCrop = (event: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    const side = cropRef.current?.getBoundingClientRect().width;
    if (!drag || !side || !imageSize || drag.pointerId !== event.pointerId) return;
    setPosition(
      clampPosition(
        {
          ...position,
          x: drag.x + event.clientX - drag.startX,
          y: drag.y + event.clientY - drag.startY,
        },
        imageSize,
        side,
      ),
    );
  };

  const zoomTo = (zoom: number) => {
    const side = cropRef.current?.getBoundingClientRect().width;
    if (!side || !imageSize) return;
    setPosition((current) => clampPosition({ ...current, zoom }, imageSize, side));
  };

  return (
    <Sheet
      open={Boolean(file)}
      onClose={close}
      full
      title="Recadrer la photo"
      subtitle="Fais glisser la photo pour choisir le cadrage."
    >
      <div className="v2-stack" style={{ alignItems: 'center' }}>
        {source && (
          <div
            ref={cropRef}
            role="group"
            aria-label="Cadrage de la photo de profil"
            aria-keyshortcuts="ArrowUp ArrowDown ArrowLeft ArrowRight"
            tabIndex={0}
            onPointerDown={(event) => {
              if (!imageSize || busy) return;
              event.currentTarget.setPointerCapture(event.pointerId);
              dragRef.current = {
                pointerId: event.pointerId,
                startX: event.clientX,
                startY: event.clientY,
                x: position.x,
                y: position.y,
              };
            }}
            onPointerMove={moveCrop}
            onKeyDown={(event) => {
              if (!imageSize || busy) return;
              const step = event.shiftKey ? 24 : 10;
              let x = 0;
              let y = 0;
              if (event.key === 'ArrowLeft') x = -step;
              else if (event.key === 'ArrowRight') x = step;
              else if (event.key === 'ArrowUp') y = -step;
              else if (event.key === 'ArrowDown') y = step;
              else return;

              const side = cropRef.current?.getBoundingClientRect().width;
              if (!side) return;
              event.preventDefault();
              setPosition((current) =>
                clampPosition({ ...current, x: current.x + x, y: current.y + y }, imageSize, side),
              );
            }}
            onPointerUp={() => {
              dragRef.current = null;
            }}
            onPointerCancel={() => {
              dragRef.current = null;
            }}
            style={{
              position: 'relative',
              width: 'min(80vw, 320px)',
              aspectRatio: '1',
              borderRadius: '50%',
              overflow: 'hidden',
              border: '2px solid var(--v2-surface)',
              boxShadow: '0 0 0 1px var(--v2-line-strong)',
              background: 'var(--v2-surface-2)',
              touchAction: 'none',
              cursor: imageSize ? 'grab' : 'wait',
            }}
          >
            <img
              ref={imageRef}
              src={source}
              alt=""
              draggable={false}
              onLoad={(event) => {
                const image = event.currentTarget;
                const size = { width: image.naturalWidth, height: image.naturalHeight };
                setImageSize(size);
                const side = cropRef.current?.getBoundingClientRect().width;
                if (side) setPosition(clampPosition({ x: 0, y: 0, zoom: 1 }, size, side));
              }}
              onError={() => setError('Cette image ne peut pas être ouverte.')}
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                display: 'block',
                width: imageSize
                  ? `${Math.max(100, (imageSize.width / imageSize.height) * 100) * position.zoom}%`
                  : '100%',
                maxWidth: 'none',
                height: 'auto',
                transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px))`,
                userSelect: 'none',
                pointerEvents: 'none',
              }}
            />
            <span
              aria-hidden="true"
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '50%',
                boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.55)',
                pointerEvents: 'none',
              }}
            />
          </div>
        )}

        {imageSize ? (
          <>
            <div className="v2-muted" style={{ fontSize: 12, textAlign: 'center' }}>
              Déplace la photo avec les flèches du clavier ou en la faisant glisser.
            </div>
            <label style={{ width: '100%', maxWidth: 320, display: 'grid', gap: 8 }}>
              <span className="v2-muted" style={{ fontSize: 12.5 }}>
                Zoom
              </span>
              <input
                type="range"
                min="1"
                max="3"
                step="0.01"
                value={position.zoom}
                aria-label="Zoom de la photo"
                disabled={busy}
                onChange={(event) => zoomTo(Number(event.target.value))}
              />
            </label>
          </>
        ) : (
          <div className="v2-muted" style={{ fontSize: 13 }}>
            Chargement de la photo…
          </div>
        )}

        {error && (
          <div role="alert" style={{ color: 'var(--v2-negative)', fontSize: 12.5 }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, width: '100%' }}>
          <Button variant="secondary" disabled={busy} onClick={close} style={{ flex: 1 }}>
            Annuler
          </Button>
          <Button
            loading={busy}
            disabled={!imageSize}
            onClick={() => void confirmCrop()}
            style={{ flex: 1 }}
          >
            <Icon name="check" size={18} />
            Utiliser la photo
          </Button>
        </div>
      </div>
    </Sheet>
  );
}
