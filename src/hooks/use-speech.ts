"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type RecognitionEvent = Event & {
  results: {
    length: number;
    [index: number]: { 0: { transcript: string }; isFinal: boolean };
  };
};

type RecognitionError = Event & { error: string };
type Recognition = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: RecognitionEvent) => void) | null;
  onerror: ((event: RecognitionError) => void) | null;
  onend: (() => void) | null;
};
type RecognitionConstructor = new () => Recognition;

declare global {
  interface Window {
    SpeechRecognition?: RecognitionConstructor;
    webkitSpeechRecognition?: RecognitionConstructor;
  }
}

export function useSpeech(onTranscript: (value: string) => void) {
  const recognitionRef = useRef<Recognition | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pauseCount, setPauseCount] = useState(0);
  const lastResultAt = useRef(0);
  const supported =
    typeof window !== "undefined" &&
    Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
      window.speechSynthesis?.cancel();
    };
  }, []);

  const speak = useCallback((text: string) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.96;
    utterance.pitch = 0.94;
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find((item) => /en-(IN|GB|US)/.test(item.lang));
    if (voice) utterance.voice = voice;
    window.speechSynthesis.speak(utterance);
  }, []);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  const start = useCallback(() => {
    setError(null);
    const Constructor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Constructor) {
      setError("Voice input is not supported here. You can type your answer.");
      return;
    }
    const recognition = new Constructor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.onresult = (event) => {
      let combined = "";
      for (let index = 0; index < event.results.length; index += 1) {
        combined += `${event.results[index][0].transcript} `;
      }
      const now = Date.now();
      if (lastResultAt.current && now - lastResultAt.current > 1800) {
        setPauseCount((count) => count + 1);
      }
      lastResultAt.current = now;
      onTranscript(combined.trim());
    };
    recognition.onerror = (event) => {
      const message =
        event.error === "not-allowed"
          ? "Microphone permission was denied. Type your answer instead."
          : "Voice input stopped. Your transcript is safe—continue typing.";
      setError(message);
      setIsListening(false);
    };
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
    setPauseCount(0);
    lastResultAt.current = Date.now();
    try {
      recognition.start();
      setIsListening(true);
    } catch {
      setError("Voice input could not start. Type your answer instead.");
      setIsListening(false);
    }
  }, [onTranscript]);

  return { supported, isListening, error, pauseCount, speak, start, stop };
}
