import { useId } from "react";

type CapturePanelProps = {
  previewUrl: string | null;
  disabled?: boolean;
  onSelect: (file: File) => void;
};

export function CapturePanel({ previewUrl, disabled, onSelect }: CapturePanelProps) {
  const inputId = useId();

  return (
    <label className="capture" htmlFor={inputId}>
      <input
        id={inputId}
        type="file"
        accept="image/jpeg,image/png,image/*"
        capture="environment"
        disabled={disabled}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) {
            onSelect(file);
          }
          event.target.value = "";
        }}
      />
      {previewUrl ? (
        <img src={previewUrl} alt="選ばれた石" />
      ) : (
        <span className="capture-hint">石を見つめる</span>
      )}
    </label>
  );
}
