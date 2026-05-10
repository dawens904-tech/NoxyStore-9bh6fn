import { useNavigate } from "react-router-dom";
import { ArrowLeft, Cookie } from "lucide-react";
import { DesktopHeader } from "@/components/layout/DesktopHeader";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { Footer } from "@/components/layout/Footer";
import { MobileFooter } from "@/components/layout/MobileFooter";
import { useSettingsStore } from "@/stores/settingsStore";

const CONTENT: Record<string, {
  title: string; updated: string; intro: string;
  sections: { heading: string; body: string }[];
}> = {
  en: {
    title: "Cookie Policy",
    updated: "Last updated: May 10, 2026",
    intro: "This Cookie Policy explains how NoxyStore.com ('NoxyStore', 'we', 'our') uses cookies and similar tracking technologies when you visit our website or use our mobile application. This policy describes what these technologies are, why we use them, and your rights to control their use. By continuing to use our platform, you consent to our use of cookies as described in this policy.",
    sections: [
      {
        heading: "1. What Are Cookies?",
        body: `Cookies are small text files that are placed on your computer, smartphone, tablet, or other device when you visit a website. They are widely used to make websites work more efficiently, to provide functionality, and to collect analytical information to help site owners understand how users interact with their services.

Cookies are created and managed by the web server you connect to and are stored by your browser. They contain a small amount of data, typically including an identifier and some additional information relevant to the service.

**Session Cookies** are temporary cookies that are erased when you close your browser. They enable websites to keep track of your movements within a single browsing session.

**Persistent Cookies** remain on your device between browser sessions and are used to remember your preferences and settings across visits.

**First-Party Cookies** are set directly by NoxyStore when you visit our website.

**Third-Party Cookies** are set by external services we use, such as analytics providers, payment processors, and social media platforms.`
      },
      {
        heading: "2. Similar Tracking Technologies",
        body: `In addition to cookies, we may use the following tracking technologies:

**Web Beacons (Pixel Tags):** Tiny invisible images embedded in web pages or emails that allow us to track whether you have viewed the page or opened the email, and to collect information such as your IP address and browser type.

**Local Storage and Session Storage:** Browser-based storage mechanisms that allow us to store larger amounts of data locally on your device. We use local storage to persist your language preference, currency setting, dark mode preference, and authentication tokens.

**Fingerprinting:** We may use device fingerprinting techniques (such as browser type, installed plugins, screen resolution, and system fonts) as an additional fraud detection and security measure. This data is not used for advertising profiling.

**IndexedDB:** A browser-based database used to cache game listings and product data locally for faster load times and offline functionality.`
      },
      {
        heading: "3. Types of Cookies We Use",
        body: `**3.1 Strictly Necessary Cookies**
These cookies are essential for the operation of our website and cannot be disabled. They enable core functions such as:
- User authentication and session management (Supabase auth tokens)
- Security tokens to prevent cross-site request forgery (CSRF)
- Shopping cart and checkout state management
- Order tracking session continuity
- Load balancing across our server infrastructure

Without these cookies, essential services you have requested cannot be provided. Legal basis: Contract performance and legitimate interests.

**3.2 Performance and Analytics Cookies**
These cookies collect information about how visitors use our website, such as which pages are visited most often and whether users encounter error messages. The data is aggregated and anonymized:
- Page view counting and session duration measurement
- Funnel drop-off analysis (checkout abandonment tracking)
- Error rate monitoring and performance benchmarking
- A/B testing to compare different versions of our features
- Heatmap data showing where users click and scroll

Legal basis: Legitimate interests (with opt-out option).

**3.3 Functional Cookies**
These cookies enable enhanced functionality and personalization:
- Language preference (English, Spanish, French, Indonesian)
- Currency preference (USD, EUR, GBP, AUD)
- Dark/light mode theme preference
- Recently viewed games and search history
- Your preferred payment method for faster checkout
- Notification preferences and dismissed alerts

Legal basis: Consent.

**3.4 Marketing and Advertising Cookies**
These cookies track your browsing habits to deliver advertising more relevant to your interests. They are set by our advertising partners and are only activated with your explicit consent:
- Cross-site tracking pixels from advertising networks
- Retargeting cookies to show you relevant product ads
- Conversion tracking to measure campaign effectiveness
- Social media integration cookies (Facebook Pixel, TikTok Pixel)

Legal basis: Consent only. You may opt out at any time.

**3.5 Affiliate and Referral Tracking Cookies**
If you arrive at NoxyStore through an affiliate link or referral code, we use cookies to:
- Attribute your first purchase to the correct affiliate partner
- Track referral conversions for commission calculation
- Maintain your referral session across multiple visits (30-day window)
- Associate your account with any applicable referral bonuses

Legal basis: Contract performance (affiliate agreement) and legitimate interests.`
      },
      {
        heading: "4. Specific Cookies We Set",
        body: `Below is a detailed inventory of the primary cookies NoxyStore sets:

| Cookie Name | Type | Duration | Purpose |
|---|---|---|---|
| sb-auth-token | Necessary | Session | Supabase authentication JWT |
| sb-refresh-token | Necessary | 30 days | OAuth token refresh |
| noxy-session | Necessary | Session | Current session identifier |
| noxy-cart | Functional | 7 days | Shopping cart contents |
| noxy-lang | Functional | 1 year | Language preference |
| noxy-currency | Functional | 1 year | Currency preference |
| noxy-theme | Functional | 1 year | Dark/light mode preference |
| noxy-analytics | Analytics | 2 years | Anonymous analytics session ID |
| noxy-referral | Affiliate | 30 days | Affiliate referral tracking |
| _ga | Analytics | 2 years | Google Analytics identifier |
| _fbp | Marketing | 90 days | Facebook Pixel (with consent) |

This list is not exhaustive and may change as we update our platform. Third-party service providers may set additional cookies subject to their own privacy policies.`
      },
      {
        heading: "5. Third-Party Cookies",
        body: `We use several third-party services that may set their own cookies on your device:

**Supabase (Authentication and Database):** Our backend infrastructure provider sets cookies related to authentication, session management, and real-time subscriptions. See Supabase's privacy policy at supabase.com/privacy.

**Stripe (Payment Processing):** When you make a payment, Stripe sets cookies to prevent fraud, manage the payment session, and remember your payment preferences. See Stripe's cookie policy at stripe.com/cookie-settings.

**PayPal:** If you choose to pay via PayPal, PayPal sets cookies to manage the payment flow and fraud detection. See PayPal's privacy policy for details.

**Google Analytics:** We may use Google Analytics to understand how users navigate our platform. Google Analytics sets cookies to collect aggregated traffic data. See Google's privacy policy at policies.google.com.

**Google OAuth:** If you sign in with Google, Google sets authentication-related cookies. See Google's privacy policy for details.

**Trustpilot:** We use Trustpilot's widget to display customer reviews, which may set cookies for widget functionality and review verification.

**Intercom / Chat Provider:** Our live chat support may use third-party chat services that set session-related cookies.`
      },
      {
        heading: "6. Managing Your Cookie Preferences",
        body: `You have several options to control and manage cookies:

**6.1 Cookie Preference Center**
You can manage your cookie preferences through our Cookie Preference Center, accessible via the 'Cookie Settings' link in our website footer. You can accept or decline each category of non-essential cookies.

**6.2 Browser Settings**
Most web browsers allow you to control cookies through their settings. You can:
- Block all cookies (note: this may break core website functionality)
- Block third-party cookies only
- Clear existing cookies from your device
- Enable private/incognito browsing mode

Browser-specific instructions:
- **Chrome:** Settings → Privacy and Security → Cookies and other site data
- **Firefox:** Settings → Privacy & Security → Cookies and Site Data
- **Safari:** Preferences → Privacy → Manage Website Data
- **Edge:** Settings → Cookies and site permissions → Cookies and site data
- **Opera:** Settings → Advanced → Privacy & security → Site settings → Cookies

**6.3 Opt-Out of Analytics**
You can opt out of Google Analytics tracking by installing the Google Analytics Opt-out Browser Add-on at tools.google.com/dlpage/gaoptout.

**6.4 Opt-Out of Interest-Based Advertising**
You can opt out of interest-based advertising from participating companies at:
- optout.aboutads.info (Digital Advertising Alliance)
- youronlinechoices.com (European Interactive Digital Advertising Alliance)
- networkadvertising.org/choices (Network Advertising Initiative)

**6.5 Mobile Device Settings**
On mobile devices, you can control ad tracking through your device settings:
- **iOS:** Settings → Privacy & Security → Tracking → Allow Apps to Request to Track (disable)
- **Android:** Settings → Google → Ads → Opt out of Ads Personalization`
      },
      {
        heading: "7. Do Not Track Signals",
        body: `Some browsers include a 'Do Not Track' (DNT) feature that signals to websites that you do not want your browsing activity tracked. Currently, there is no industry-standard response to DNT signals, and our website does not currently alter its data collection and use practices when it receives a DNT signal from your browser.

We will continue to monitor developments in the DNT field and update our practices as standards emerge.`
      },
      {
        heading: "8. Cookies and Children",
        body: `NoxyStore does not knowingly collect personal data from children under 13 through cookies or any other means. If you believe a child under 13 has provided us with personal information or is using our services, please contact us at privacy@noxystore.com immediately, and we will take appropriate action to remove their information from our systems.`
      },
      {
        heading: "9. Impact of Disabling Cookies",
        body: `If you choose to disable certain categories of cookies, please be aware of the potential impact on your experience:

**Disabling Necessary Cookies:** You will be unable to log in, maintain a shopping cart, or complete purchases. Core functionality of the NoxyStore platform will not work.

**Disabling Functional Cookies:** Your language, currency, and theme preferences will not be saved between sessions. You will need to re-select these settings each time you visit.

**Disabling Analytics Cookies:** NoxyStore will not be able to measure and improve the performance of our platform. However, this will have no direct impact on your user experience.

**Disabling Marketing Cookies:** You will still see advertisements, but they will be less relevant to your interests. You will also not receive personalized promotional offers.`
      },
      {
        heading: "10. Updates to This Cookie Policy",
        body: `We may update this Cookie Policy from time to time to reflect changes in our practices, the technologies we use, or regulatory requirements. We will post any updates to this page and indicate the date of the latest revision. For significant changes, we may provide additional notice through email or a banner on our website.

We encourage you to review this Cookie Policy periodically to stay informed about how we use cookies.`
      },
      {
        heading: "11. Contact Us",
        body: `If you have any questions about our use of cookies or this Cookie Policy, please contact us:

**Email:** privacy@noxystore.com
**Support:** support@noxystore.com
**Website:** https://noxystore.com/support

For GDPR-related cookie inquiries in the EU/EEA, you may contact our Data Protection Officer at dpo@noxystore.com, or lodge a complaint with your local supervisory authority.`
      }
    ]
  },
  es: {
    title: "Política de Cookies",
    updated: "Última actualización: 10 de mayo de 2026",
    intro: "Esta Política de Cookies explica cómo NoxyStore.com usa cookies y tecnologías de seguimiento similares cuando visita nuestro sitio web o usa nuestra aplicación móvil. Al continuar usando nuestra plataforma, usted consiente nuestro uso de cookies como se describe en esta política.",
    sections: [
      { heading: "1. ¿Qué son las Cookies?", body: "Las cookies son pequeños archivos de texto que se colocan en su dispositivo cuando visita un sitio web. Se utilizan ampliamente para hacer que los sitios web funcionen de manera más eficiente, proporcionar funcionalidad y recopilar información analítica." },
      { heading: "2. Tipos de Cookies que Usamos", body: "Utilizamos cookies estrictamente necesarias (para autenticación y seguridad), cookies de rendimiento (para análisis anónimo), cookies funcionales (para sus preferencias de idioma, moneda y tema) y cookies de marketing (solo con su consentimiento explícito)." },
      { heading: "3. Cookies de Terceros", body: "Utilizamos varios servicios de terceros que pueden establecer sus propias cookies: Supabase (autenticación), Stripe (procesamiento de pagos), Google Analytics (análisis de tráfico) y Google OAuth (inicio de sesión con Google)." },
      { heading: "4. Gestión de sus Preferencias de Cookies", body: "Puede gestionar sus preferencias de cookies a través de nuestro Centro de Preferencias de Cookies, la configuración de su navegador, o mediante las herramientas de exclusión de análisis y publicidad basada en intereses proporcionadas por los respectivos proveedores." },
      { heading: "5. Impacto de Deshabilitar las Cookies", body: "Deshabilitar las cookies necesarias impedirá el inicio de sesión y las compras. Deshabilitar las cookies funcionales significa que sus preferencias no se guardarán entre sesiones. Las cookies de análisis y marketing se pueden deshabilitar sin impacto directo en la funcionalidad principal." },
      { heading: "6. Contacto", body: "Para preguntas sobre nuestra política de cookies, contáctenos en: privacy@noxystore.com" }
    ]
  },
  fr: {
    title: "Politique des Cookies",
    updated: "Dernière mise à jour : 10 mai 2026",
    intro: "Cette Politique des Cookies explique comment NoxyStore.com utilise les cookies et les technologies de suivi similaires lorsque vous visitez notre site web ou utilisez notre application mobile. En continuant à utiliser notre plateforme, vous consentez à notre utilisation des cookies telle que décrite dans cette politique.",
    sections: [
      { heading: "1. Que sont les Cookies ?", body: "Les cookies sont de petits fichiers texte placés sur votre appareil lorsque vous visitez un site web. Ils sont largement utilisés pour faire fonctionner les sites web plus efficacement, fournir des fonctionnalités et collecter des informations analytiques." },
      { heading: "2. Types de Cookies que nous utilisons", body: "Nous utilisons des cookies strictement nécessaires (pour l'authentification et la sécurité), des cookies de performance (pour l'analyse anonyme), des cookies fonctionnels (pour vos préférences de langue, de devise et de thème) et des cookies marketing (uniquement avec votre consentement explicite)." },
      { heading: "3. Cookies Tiers", body: "Nous utilisons plusieurs services tiers qui peuvent placer leurs propres cookies : Supabase (authentification), Stripe (traitement des paiements), Google Analytics (analyse du trafic) et Google OAuth (connexion avec Google)." },
      { heading: "4. Gestion de vos Préférences", body: "Vous pouvez gérer vos préférences de cookies via notre Centre de Préférences de Cookies, les paramètres de votre navigateur, ou via les outils d'exclusion fournis par les fournisseurs respectifs." },
      { heading: "5. Impact de la Désactivation des Cookies", body: "La désactivation des cookies nécessaires empêchera la connexion et les achats. La désactivation des cookies fonctionnels signifie que vos préférences ne seront pas sauvegardées entre les sessions. Les cookies d'analyse et de marketing peuvent être désactivés sans impact direct sur la fonctionnalité principale." },
      { heading: "6. Contact", body: "Pour les questions sur notre politique de cookies, contactez-nous à : privacy@noxystore.com" }
    ]
  },
  id: {
    title: "Kebijakan Cookie",
    updated: "Terakhir diperbarui: 10 Mei 2026",
    intro: "Kebijakan Cookie ini menjelaskan bagaimana NoxyStore.com menggunakan cookie dan teknologi pelacakan serupa saat Anda mengunjungi situs web kami atau menggunakan aplikasi seluler kami. Dengan terus menggunakan platform kami, Anda menyetujui penggunaan cookie kami sebagaimana dijelaskan dalam kebijakan ini.",
    sections: [
      { heading: "1. Apa itu Cookie?", body: "Cookie adalah file teks kecil yang ditempatkan di perangkat Anda saat Anda mengunjungi situs web. Cookie banyak digunakan untuk membuat situs web bekerja lebih efisien, menyediakan fungsionalitas, dan mengumpulkan informasi analitik." },
      { heading: "2. Jenis Cookie yang Kami Gunakan", body: "Kami menggunakan cookie yang sangat diperlukan (untuk autentikasi dan keamanan), cookie kinerja (untuk analisis anonim), cookie fungsional (untuk preferensi bahasa, mata uang, dan tema Anda), dan cookie pemasaran (hanya dengan persetujuan eksplisit Anda)." },
      { heading: "3. Cookie Pihak Ketiga", body: "Kami menggunakan beberapa layanan pihak ketiga yang dapat menempatkan cookie mereka sendiri: Supabase (autentikasi), Stripe (pemrosesan pembayaran), Google Analytics (analisis lalu lintas), dan Google OAuth (masuk dengan Google)." },
      { heading: "4. Mengelola Preferensi Cookie Anda", body: "Anda dapat mengelola preferensi cookie Anda melalui Pusat Preferensi Cookie kami, pengaturan browser Anda, atau melalui alat pengecualian yang disediakan oleh penyedia masing-masing." },
      { heading: "5. Dampak Menonaktifkan Cookie", body: "Menonaktifkan cookie yang diperlukan akan mencegah login dan pembelian. Menonaktifkan cookie fungsional berarti preferensi Anda tidak akan disimpan antar sesi. Cookie analitik dan pemasaran dapat dinonaktifkan tanpa dampak langsung pada fungsionalitas inti." },
      { heading: "6. Kontak", body: "Untuk pertanyaan tentang kebijakan cookie kami, hubungi kami di: privacy@noxystore.com" }
    ]
  }
};

export function CookiePage() {
  const navigate = useNavigate();
  const { language } = useSettingsStore();
  const lang = (["en","es","fr","id"].includes(language) ? language : "en") as keyof typeof CONTENT;
  const content = CONTENT[lang];

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <div className="hidden lg:block"><DesktopHeader /></div>
      <div className="lg:hidden"><Header /></div>

      <div className="max-w-3xl mx-auto px-4 py-8 pb-32 lg:pb-16">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-gray-800 mb-6 text-sm font-medium">
          <ArrowLeft size={16} /> Back
        </button>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-amber-700 to-orange-600 px-8 py-10 text-white">
            <div className="flex items-center gap-3 mb-3">
              <Cookie size={28} className="text-yellow-200" />
              <span className="text-yellow-200 text-sm font-bold uppercase tracking-widest">NoxyStore</span>
            </div>
            <h1 className="text-3xl font-black mb-2">{content.title}</h1>
            <p className="text-orange-100 text-sm">{content.updated}</p>
          </div>

          <div className="px-8 py-6 border-b border-gray-100 bg-gray-50">
            <p className="text-gray-600 leading-relaxed text-sm">{content.intro}</p>
          </div>

          <div className="px-8 py-6 space-y-8">
            {content.sections.map((section, idx) => (
              <div key={idx}>
                <h2 className="text-lg font-bold text-gray-900 mb-3">{section.heading}</h2>
                <div className="text-gray-600 leading-relaxed text-sm whitespace-pre-line">{section.body}</div>
              </div>
            ))}
          </div>

          <div className="px-8 py-6 bg-gray-50 border-t border-gray-100 flex flex-wrap gap-4">
            <button onClick={() => navigate("/privacy")} className="text-sm text-blue-600 hover:underline font-medium">Privacy Policy</button>
            <button onClick={() => navigate("/terms")} className="text-sm text-blue-600 hover:underline font-medium">Terms of Service</button>
            <button onClick={() => navigate("/support")} className="text-sm text-blue-600 hover:underline font-medium">Contact Support</button>
          </div>
        </div>
      </div>

      <div className="hidden lg:block"><Footer /></div>
      <div className="lg:hidden"><MobileFooter /></div>
      <div className="lg:hidden"><BottomNav /></div>
    </div>
  );
}
