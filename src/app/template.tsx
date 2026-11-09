/** Every route enters through a short "smoke clearing" — blur and haze resolving into the page. */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="page-enter">{children}</div>;
}
