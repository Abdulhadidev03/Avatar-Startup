import type { Metadata } from "next";
import "./widget.css";

export const metadata: Metadata = {
  title: "Ruhana Widget",
  robots: "noindex",
};

export default function WidgetLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="wgt-layout-root">
      {children}
    </div>
  );
}
