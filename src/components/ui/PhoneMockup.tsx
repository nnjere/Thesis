/** 8 px ink bezel phone frame. Pass role/label from the caller when the content is meaningful. */
export function PhoneMockup({
  children,
  width = 330,
  height = 640,
  label,
  className = "",
}: {
  children: React.ReactNode;
  width?: number;
  height?: number;
  label?: string;
  className?: string;
}) {
  return (
    <div
      {...(label ? { role: "img", "aria-label": label } : {})}
      className={`box-border flex flex-none flex-col overflow-hidden rounded-[32px] border-8 border-ink bg-surface ${className}`}
      style={{ width, height }}
    >
      {children}
    </div>
  );
}
