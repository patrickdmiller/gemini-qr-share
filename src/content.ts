import { qrcodegen } from './qr'
const QR = qrcodegen.QrCode
window.addEventListener('load', () => {
  const linkSelector = 'a[data-test-id="created-share-link"]';
  const containerSelector = ".social-media-buttons-container";
  const replaceSocialMedia = true;
  const qrCodeHolderMarkerClass = "io-qr-holder";
  let observer = null;
  let debounceTimeoutId: NodeJS.Timeout | null = null;
  const ensureQrCodeState = () => {
    const linkElement = document.querySelector(linkSelector);
    const targetContainer = document.querySelector(containerSelector);
    const linkAvailable = linkElement && (linkElement as HTMLAnchorElement).href;
    const containerAvailable = targetContainer;
    const qrCodePresent = containerAvailable && targetContainer.querySelector(`.${qrCodeHolderMarkerClass}`);

    // we need to make a qr in this case
    if (linkAvailable && containerAvailable && !qrCodePresent && linkElement) {
      const urlToEncode = (linkElement as HTMLAnchorElement).href;
      try {
        const qrCodeHolder = document.createElement("div");
        qrCodeHolder.className = qrCodeHolderMarkerClass;
        qrCodeHolder.style.display = "flex";
        qrCodeHolder.style.justifyContent = "center";
        qrCodeHolder.style.alignItems = "center";
        qrCodeHolder.style.padding = "10px 0";
        qrCodeHolder.style.marginBottom = "20px";
        qrCodeHolder.title = `QR Code for: ${urlToEncode}`;
        const qr = QR.encodeText(urlToEncode, QR.Ecc.HIGH);
        qrCodeHolder.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${qr.size} ${qr.size}" style="border-radius:10px; height:200px;">
            ${toSvgString(qr, 4, "#ffffff", "#000000")}
          </svg>
        `;
        if (replaceSocialMedia) {
          targetContainer.innerHTML = "";
        }
        targetContainer.appendChild(qrCodeHolder);
      } catch (error) {
        console.error("QR: Error adding QR code:", error);
      }
    } else if ((!linkAvailable || !containerAvailable) && qrCodePresent) {
      try {
        const existingQrHolder = targetContainer.querySelector(`.${qrCodeHolderMarkerClass}`);
        if (existingQrHolder) {
          targetContainer.removeChild(existingQrHolder);
        } else {
          console.error("QR was present but the holder wasn't selectable");
        }
      } catch (error) {
        console.error("QR: Error removing QR code:", error);
      }
    }
  };
  const debouncedCallback = () => {
    if (debounceTimeoutId) {
      clearTimeout(debounceTimeoutId);
    }
    debounceTimeoutId = setTimeout(() => {
      ensureQrCodeState();
    }, 150);
  };
  const targetNodeToObserve = document.body;
  if (!targetNodeToObserve) {
    console.error("QR: Cannot find document.body.");
    return;
  }
  const config = { childList: true, subtree: true };
  observer = new MutationObserver(debouncedCallback);
  observer.observe(targetNodeToObserve, config);
  ensureQrCodeState();
});

function toSvgString(qr: qrcodegen.QrCode, border: number, lightColor: string, darkColor: string) {
  if (border < 0)
    throw new RangeError("Border must be non-negative");
  let parts = [];
  for (let y = 0; y < qr.size; y++) {
    for (let x = 0; x < qr.size; x++) {
      if (qr.getModule(x, y))
        parts.push(`M${x + border},${y + border}h1v1h-1z`);
    }
  }
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 ${qr.size + border * 2} ${qr.size + border * 2}" stroke="none">
<rect width="100%" height="100%" fill="${lightColor}"/>
<path d="${parts.join(" ")}" fill="${darkColor}"/>
</svg>
`;
}