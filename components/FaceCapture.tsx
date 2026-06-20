"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { confirmFace } from "@/app/verificacao/actions";

type Status = "starting" | "live" | "denied" | "uploading" | "error";

export function FaceCapture({
  userId,
  mobileUrl,
  qrSvg,
}: {
  userId: string;
  mobileUrl: string;
  qrSvg: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<Status>("starting");
  const [faceOk, setFaceOk] = useState(false);
  const [msg, setMsg] = useState<string>("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let raf = 0;
    let detector: { detect: (v: HTMLVideoElement) => Promise<unknown[]> } | null = null;

    async function start() {
      try {
        if (!navigator.mediaDevices?.getUserMedia) { setStatus("denied"); return; }
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: 480, height: 480 }, audio: false });
        if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); }
        setStatus("live");

        const FD = (window as unknown as { FaceDetector?: new (o?: unknown) => { detect: (v: HTMLVideoElement) => Promise<unknown[]> } }).FaceDetector;
        if (FD) {
          detector = new FD({ fastMode: true });
          const loop = async () => {
            if (videoRef.current && detector) {
              try { const faces = await detector.detect(videoRef.current); setFaceOk(faces.length > 0); } catch { /* ignora */ }
            }
            raf = requestAnimationFrame(() => setTimeout(loop, 400));
          };
          loop();
        } else { setFaceOk(true); }
      } catch { setStatus("denied"); }
    }
    start();
    return () => { if (raf) cancelAnimationFrame(raf); stream?.getTracks().forEach((t) => t.stop()); };
  }, []);

  async function capture() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    setStatus("uploading"); setMsg("");

    const size = 480;
    canvas.width = size; canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) { setStatus("error"); return; }
    ctx.drawImage(video, 0, 0, size, size);

    const blob: Blob | null = await new Promise((res) => canvas.toBlob((b) => res(b), "image/jpeg", 0.85));
    if (!blob) { setStatus("error"); setMsg("Falha ao capturar a imagem."); return; }

    const supabase = createClient();
    const path = `${userId}/selfie-${Date.now()}.jpg`;
    const { error } = await supabase.storage.from("selfies").upload(path, blob, { contentType: "image/jpeg", upsert: true });
    if (error) { setStatus("error"); setMsg(error.message); return; }

    await confirmFace(path);
  }

  async function copyLink() {
    try { await navigator.clipboard.writeText(mobileUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* ignora */ }
  }

  const noCamera = status === "denied";

  return (
    <div className="flex flex-col items-center">
      {/* Câmera */}
      {!noCamera ? (
        <>
          <div className="relative h-56 w-56 overflow-hidden rounded-full border-2 border-gold/50 bg-campo-bg">
            <video ref={videoRef} playsInline muted className="h-full w-full -scale-x-100 object-cover" />
            {status === "starting" && (
              <div className="absolute inset-0 flex items-center justify-center text-xs text-stone-500">Abrindo câmera…</div>
            )}
          </div>
          <canvas ref={canvasRef} className="hidden" />
          {msg && <p className="mt-3 text-center text-sm text-red-300">{msg}</p>}
          <p className="mt-4 text-xs text-stone-500">
            {faceOk ? "Rosto detectado — pode capturar." : "Centralize o rosto na moldura."}
          </p>
          <button
            onClick={capture}
            disabled={!faceOk || status === "uploading"}
            className="mt-3 w-full rounded-lg bg-gold py-2.5 font-medium text-campo-bg transition hover:bg-gold-light disabled:cursor-not-allowed disabled:opacity-50"
          >
            {status === "uploading" ? "Confirmando…" : "Capturar e confirmar"}
          </button>
        </>
      ) : (
        <div className="w-full rounded-xl border border-campo-border bg-campo-surface2 p-4 text-center">
          <p className="text-3xl">📷</p>
          <p className="mt-2 text-sm text-stone-300">Não encontramos uma câmera neste dispositivo.</p>
          <p className="mt-1 text-xs text-stone-500">Escaneie o QR abaixo para concluir no celular.</p>
        </div>
      )}

      {/* Concluir no celular — QR sempre na tela */}
      <div className="mt-6 w-full border-t border-campo-border pt-5">
        <p className="text-center text-sm font-medium text-forest-100">Concluir no celular</p>
        <p className="mt-1 text-center text-xs text-stone-500">
          Aponte a câmera do seu celular para o QR code:
        </p>

        <div className="mt-4 flex justify-center">
          <div className="rounded-2xl border border-campo-border bg-campo-bg/60 p-3">
            {qrSvg ? (
              <div className="h-44 w-44 [&>svg]:h-full [&>svg]:w-full" dangerouslySetInnerHTML={{ __html: qrSvg }} />
            ) : (
              <div className="flex h-44 w-44 items-center justify-center text-xs text-stone-600">QR indisponível</div>
            )}
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <input
            readOnly
            value={mobileUrl}
            className="w-full truncate rounded-lg border border-campo-border bg-campo-bg px-3 py-2 text-xs text-stone-400"
          />
          <button onClick={copyLink} className="shrink-0 rounded-lg border border-campo-border px-3 py-2 text-xs text-stone-300 transition hover:border-gold/50">
            {copied ? "Copiado" : "Copiar link"}
          </button>
        </div>
      </div>
    </div>
  );
}
