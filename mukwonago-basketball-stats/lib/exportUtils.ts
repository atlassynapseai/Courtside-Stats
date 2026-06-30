import html2canvas from 'html2canvas';

export function downloadTextFile(fileName: string, content: string, mimeType = 'text/plain;charset=utf-8'): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

export async function captureElementImage(target: HTMLElement): Promise<string> {
  const canvas = await html2canvas(target, {
    backgroundColor: '#0a0f1e',
    scale: Math.min(window.devicePixelRatio || 1, 2),
  });

  return canvas.toDataURL('image/png');
}

export async function downloadElementImage(target: HTMLElement, fileName: string): Promise<void> {
  const imageDataUrl = await captureElementImage(target);
  const link = document.createElement('a');
  link.href = imageDataUrl;
  link.download = fileName;
  link.click();
}