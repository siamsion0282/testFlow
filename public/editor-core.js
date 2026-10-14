export const defaults = () => ({ brightness: 100, contrast: 100, saturation: 100, rotation: 0, flipX: false, flipY: false, preset: 'original' });
export function outputSize(width, height, rotation) {
  return Math.abs(rotation % 180) === 90 ? { width: height, height: width } : { width, height };
}
export function filterFor(state) {
  const presets = { original: '', mono: 'grayscale(1)', warm: 'sepia(.3)', vintage: 'sepia(.5) contrast(.9)', cool: 'hue-rotate(20deg) saturate(.8)' };
  return `brightness(${state.brightness}%) contrast(${state.contrast}%) saturate(${state.saturation}%) ${presets[state.preset] || ''}`.trim();
}
export function centeredCrop(width, height, ratio) {
  if (!(width > 0 && height > 0 && ratio > 0)) throw new Error('Invalid crop dimensions');
  const cropWidth = Math.min(width, height * ratio);
  const cropHeight = cropWidth / ratio;
  return { x: (width - cropWidth) / 2, y: (height - cropHeight) / 2, width: cropWidth, height: cropHeight };
}
