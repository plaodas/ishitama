type SpiritMessageProps = {
  message: string;
};

export function SpiritMessage({ message }: SpiritMessageProps) {
  return <p className="spirit-message">{message}</p>;
}
