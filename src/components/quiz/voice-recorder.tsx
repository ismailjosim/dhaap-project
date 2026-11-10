"use client";

import {
  IconLoader,
  IconMicrophone,
  IconPlayerStop,
  IconX,
} from "@tabler/icons-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

interface VoiceRecorderProps {
  onTranscriptionComplete: (text: string) => void;
  disabled?: boolean;
}

export function VoiceRecorder({
  onTranscriptionComplete,
  disabled,
}: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [transcribing, setTranscribing] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== "inactive"
      ) {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const startRecording = async () => {
    if (disabled || isRecording || transcribing) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];

      let mimeType = "audio/webm;codecs=opus";
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        if (MediaRecorder.isTypeSupported("audio/webm")) {
          mimeType = "audio/webm";
        } else if (MediaRecorder.isTypeSupported("audio/mp4")) {
          mimeType = "audio/mp4";
        } else {
          mimeType = "";
        }
      }

      const mediaRecorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // Stop all tracks to release mic hardware
        for (const track of stream.getTracks()) {
          track.stop();
        }

        const audioBlob = new Blob(audioChunksRef.current, {
          type: mediaRecorder.mimeType || "audio/webm",
        });

        if (audioBlob.size < 1000) {
          toast.warning("Audio was too short. Please try again.");
          return;
        }

        await uploadAndTranscribe(audioBlob);
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(250); // Slice data every 250ms
      setIsRecording(true);
      setSeconds(0);

      timerRef.current = setInterval(() => {
        setSeconds((prev) => {
          if (prev >= 180) {
            // 3-minute cap reached
            stopRecording();
            return 180;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      console.error("[VoiceRecorder] Microphone access denied or error:", err);
      toast.error(
        "Microphone access was denied. Please allow microphone permissions in your browser.",
      );
    }
  };

  const stopRecording = () => {
    if (!isRecording || !mediaRecorderRef.current) return;

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }

    setIsRecording(false);
  };

  const cancelRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.ondataavailable = null;
      mediaRecorderRef.current.onstop = null;
      mediaRecorderRef.current.stop();
    }

    audioChunksRef.current = [];
    setIsRecording(false);
    setSeconds(0);
    toast.info("Voice recording cancelled.");
  };

  const uploadAndTranscribe = async (audioBlob: Blob) => {
    setTranscribing(true);
    try {
      const formData = new FormData();
      formData.append("audio", audioBlob, "recording.webm");

      const res = await fetch("/api/voice/transcribe", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to transcribe audio.");
      }

      if (data.transcript?.trim()) {
        onTranscriptionComplete(data.transcript.trim());
        toast.success(
          "Voice transcribed! You can review and edit before submitting.",
        );
      } else {
        toast.warning(
          "Could not detect clear speech. Please try speaking again or type your answer.",
        );
      }
    } catch (err) {
      toast.error((err as Error).message || "Transcription failed.");
    } finally {
      setTranscribing(false);
      setSeconds(0);
    }
  };

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (transcribing) {
    return (
      <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-primary/30 bg-primary-soft text-primary-soft-foreground text-xs font-semibold animate-pulse">
        <IconLoader className="h-4 w-4 animate-spin" />
        <span>Transcribing speech with AI...</span>
      </div>
    );
  }

  if (isRecording) {
    return (
      <div className="flex items-center gap-2 bg-destructive-soft border border-destructive/30 text-destructive-soft-foreground px-3 py-1.5 rounded-xl text-xs font-semibold">
        <span className="h-2.5 w-2.5 rounded-full bg-destructive animate-ping" />
        <span>Recording ({formatTimer(seconds)})</span>

        <button
          type="button"
          onClick={stopRecording}
          className="flex items-center gap-1 ml-1 px-2.5 py-0.5 rounded-lg bg-destructive text-white hover:bg-destructive/90 transition-colors"
          title="Finish recording"
        >
          <IconPlayerStop className="h-3 w-3" />
          <span>Done</span>
        </button>

        <button
          type="button"
          onClick={cancelRecording}
          className="p-1 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-foreground"
          title="Cancel"
        >
          <IconX className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={startRecording}
      disabled={disabled}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted text-xs font-medium transition-colors disabled:opacity-50"
      title="Answer by voice (Bangla + English supported)"
    >
      <IconMicrophone className="h-3.5 w-3.5 text-primary" />
      <span>Answer with Voice</span>
    </button>
  );
}
