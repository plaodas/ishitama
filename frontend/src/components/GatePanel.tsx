import { useState, type FormEvent } from "react";

type GatePanelProps = {
  error: string | null;
  onSubmit: (password: string) => Promise<void>;
};

export function GatePanel({ error, onSubmit }: GatePanelProps) {
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!password || submitting) {
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit(password);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="gate" onSubmit={(event) => void handleSubmit(event)}>
      <label className="gate-label" htmlFor="gate-password">
        合言葉
      </label>
      <input
        id="gate-password"
        className="gate-input"
        type="password"
        autoComplete="current-password"
        value={password}
        disabled={submitting}
        onChange={(event) => setPassword(event.target.value)}
      />
      {error && <p className="error">{error}</p>}
      <button className="primary-button" type="submit" disabled={!password || submitting}>
        {submitting ? "開いています" : "入る"}
      </button>
    </form>
  );
}
