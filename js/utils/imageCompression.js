const MAX_WIDTH = 1024;
const MAX_HEIGHT = 768;
const MAX_SOURCE_SIZE = 15 * 1024 * 1024;
const OUTPUT_QUALITY = 0.7;

function loadImage(file) {
  if (typeof createImageBitmap === "function") {
    return createImageBitmap(file).catch(() => loadImageWithElement(file));
  }
  return loadImageWithElement(file);
}

function loadImageWithElement(file) {
    const url = URL.createObjectURL(file);
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => {
        URL.revokeObjectURL(url);
        resolve(image);
      };
      image.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("No fue posible leer la imagen seleccionada."));
      };
      image.src = url;
    });
}

function canvasToBlob(canvas, type) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("No fue posible comprimir la fotografía."));
        return;
      }
      resolve(blob);
    }, type, OUTPUT_QUALITY);
  });
}

export async function compressInspectionPhoto(file) {
  if (!file.type.startsWith("image/")) throw new TypeError("Selecciona un archivo de imagen válido.");
  if (file.size > MAX_SOURCE_SIZE) throw new RangeError("Cada fotografía original debe pesar menos de 15 MB.");

  const image = await loadImage(file);
  try {
    if (!image.width || !image.height) throw new Error("La imagen seleccionada no tiene dimensiones válidas.");
    const scale = Math.min(1, MAX_WIDTH / image.width, MAX_HEIGHT / image.height);
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));
    const context = canvas.getContext("2d", { alpha: false });
    if (!context) throw new Error("Este navegador no permite procesar imágenes en canvas.");

    context.fillStyle = "#fff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    const webp = await canvasToBlob(canvas, "image/webp");
    if (webp.type === "image/webp") return webp;
    return canvasToBlob(canvas, "image/jpeg");
  } finally {
    if ("close" in image && typeof image.close === "function") image.close();
  }
}
