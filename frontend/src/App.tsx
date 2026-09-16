import { useEffect, useRef, useState, type CSSProperties } from "react";

import { CapturePanel } from "@/components/CapturePanel";
import { SpiritMessage } from "@/components/SpiritMessage";
import { StoneSong } from "@/components/StoneSong";
import { StoneViewer } from "@/components/StoneViewer";
import { WavePanel } from "@/components/WavePanel";
import { analyzeStone } from "@/lib/api";
import { pulseHaptic, stopHaptic } from "@/lib/haptic";
import { INSTRUMENT_CONFIG } from "@/lib/instrumentConfig";
import type { Instrument, StoneAnalysis } from "@/types/stone";

type Phase = "idle" | "capturing" | "analyzing" | "spirit";

const INSTRUMENT_LABEL: Record<Instrument, string> = {
  earth: "地",
  moss: "苔",
  water: "水",
  ember: "熾",
  night: "夜",
  crystal: "晶",
  shale: "頁",
  sand: "砂",
  frost: "霜",
  "moss-deep": "深苔",
  dusk: "宵",
  void: "虚",
};

export default function App() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<StoneAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [listening, setListening] = useState(false);
  const [pulseTick, setPulseTick] = useState(0);
  const [exploring, setExploring] = useState(false);
  const [listenHintVisible, setListenHintVisible] = useState(false);
  const [listenHintPulse, setListenHintPulse] = useState(false);
  const listenAnchorRef = useRef<HTMLDivElement>(null);
  const viewerFrameRef = useRef<HTMLDivElement>(null);
  const spiritStyle = analysis
    ? ({
        "--accent": INSTRUMENT_CONFIG[analysis.sound.instrument].theme.accent,
        "--atmosphere": INSTRUMENT_CONFIG[analysis.sound.instrument].theme.atmosphere,
        "--level-glow": `${analysis.wave.level <= 3 ? 0 : analysis.wave.level <= 6 ? 2 : 4}px`,
      } as CSSProperties)
    : undefined;

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  useEffect(() => {
    if (phase !== "spirit") {
      setExploring(false);
      setListenHintVisible(false);
      setListenHintPulse(false);
    }
  }, [phase]);

  useEffect(() => {
    if (phase !== "spirit" || !listenAnchorRef.current) {
      return;
    }
    const target = listenAnchorRef.current;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setListenHintVisible(!entry.isIntersecting);
      },
      { threshold: 0.55 },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [phase, analysis]);

  useEffect(() => {
    if (!listenHintVisible) {
      setListenHintPulse(false);
      return;
    }
    setListenHintPulse(true);
    const timer = window.setTimeout(() => setListenHintPulse(false), 4800);
    return () => window.clearTimeout(timer);
  }, [listenHintVisible]);

  useEffect(() => {
    if (!exploring) {
      return;
    }
    const onPointerDown = (event: PointerEvent) => {
      const frame = viewerFrameRef.current;
      if (frame && !frame.contains(event.target as Node)) {
        setExploring(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [exploring]);

  const onSelect = (nextFile: File) => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setFile(nextFile);
    setPreviewUrl(URL.createObjectURL(nextFile));
    setAnalysis(null);
    setError(null);
    setListening(false);
    setPulseTick(0);
    setExploring(false);
    stopHaptic();
    setPhase("capturing");
  };

  const onAnalyze = async () => {
    if (!file) {
      return;
    }
    setPhase("analyzing");
    setError(null);
    try {
      const result = await analyzeStone(file);
      setAnalysis(result);
      setPhase("spirit");
    } catch {
      setAnalysis(null);
      setError("石は応えなかった");
      setExploring(false);
      setPhase("idle");
    }
  };

  const onReset = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setFile(null);
    setPreviewUrl(null);
    setAnalysis(null);
    setError(null);
    setListening(false);
    setPulseTick(0);
    setExploring(false);
    stopHaptic();
    setPhase("idle");
  };

  return (
    <main className={`ritual${analysis ? " has-spirit-theme" : ""}`} style={spiritStyle}>
      <header className="masthead">
        <p className="kicker">Spirit of Stone</p>
        <h1>石魂</h1>
      </header>

      {phase !== "spirit" && (
        <>
          <CapturePanel
            previewUrl={previewUrl}
            disabled={phase === "analyzing"}
            onSelect={onSelect}
          />
          {error && <p className="error">{error}</p>}
          <button
            className="primary-button"
            type="button"
            disabled={!file || phase === "analyzing"}
            onClick={() => void onAnalyze()}
          >
            {phase === "analyzing" ? "呼び出しています" : "詠唱"}
          </button>
          {phase === "analyzing" && (
            <p className="status">石の魂を呼び出しています</p>
          )}
        </>
      )}

      {phase === "spirit" && analysis && (
        <section className="spirit">
          <div
            ref={viewerFrameRef}
            className={`viewer-frame${exploring ? " is-exploring" : ""}`}
          >
            <StoneViewer
              points={analysis.pointCloud.points}
              sound={analysis.sound}
              waveLevel={analysis.wave.level}
              playing={listening}
              pulseTick={pulseTick}
              exploring={exploring}
            />
            <button
              className={`explore-toggle${exploring ? " is-active" : ""}`}
              type="button"
              onClick={() => setExploring((current) => !current)}
            >
              {exploring ? "観察する" : "触れる"}
            </button>
          </div>
          <div className="spirit-meta" ref={listenAnchorRef}>
            <p className="instrument">{INSTRUMENT_LABEL[analysis.sound.instrument]}</p>
            <StoneSong
              sound={analysis.sound}
              onPlayingChange={(playing) => {
                setListening(playing);
                if (!playing) {
                  stopHaptic();
                }
              }}
              onPulse={() => {
                pulseHaptic(analysis.sound.instrument);
                setPulseTick((tick) => tick + 1);
              }}
            />
          </div>
          <WavePanel
            wave={analysis.wave}
            sound={analysis.sound}
            playing={listening}
            pulseTick={pulseTick}
          />
          <SpiritMessage message={analysis.message} />
          <button className="ghost-button" type="button" onClick={onReset}>
            別の石を見る
          </button>
          {listenHintVisible && (
            <button
              className={`listen-hint${listenHintPulse ? " is-pulsing" : ""}`}
              type="button"
              onClick={() => {
                listenAnchorRef.current?.scrollIntoView({
                  behavior: "smooth",
                  block: "center",
                });
              }}
            >
              ↓ 波動を聴く
            </button>
          )}
        </section>
      )}
    </main>
  );
}
