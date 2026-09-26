import { colors } from '../theme/colors';

export function withOpacity(hexColor: string, alpha: number, backgroundColor = colors.background) {
  const toChannels = (hex: string) => {
    const normalized = hex.replace('#', '');
    const fullHex = normalized.length === 3
      ? normalized.split('').map((channel) => `${channel}${channel}`).join('')
      : normalized;
    return [0, 2, 4].map((start) => Number.parseInt(fullHex.slice(start, start + 2), 16));
  };

  const foreground = toChannels(hexColor);
  const background = toChannels(backgroundColor);
  const blend = Math.min(1, Math.max(0, alpha));
  const blended = foreground.map((channel, index) => Math.round(background[index] + (channel - background[index]) * blend));
  return `rgb(${blended.join(', ')})`;
}