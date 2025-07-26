import { ReactNode } from "react";
import Header from "./header";
import Footer from "./footer";

interface LayoutProps {
  children: ReactNode;
  variant?: 'landing' | 'dashboard' | 'auth';
}

export default function Layout({ children, variant = 'dashboard' }: LayoutProps) {
  // For dashboard variant, only show header (footer handled by children content)
  if (variant === 'dashboard') {
    return (
      <div className="min-h-screen flex flex-col">
        <Header variant={variant} />
        <div className="flex-1">
          {children}
        </div>
      </div>
    );
  }

  // For other variants, show full layout
  return (
    <div className="min-h-screen flex flex-col">
      <Header variant={variant} />
      <main className="flex-1">
        {children}
      </main>
      <Footer variant={variant} />
    </div>
  );
}