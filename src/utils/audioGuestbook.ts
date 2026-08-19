export interface SpeechResult {
  transcript: string;
  isFinal: boolean;
}

export interface AudioGuestbookResult {
  audioBlob: Blob | null;
  transcript: string;
}

export function isSpeechSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)
  );
}

export function isMediaRecorderSupported(): boolean {
  return (
    typeof window !== "undefined" && "MediaRecorder" in window
  );
}

export class AudioGuestbookEngine {
  private recognition: SpeechRecognition | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private maxDuration = 15000;

  async start(
    onInterim: (result: SpeechResult) => void,
    onTimeUpdate: (seconds: number) => void,
  ): Promise<void> {
    this.audioChunks = [];

    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        sampleRate: 44100,
      },
    });

    const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
      ? "audio/webm;codecs=opus"
      : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "audio/mp4";

    this.mediaRecorder = new MediaRecorder(this.stream, { mimeType });
    this.mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) this.audioChunks.push(e.data);
    };
    this.mediaRecorder.start(250);

    if (isSpeechSupported()) {
      const SpeechRecognitionClass =
        window.SpeechRecognition ?? window.webkitSpeechRecognition;
      if (SpeechRecognitionClass) {
        this.recognition = new SpeechRecognitionClass();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = "en-US";

        this.recognition.onresult = (event: SpeechRecognitionEvent) => {
          let interimTranscript = "";
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const t = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              onInterim({ transcript: t, isFinal: true });
            } else {
              interimTranscript += t;
            }
          }
          if (interimTranscript) {
            onInterim({ transcript: interimTranscript, isFinal: false });
          }
        };

        this.recognition.onerror = () => {};
        this.recognition.start();
      }
    }

    let elapsed = 0;
    const interval = setInterval(() => {
      elapsed += 1;
      onTimeUpdate(elapsed);
      if (elapsed >= this.maxDuration / 1000) {
        clearInterval(interval);
      }
    }, 1000);

    this.timer = setTimeout(() => {
      clearInterval(interval);
      this.stop();
    }, this.maxDuration);
  }

  stop(): Promise<{ audioBlob: Blob; mimeType: string }> {
    return new Promise((resolve) => {
      if (this.timer) clearTimeout(this.timer);
      if (this.recognition) {
        this.recognition.stop();
        this.recognition = null;
      }
      if (this.mediaRecorder && this.mediaRecorder.state !== "inactive") {
        const mimeType = this.mediaRecorder.mimeType;
        this.mediaRecorder.onstop = () => {
          const blob = new Blob(this.audioChunks, { type: mimeType });
          this.cleanup();
          resolve({ audioBlob: blob, mimeType });
        };
        this.mediaRecorder.stop();
      } else {
        const blob = new Blob(this.audioChunks, { type: "audio/webm" });
        this.cleanup();
        resolve({ audioBlob: blob, mimeType: "audio/webm" });
      }
    });
  }

  private cleanup() {
    if (this.stream) {
      this.stream.getTracks().forEach((t) => t.stop());
      this.stream = null;
    }
  }

  get isRecording(): boolean {
    return this.mediaRecorder?.state === "recording";
  }
}
