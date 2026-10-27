const LINE_WIDTH = 4;

export function initCanvasSignature(canvas, clearButton) {
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Este navegador no permite capturar firmas en canvas.");

  let drawing = false;
  let hasInk = false;
  context.lineCap = "round";
  context.lineJoin = "round";
  context.strokeStyle = "#0f172a";
  context.lineWidth = LINE_WIDTH;

  function pointFromEvent(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * (canvas.width / rect.width),
      y: (event.clientY - rect.top) * (canvas.height / rect.height)
    };
  }

  canvas.addEventListener("pointerdown", (event) => {
    if (!event.isPrimary || (event.pointerType === "mouse" && event.button !== 0)) return;
    event.preventDefault();
    const point = pointFromEvent(event);
    drawing = true;
    hasInk = true;
    canvas.setPointerCapture(event.pointerId);
    context.beginPath();
    context.moveTo(point.x, point.y);
    context.lineTo(point.x + 0.01, point.y + 0.01);
    context.stroke();
  });

  canvas.addEventListener("pointermove", (event) => {
    if (!drawing) return;
    event.preventDefault();
    const point = pointFromEvent(event);
    context.lineTo(point.x, point.y);
    context.stroke();
  });

  function stopDrawing() {
    drawing = false;
  }

  canvas.addEventListener("pointerup", stopDrawing);
  canvas.addEventListener("pointercancel", stopDrawing);
  canvas.addEventListener("lostpointercapture", stopDrawing);
  clearButton.addEventListener("click", () => {
    context.clearRect(0, 0, canvas.width, canvas.height);
    hasInk = false;
  });

  return {
    hasInk: () => hasInk,
    restore: (dataUrl) => new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => {
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        hasInk = true;
        resolve();
      };
      image.onerror = () => reject(new Error("No fue posible restaurar la firma guardada."));
      image.src = dataUrl;
    }),
    toBlob: () => new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error("No fue posible preparar la imagen de la firma."));
      }, "image/png");
    })
  };
}
