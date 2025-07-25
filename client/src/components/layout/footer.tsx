import { Link } from "wouter";
import { Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin } from "lucide-react";

interface FooterProps {
  variant?: 'landing' | 'dashboard' | 'auth';
}

export default function Footer({ variant = 'landing' }: FooterProps) {
  if (variant === 'auth') {
    return (
      <footer className="bg-white border-t border-gray-200 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <h3 className="text-lg font-bold text-[var(--airbnb-primary)]">TravelFlow</h3>
            </div>
            <div className="text-sm text-[var(--airbnb-gray)]">
              © 2024 TravelFlow. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    );
  }

  if (variant === 'dashboard') {
    return (
      <footer className="bg-white border-t border-[var(--airbnb-border)] py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-6">
              <Link href="/help" className="text-sm text-[var(--airbnb-gray)] hover:text-[var(--airbnb-primary)]">
                Help Center
              </Link>
              <Link href="/support" className="text-sm text-[var(--airbnb-gray)] hover:text-[var(--airbnb-primary)]">
                Support
              </Link>
              <Link href="/documentation" className="text-sm text-[var(--airbnb-gray)] hover:text-[var(--airbnb-primary)]">
                Documentation
              </Link>
            </div>
            <div className="text-sm text-[var(--airbnb-gray)]">
              © 2024 TravelFlow. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    );
  }

  // Landing page footer
  return (
    <footer className="bg-[var(--airbnb-dark)] text-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-[var(--airbnb-primary)]">Off Bus</h3>
            <p className="text-gray-300 text-sm leading-relaxed">
              Revolutionizing travel agency management with smart automation, 
              comprehensive fleet management, and seamless customer communication.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-300 hover:text-[var(--airbnb-primary)] transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-300 hover:text-[var(--airbnb-primary)] transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-300 hover:text-[var(--airbnb-primary)] transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-300 hover:text-[var(--airbnb-primary)] transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Product */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Product</h4>
            <ul className="space-y-2">
              <li><a href="#features" className="text-gray-300 hover:text-white transition-colors">Features</a></li>
              <li><a href="#pricing" className="text-gray-300 hover:text-white transition-colors">Pricing</a></li>
              <li><a href="#integrations" className="text-gray-300 hover:text-white transition-colors">Integrations</a></li>
              <li><a href="#security" className="text-gray-300 hover:text-white transition-colors">Security</a></li>
            </ul>
          </div>

          {/* Support */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Support</h4>
            <ul className="space-y-2">
              <li><a href="#help" className="text-gray-300 hover:text-white transition-colors">Help Center</a></li>
              <li><a href="#documentation" className="text-gray-300 hover:text-white transition-colors">Documentation</a></li>
              <li><a href="#api" className="text-gray-300 hover:text-white transition-colors">API Reference</a></li>
              <li><a href="#contact" className="text-gray-300 hover:text-white transition-colors">Contact Us</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Get in Touch</h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Mail className="w-4 h-4 text-[var(--airbnb-primary)]" />
                <span className="text-gray-300 text-sm">hello@travelflow.com</span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="w-4 h-4 text-[var(--airbnb-primary)]" />
                <span className="text-gray-300 text-sm">+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center space-x-3">
                <MapPin className="w-4 h-4 text-[var(--airbnb-primary)]" />
                <span className="text-gray-300 text-sm">San Francisco, CA</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <div className="text-gray-300 text-sm">
            © 2024 TravelFlow. All rights reserved.
          </div>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="#privacy" className="text-gray-300 hover:text-white text-sm transition-colors">
              Privacy Policy
            </a>
            <a href="#terms" className="text-gray-300 hover:text-white text-sm transition-colors">
              Terms of Service
            </a>
            <a href="#cookies" className="text-gray-300 hover:text-white text-sm transition-colors">
              Cookie Policy
            </a>
            <Link href="/admin-login" className="text-red-400 hover:text-red-300 text-sm transition-colors">
              Admin Access
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}