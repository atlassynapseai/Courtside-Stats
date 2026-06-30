type SoundType = 'buzzer' | 'whistle' | 'swish' | 'tap';

function playTone(frequencies: number[], duration = 0.18, volume = 0.18): void {
  if (typeof window === 'undefined' || !window.AudioContext) {
    return;
  }

  const audioContext = new window.AudioContext();
  const gainNode = audioContext.createGain();
  gainNode.gain.value = volume;
  gainNode.connect(audioContext.destination);

  frequencies.forEach((frequency, index) => {
    const oscillator = audioContext.createOscillator();
    oscillator.type = 'sine';
    oscillator.frequency.value = frequency;
    oscillator.connect(gainNode);
    oscillator.start(audioContext.currentTime + index * 0.03);
    oscillator.stop(audioContext.currentTime + duration + index * 0.03);
  });
}

export function playSoundEffect(type: SoundType): void {
  if (type === 'buzzer') {
    playTone([180, 140, 110], 0.28, 0.22);
    return;
  }

  if (type === 'whistle') {
    playTone([980, 1240], 0.14, 0.14);
    return;
  }

  if (type === 'swish') {
    playTone([720, 980, 1320], 0.1, 0.12);
    return;
  }

  playTone([520], 0.05, 0.08);
}

export function vibrate(pattern: number | number[] = 35): void {
  if (typeof navigator === 'undefined' || !('vibrate' in navigator)) {
    return;
  }

  navigator.vibrate(pattern);
}