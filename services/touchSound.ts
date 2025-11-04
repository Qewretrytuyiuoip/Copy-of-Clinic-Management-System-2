let audioContext: AudioContext | null = null;
let isInitialized = false;

// Function to initialize AudioContext, must be called after a user gesture
function initializeAudio() {
  if (isInitialized || typeof window === 'undefined') {
    return;
  }

  isInitialized = true;
  try {
    // Standard AudioContext
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  } catch (e) {
    console.error("Web Audio API is not supported in this browser.");
  }
}

/**
 * Plays a short 'tick' sound for UI feedback.
 * It should be called from a user interaction event handler like 'click' or 'touchstart'.
 */
export function playTouchSound() {
  // Lazily initialize on first sound play attempt
  if (!isInitialized) {
    initializeAudio();
  }
  
  if (!audioContext) {
    return;
  }

  // In many browsers, the AudioContext starts in a 'suspended' state
  // and must be resumed by a user gesture.
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }

  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  // Configure a short, non-intrusive "tick" sound
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(1200, audioContext.currentTime); // High pitch for a 'tick'
  gainNode.gain.setValueAtTime(0.2, audioContext.currentTime); // Not too loud

  gainNode.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.1);
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.1);
}

// To ensure the AudioContext is ready, we can initialize it on the first user interaction anywhere on the page.
if (typeof window !== 'undefined') {
  const initOnFirstInteraction = () => {
    initializeAudio();
    document.removeEventListener('touchstart', initOnFirstInteraction, { capture: true });
    document.removeEventListener('mousedown', initOnFirstInteraction, { capture: true });
  };
  document.addEventListener('touchstart', initOnFirstInteraction, { capture: true, once: true });
  document.addEventListener('mousedown', initOnFirstInteraction, { capture: true, once: true });
}
