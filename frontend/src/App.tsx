import { useEffect, useState } from "react";

import { CapturePanel } from "@/components/CapturePanel";
import { SpiritMessage } from "@/components/SpiritMessage";
import { StoneSong } from "@/components/StoneSong";
import { StoneViewer } from "@/components/StoneViewer";
import { WavePanel } from "@/components/WavePanel";
import { analyzeStone } from "@/lib/api";
import type { Instrument, StoneAnalysis } from "@/types/stone";

type Phase = "idle" | "capturing" | "analyzing" | "spirit";

const INSTRUMENT_LABEL: Record<Instrument, string> = {
  earth: "地",
  moss: "苔",
  water: "水",
  ember: "熾",
  night: "夜",
};

export default function App() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<StoneAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [listening, setListening] = useState(false);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const onSelect = (nextFile: File) => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setFile(nextFile);
    setPreviewUrl(URL.createObjectURL(nextFile));
    setAnalysis(null);
    setError(null);
    setListening(false);
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
    setPhase("idle");
  };

  return (
    <main className="ritual">
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
          <StoneViewer points={analysis.pointCloud.points} />
          <div className="spirit-meta">
            <p className="instrument">{INSTRUMENT_LABEL[analysis.sound.instrument]}</p>
            <StoneSong sound={analysis.sound} onPlayingChange={setListening} />
          </div>
          <WavePanel wave={analysis.wave} playing={listening} />
          <SpiritMessage message={analysis.message} />
          <button className="ghost-button" type="button" onClick={onReset}>
            別の石を見る
          </button>
        </section>
      )}
    </main>
  );
}
