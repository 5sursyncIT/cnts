import { Mail, MapPin, Phone, Clock } from "lucide-react";

export const metadata = {
  title: "Contact — SGI-CNTS"
};

export default function ContactPage() {
  return (
    <main className="bg-zinc-50 min-h-screen">
      <div className="bg-zinc-900 text-white py-16">
        <div className="mx-auto max-w-7xl px-4 text-center">
          <h1 className="text-3xl font-bold md:text-4xl">Contactez-nous</h1>
          <p className="mt-4 text-zinc-300 max-w-2xl mx-auto text-lg">
            Une question sur le don de sang ? Besoin d'un renseignement médical ? Notre équipe est à votre écoute.
          </p>
        </div>
      </div>

      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Info */}
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-zinc-900 mb-6">Nos Coordonnées</h2>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-zinc-900">Adresse</h3>
                    <p className="text-zinc-600">Avenue Cheikh Anta Diop<br />Dakar, Sénégal</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                    <Phone className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-zinc-900">Téléphone</h3>
                    <p className="text-zinc-600">+221 33 821 82 72</p>
                    <p className="text-zinc-500 text-sm">Disponible du lundi au vendredi de 8h à 17h</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                    <Mail className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-zinc-900">Email</h3>
                    <p className="text-zinc-600">contact@cnts.sn</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-zinc-900">Horaires d'ouverture</h3>
                    <p className="text-zinc-600">Lundi - Vendredi : 08h00 - 17h00</p>
                    <p className="text-zinc-600">Samedi : 08h00 - 13h00</p>
                    <p className="text-zinc-600">Urgences : 24h/24 et 7j/7</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Map Placeholder */}
            <div className="h-64 bg-zinc-200 rounded-xl overflow-hidden relative border border-zinc-300">
              <iframe 
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3859.088658972049!2d-17.47568568516514!3d14.69344198974596!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xec17253456314cd%3A0xe54d6342898c1992!2sCentre%20National%20de%20Transfusion%20Sanguine%20(CNTS)!5e0!3m2!1sfr!2ssn!4v1709485764352!5m2!1sfr!2ssn" 
                width="100%" 
                height="100%" 
                style={{ border: 0 }} 
                allowFullScreen 
                loading="lazy" 
                referrerPolicy="no-referrer-when-downgrade"
                className="absolute inset-0 w-full h-full"
                title="Carte du CNTS"
              ></iframe>
            </div>
          </div>

          {/* Form */}
          <div className="bg-white p-8 rounded-xl shadow-sm border border-zinc-200">
            <h2 className="text-2xl font-bold text-zinc-900 mb-6">Envoyez-nous un message</h2>
            <form className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-zinc-700 mb-1">
                    Nom complet
                  </label>
                  <input
                    id="name"
                    type="text"
                    required
                    className="w-full rounded-md border border-zinc-300 px-4 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    placeholder="Votre nom"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-zinc-700 mb-1">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    className="w-full rounded-md border border-zinc-300 px-4 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    placeholder="votre@email.com"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-zinc-700 mb-1">
                  Sujet
                </label>
                <select
                  id="subject"
                  className="w-full rounded-md border border-zinc-300 px-4 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                >
                  <option>Renseignement général</option>
                  <option>Question médicale</option>
                  <option>Partenariat / Presse</option>
                  <option>Problème technique</option>
                </select>
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-zinc-700 mb-1">
                  Message
                </label>
                <textarea
                  id="message"
                  required
                  rows={6}
                  className="w-full rounded-md border border-zinc-300 px-4 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  placeholder="Comment pouvons-nous vous aider ?"
                />
              </div>

              <button
                type="submit"
                className="w-full inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-bold text-white hover:bg-primary/90 transition-colors shadow-sm"
              >
                Envoyer le message
              </button>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}
