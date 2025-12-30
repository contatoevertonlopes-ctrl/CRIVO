import React, { useCallback, useState } from "react";
import Cropper from "react-easy-crop";

interface Props {
  src: string;
  aspect?: number;
  onCancel: () => void;
  onComplete: (blob: Blob) => void;
}

const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.addEventListener("load", () => resolve(img));
    img.addEventListener("error", (e) => reject(e));
    img.setAttribute("crossOrigin", "anonymous");
    img.src = url;
  });

function getCroppedImg(imageSrc: string, pixelCrop: any, outputSize = 512) {
  return new Promise<Blob | null>(async (resolve, reject) => {
    try {
      const image = await createImage(imageSrc);
      const canvas = document.createElement("canvas");
      canvas.width = outputSize;
      canvas.height = outputSize;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Could not get canvas context"));

      // draw the cropped image to the canvas and scale to outputSize
      ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        outputSize,
        outputSize
      );

      canvas.toBlob((blob) => {
        resolve(blob);
      }, "image/jpeg", 0.9);
    } catch (e) {
      reject(e);
    }
  });
}

const ImageCropper: React.FC<Props> = ({ src, aspect = 1, onCancel, onComplete }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const onCropComplete = useCallback((_: any, croppedAreaPixelsLocal: any) => {
    setCroppedAreaPixels(croppedAreaPixelsLocal);
  }, []);

  const handleDone = useCallback(async () => {
    if (!croppedAreaPixels) return;
    const blob = await getCroppedImg(src, croppedAreaPixels, 512);
    if (blob) onComplete(blob);
  }, [croppedAreaPixels, src, onComplete]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl bg-card rounded-md p-4">
        <div className="relative h-96 bg-black">
          <Cropper
            image={src}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>

        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground">Zoom</label>
            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
            />
          </div>

          <div className="flex gap-2">
            <button type="button" className="btn" onClick={onCancel}>
              Cancelar
            </button>
            <button type="button" className="btn btn-primary" onClick={handleDone}>
              Aplicar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageCropper;
