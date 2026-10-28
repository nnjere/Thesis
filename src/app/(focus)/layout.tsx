/** Project page and workspace: each draws its own header (breadcrumb, presence, cursors). */
export default function FocusLayout({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-1 flex-col">{children}</div>;
}
