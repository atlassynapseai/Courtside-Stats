import { useEffect, useMemo, useRef, useState } from 'react';
import { Mic, MicOff, Sparkles } from 'lucide-react';

interface VoiceStatLoggerProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
}

export default function VoiceStatLogger({ onTranscript, disabled = false }: VoiceStatLoggerProps) {
  const [listening, setListening] = useState(false);
  const [lastTranscript, setLastTranscript] = useState('');
  const recognitionRef = useRef<{
    start: () => void;
    stop: () => void;
    abort: () => void;
  } | null>(null);
  const onTranscriptRef = useRef(onTranscript);

  const supported = useMemo(() => {
    if (typeof window === 'undefined') {
      return false;
    }

    type SpeechRecognitionConstructor = new () => {
      lang: string;
      interimResults: boolean;
      continuous: boolean;
      start: () => void;
      stop: () => void;
      abort: () => void;
      onresult: ((event: { results: Array<Array<{ transcript?: string }>> }) => void) | null;
      onend: (() => void) | null;
    };

    const browserWindow = window as Window & {
      SpeechRecognition?: SpeechRecognitionConstructor;
      webkitSpeechRecognition?: SpeechRecognitionConstructor;
    };

    const SpeechRecognition = browserWindow.SpeechRecognition || browserWindow.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      return false;
    }

    return true;
  }, []);

  useEffect(() => {
    onTranscriptRef.current = onTranscript;
  }, [onTranscript]);

  useEffect(() => {
    if (typeof window === 'undefined' || !supported) {
      return;
    }

    type SpeechRecognitionResultShape = { transcript?: string };
    type SpeechRecognitionEventShape = {
      results: Array<Array<SpeechRecognitionResultShape>>;
    };

    type SpeechRecognitionConstructor = new () => {
      lang: string;
      interimResults: boolean;
      continuous: boolean;
      start: () => void;
      stop: () => void;
      abort: () => void;
      onresult: ((event: SpeechRecognitionEventShape) => void) | null;
      onend: (() => void) | null;
    };

    const browserWindow = window as Window & {
      SpeechRecognition?: SpeechRecognitionConstructor;
      webkitSpeechRecognition?: SpeechRecognitionConstructor;
    };

    const SpeechRecognition = browserWindow.SpeechRecognition || browserWindow.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.continuous = false;
    recognitionRef.current = recognition;

    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript?.trim() ?? '';
      if (!transcript) {
        return;
      }

      setLastTranscript(transcript);
      onTranscriptRef.current(transcript);
    };

    recognition.onend = () => setListening(false);

    return () => {
      recognition.onresult = null;
      recognition.onend = null;
      recognition.abort();
      recognitionRef.current = null;
    };
  }, [supported]);

  const toggleListening = () => {
    const recognition = recognitionRef.current;

    if (!recognition || disabled) {
      return;
    }

    if (listening) {
      recognition.stop();
      return;
    }

    setLastTranscript('');
    setListening(true);
    recognition.start();
  };

  return (
    <div className="court-glass rounded-2xl border border-brand-border p-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-[11px] uppercase tracking-[0.22em] text-brand-muted">Voice Stat Logging</div>
          <div className="mt-1 text-sm text-brand-white">Say a player name and stat, like “Mason two points”.</div>
        </div>
        <button
          type="button"
          onClick={toggleListening}
          disabled={!supported || disabled}
          className={`court-button inline-flex min-w-[120px] items-center justify-center gap-2 rounded-lg border px-4 text-sm font-semibold transition-all ${listening
              ? 'border-brand-red/40 bg-brand-red/10 text-brand-red'
              : 'border-brand-border bg-brand-navy text-brand-white'
            } ${!supported || disabled ? 'cursor-not-allowed opacity-50' : 'hover:border-brand-gold hover:text-brand-gold'}`}
        >
          {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          {listening ? 'Listening' : 'Mic'}
        </button>
      </div>

      <div className="mt-3 flex items-center gap-2 text-[11px] text-brand-muted">
        <Sparkles className="h-3.5 w-3.5 text-brand-bright-gold" />
        {supported ? lastTranscript || 'Voice logging is ready when you are.' : 'Speech recognition is not available in this browser.'}
      </div>
    </div>
  );
}