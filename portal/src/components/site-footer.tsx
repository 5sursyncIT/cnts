import Link from "next/link";
import Image from "next/image";
import { Facebook, Twitter, Instagram, Linkedin, MapPin, Phone, Mail } from "lucide-react";

export function SiteFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-zinc-900 text-zinc-300">
      <div className="mx-auto max-w-7xl px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Column 1: Brand */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="relative flex items-center justify-center w-10 h-10">
                <Image 
                  src="/images/logo.png" 
                  alt="Logo CNTS" 
                  width={40} 
                  height={40} 
                  className="object-contain"
                />
              </div>
              <span className="text-xl font-bold text-white">CNTS</span>
            </Link>
            <p className="text-sm leading-relaxed text-zinc-400">
              Le Centre National de Transfusion Sanguine assure la disponibilité et la sécurité des produits sanguins pour tous les patients du Sénégal depuis plus de 80 ans.
            </p>
            <div className="flex gap-4 pt-2">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors" aria-label="Facebook"><Facebook className="h-5 w-5" /></a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors" aria-label="Twitter"><Twitter className="h-5 w-5" /></a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors" aria-label="Instagram"><Instagram className="h-5 w-5" /></a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors" aria-label="LinkedIn"><Linkedin className="h-5 w-5" /></a>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Liens Rapides</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/donner-sang" className="hover:text-white transition-colors">Pourquoi donner ?</Link></li>
              <li><Link href="/services" className="hover:text-white transition-colors">Nos services</Link></li>
              <li><Link href="/equipe" className="hover:text-white transition-colors">Notre équipe</Link></li>
              <li><Link href="/actualites" className="hover:text-white transition-colors">Actualités</Link></li>
              <li><Link href="/espace-patient" className="hover:text-white transition-colors">Espace Patient</Link></li>
              <li><Link href="/faq" className="hover:text-white transition-colors">Questions fréquentes</Link></li>
            </ul>
          </div>

          {/* Column 3: Services */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Nos Services</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/services#don" className="hover:text-white transition-colors">Don de sang</Link></li>
              <li><Link href="/services#distribution" className="hover:text-white transition-colors">Distribution</Link></li>
              <li><Link href="/services#laboratoire" className="hover:text-white transition-colors">Laboratoire d'analyses</Link></li>
              <li><Link href="/services#formation" className="hover:text-white transition-colors">Formation & Recherche</Link></li>
              <li><Link href="/services#hemovigilance" className="hover:text-white transition-colors">Hémovigilance</Link></li>
            </ul>
          </div>

          {/* Column 4: Contact */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Contactez-nous</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-primary shrink-0" />
                <span>Avenue Cheikh Anta Diop,<br />Dakar, Sénégal</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-primary shrink-0" />
                <span>+221 33 821 82 72</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-primary shrink-0" />
                <span>contact@cnts.sn</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-zinc-800 text-xs text-center text-zinc-500">
          <p className="mb-2">© {currentYear} Centre National de Transfusion Sanguine (CNTS). Tous droits réservés.</p>
          <div className="flex justify-center gap-4">
            <Link href="/mentions-legales" className="hover:text-white transition-colors">Mentions légales</Link>
            <Link href="/politique-confidentialite" className="hover:text-white transition-colors">Politique de confidentialité</Link>
            <Link href="/cookies" className="hover:text-white transition-colors">Gestion des cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
