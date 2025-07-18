import { ReactNode } from "react";
import Header from "./header";
import Footer from "./footer";

interface LayoutProps {
  children: ReactNode;
  variant?: 'landing' | 'dashboard' | 'auth';
}

export default function Layout({ children, variant = 'dashboard' }: LayoutProps) {
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