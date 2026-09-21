import { useEffect, useRef, useState } from "react";

type OverlayFeedProps = {
  active: boolean;
  photoUrl: string | null;
};

export function OverlayFeed({ active, photoUrl }: OverlayFeedProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [live, setLive] = useState(false);

  useEffect(() => {
    if (!active) {
      setLive(false);
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      return;
    }

    let stream: MediaStream | undefined;
    let cancelled = false;

    const stop = () => {
      stream?.getTracks().forEach((track) => track.stop());
      stream = undefined;
      const video = videoRef.current;
      if (video) {
        video.srcObject = null;
      }
    };

    const start = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        });
        if (cancelled) {
          stop();
          return;
        }
        const video = videoRef.current;
        if (!video) {
          stop();
          return;
        }
        stream.getVideoTracks()[0]?.addEventListener("ended", () => {
          if (!cancelled) {
            setLive(false);
          }
        });
        video.srcObject = stream;
        video.muted = true;
        video.playsInline = true;
        await video.play();
        if (!cancelled) {
          setLive(true);
        }
      } catch {
        stop();
        if (!cancelled) {
          setLive(false);
        }
      }
    };

    void start();

    return () => {
      cancelled = true;
      setLive(false);
      stop();
    };
  }, [active]);

  if (!active) {
    return null;
  }

  return (
    <div className="overlay-feed" aria-hidden="true">
      {photoUrl && (
        <img
          className={`overlay-layer${live ? " is-hidden" : ""}`}
          src={photoUrl}
          alt=""
        />
      )}
      <video
        ref={videoRef}
        className={`overlay-layer overlay-video${live ? " is-live" : ""}`}
        playsInline
        muted
        autoPlay
      />
    </div>
  );
}
