import { useNavigate } from "react-router-dom";
import { ArrowLeft, Shield } from "lucide-react";
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
    title: "Privacy Policy",
    updated: "Last updated: May 10, 2026",
    intro: "NoxyStore.com ('NoxyStore', 'we', 'our', or 'us') is committed to protecting your personal information and your right to privacy. This Privacy Policy explains in detail how we collect, use, share, and safeguard your information when you visit our website at noxystore.com, use our mobile application, or interact with us in other related ways. Please read this policy carefully. If you disagree with any terms of this Privacy Policy, please discontinue use of our services immediately.",
    sections: [
      {
        heading: "1. Information We Collect",
        body: `We collect information you provide directly to us, automatically when you use our services, and from third-party sources. The categories of information we may collect include:

**Personal Identification Information:** Full name, email address, username, date of birth, phone number, and profile picture when you register an account or update your profile.

**Payment and Transaction Information:** Order history, top-up amounts, selected SKUs, game IDs, and in-game user identifiers (such as Free Fire UID, MLBB ID, etc.) that you provide during checkout. We do not store full credit card numbers; payment processing is handled by PCI-DSS compliant third-party processors.

**Technical and Device Information:** IP address, browser type and version, operating system, device identifiers, referring URLs, pages visited, time and date of access, clickstream data, and session duration.

**Communications:** Any messages you send through our live chat, AI support system, feedback forms, or email correspondence with our team.

**Affiliate and Referral Data:** Referral codes, affiliate store configurations, affiliated user emails, commission data, and traffic statistics associated with your affiliate account.

**Authentication Credentials:** Encrypted passwords (never stored in plain text), One-Time Passwords (OTPs) for email verification, Google OAuth tokens, and WebAuthn passkey credentials.

**Analytics and Behavioral Data:** Pages viewed, search queries, products clicked, time spent per page, coupon usage, and purchase funnel steps.`
      },
      {
        heading: "2. How We Use Your Information",
        body: `We use the information we collect for the following purposes:

**Service Delivery:** To process your top-up orders, deliver purchased items to your in-game accounts, send order confirmations and status updates, and facilitate refunds or dispute resolutions.

**Account Management:** To create and maintain your account, authenticate your identity, enforce account security, and provide access to personalized features.

**Customer Support:** To respond to your inquiries, troubleshoot technical issues, investigate fraud or abuse, and improve our support processes.

**Personalization:** To remember your preferences, language settings, currency choices, and previously used payment methods; and to recommend games and products relevant to your interests.

**Marketing and Promotions:** To send promotional communications, discount offers, coupon distributions, and newsletters — but only if you have opted in. You may opt out at any time.

**Analytics and Improvement:** To analyze traffic patterns, user engagement, and product performance; to conduct A/B testing; and to continuously improve the platform's features, performance, and security.

**Legal Compliance:** To comply with applicable laws, regulations, and court orders; to respond to legal process; and to protect the rights, property, and safety of NoxyStore, our users, and the public.

**Fraud Prevention:** To detect, investigate, and prevent fraudulent transactions, abuse, and other illegal activities.`
      },
      {
        heading: "3. Legal Basis for Processing (GDPR)",
        body: `For users located in the European Economic Area (EEA) or United Kingdom, we process your personal data on the following legal grounds:

**Contract Performance:** Processing necessary to provide services you have requested, such as processing an order.

**Legitimate Interests:** Processing for our legitimate business interests, such as fraud detection, security, and service improvement, provided these interests are not overridden by your privacy rights.

**Legal Obligation:** Processing required to comply with applicable laws, tax regulations, or law enforcement requests.

**Consent:** Where we rely on your explicit consent, such as for marketing communications. You may withdraw consent at any time without affecting the lawfulness of prior processing.`
      },
      {
        heading: "4. How We Share Your Information",
        body: `We do not sell, rent, or trade your personal information to third parties for their independent marketing purposes. We may share your information in the following circumstances:

**Service Providers:** We engage trusted third-party companies and individuals to perform services on our behalf, including payment processing (Stripe, PayPal), cloud hosting (Supabase), analytics, email delivery (SendGrid), and customer support tools. These providers are contractually bound to protect your data and use it only for the services they provide to us.

**API Reseller Partners:** To fulfill your top-up orders, we share necessary game account identifiers (such as game UID, server region, and SKU details) with our game API reseller partners (including Lootbar.gg). These partners process your order data solely to deliver the purchased in-game items.

**Affiliate Program:** If you operate an affiliate store on NoxyStore, your store name, tagline, and publicly selected games are visible to other users. Commission statistics are kept private and accessible only to you.

**Legal Requirements:** We may disclose your information if required to do so by law or in response to valid legal requests from public authorities.

**Business Transfers:** In the event of a merger, acquisition, reorganization, bankruptcy, or sale of assets, your information may be transferred as part of the business transaction. We will notify you via email or prominent notice on our platform before such a transfer occurs.

**With Your Consent:** We may share your information with third parties when you explicitly authorize us to do so.`
      },
      {
        heading: "5. Cookies and Tracking Technologies",
        body: `We use cookies, web beacons, pixels, local storage, and similar tracking technologies to collect information about your interactions with our platform. Please see our Cookie Policy for detailed information.

In summary, we use:
- **Strictly Necessary Cookies:** Required for login sessions, security tokens, and core platform functionality.
- **Performance Cookies:** To analyze page load times and user flows.
- **Functional Cookies:** To remember your language, currency, and UI preferences.
- **Analytics Cookies:** To understand user behavior and improve our services.
- **Marketing Cookies:** To measure the effectiveness of promotional campaigns (only with your consent).

You can manage cookie preferences through your browser settings or our Cookie Preference Center.`
      },
      {
        heading: "6. Data Retention",
        body: `We retain your personal information for as long as necessary to fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required or permitted by law.

- **Account Data:** Retained for the lifetime of your account. If you delete your account, we will delete or anonymize your personal data within 30 days, except where retention is required by law.
- **Transaction Records:** Order history and payment records are retained for 7 years for accounting, tax, and fraud prevention purposes.
- **Support Communications:** Chat logs and email correspondence are retained for 2 years.
- **Analytics Data:** Aggregated and anonymized analytics data may be retained indefinitely.
- **Marketing Preferences:** Records of your opt-in/opt-out decisions are retained to ensure compliance with your preferences.`
      },
      {
        heading: "7. Data Security",
        body: `We implement industry-standard technical, administrative, and physical security measures to protect your personal information against unauthorized access, disclosure, alteration, and destruction. These measures include:

- TLS/SSL encryption for all data transmitted between your browser and our servers.
- AES-256 encryption for sensitive data stored at rest.
- Password hashing using bcrypt with salt rounds.
- Multi-factor authentication options including WebAuthn passkeys.
- Role-based access controls to limit employee access to personal data.
- Regular security audits and penetration testing.
- Row-Level Security (RLS) policies enforced at the database layer.

Despite our best efforts, no security system is impenetrable. In the event of a data breach that affects your rights and freedoms, we will notify you and applicable regulatory authorities as required by law, within 72 hours of becoming aware of the breach.`
      },
      {
        heading: "8. Your Rights and Choices",
        body: `Depending on your location, you may have the following rights regarding your personal data:

**Right to Access:** Request a copy of the personal information we hold about you.

**Right to Rectification:** Request correction of inaccurate or incomplete personal information.

**Right to Erasure ('Right to be Forgotten'):** Request deletion of your personal data, subject to legal retention requirements.

**Right to Restrict Processing:** Request that we limit how we use your data in certain circumstances.

**Right to Data Portability:** Request a machine-readable copy of your personal data to transfer to another service.

**Right to Object:** Object to our processing of your data for marketing or legitimate interests purposes.

**Right to Withdraw Consent:** Withdraw any previously given consent at any time.

**Right to Lodge a Complaint:** File a complaint with your local data protection authority if you believe we have violated your rights.

To exercise any of these rights, please contact us at privacy@noxystore.com. We will respond to your request within 30 days.`
      },
      {
        heading: "9. Children's Privacy",
        body: `NoxyStore is not directed at children under the age of 13, or under 16 where required by applicable law. We do not knowingly collect personal information from children. If we learn that we have inadvertently collected data from a child below the applicable minimum age, we will take prompt steps to delete that information and terminate the associated account.

Parents or guardians who believe their child has provided us with personal information are encouraged to contact us at privacy@noxystore.com so we can take appropriate action.`
      },
      {
        heading: "10. International Data Transfers",
        body: `NoxyStore operates globally and your information may be processed and stored in countries other than your country of residence. We ensure that cross-border transfers of personal data comply with applicable data protection laws by relying on:

- Standard Contractual Clauses (SCCs) approved by the European Commission.
- Adequacy decisions issued by the European Commission for certain countries.
- Your explicit consent where required.

By using our services, you acknowledge that your data may be transferred internationally and processed in countries with different data protection standards than your home country.`
      },
      {
        heading: "11. Third-Party Links and Services",
        body: `Our platform may contain links to third-party websites, social media platforms, and services that are not owned or controlled by NoxyStore. This Privacy Policy does not apply to those external sites. We strongly encourage you to review the privacy policies of any third-party services you visit. NoxyStore is not responsible for the privacy practices or content of third-party websites.`
      },
      {
        heading: "12. Changes to This Privacy Policy",
        body: `We may update this Privacy Policy from time to time to reflect changes in our practices, technology, legal requirements, or other factors. We will notify you of material changes by:

- Posting the updated policy on this page with a revised 'Last Updated' date.
- Sending an email notification to the address associated with your account.
- Displaying a prominent notice within the NoxyStore platform.

Your continued use of our services after the effective date of the updated policy constitutes your acceptance of the changes. If you do not agree to the updated policy, you must discontinue using our services.`
      },
      {
        heading: "13. Contact Information",
        body: `If you have questions, concerns, or requests related to this Privacy Policy or our data practices, please contact us:

**NoxyStore Privacy Team**
Email: privacy@noxystore.com
Support: support@noxystore.com
Website: https://noxystore.com/support

For GDPR-related inquiries, you may also contact our Data Protection Officer at dpo@noxystore.com.

We are committed to resolving privacy concerns promptly and transparently.`
      }
    ]
  },
  es: {
    title: "Política de Privacidad",
    updated: "Última actualización: 10 de mayo de 2026",
    intro: "NoxyStore.com ('NoxyStore', 'nosotros', 'nuestro') está comprometido a proteger su información personal y su derecho a la privacidad. Esta Política de Privacidad explica en detalle cómo recopilamos, usamos, compartimos y protegemos su información cuando visita nuestro sitio web, usa nuestra aplicación móvil o interactúa con nosotros de otras maneras.",
    sections: [
      { heading: "1. Información que Recopilamos", body: "Recopilamos información que usted nos proporciona directamente, información recopilada automáticamente cuando usa nuestros servicios, e información de fuentes de terceros. Esto incluye: nombre completo, dirección de correo electrónico, nombre de usuario, historial de pedidos, identificadores de cuentas de juego, dirección IP, tipo de dispositivo, datos de comportamiento en la plataforma, credenciales de autenticación cifradas, datos del programa de afiliados y comunicaciones de soporte al cliente." },
      { heading: "2. Cómo Usamos su Información", body: "Utilizamos la información recopilada para: procesar sus pedidos de recarga, gestionar su cuenta, brindar soporte al cliente, personalizar su experiencia, enviar comunicaciones de marketing (con su consentimiento), analizar el rendimiento de la plataforma, prevenir fraudes y cumplir con obligaciones legales." },
      { heading: "3. Compartir su Información", body: "No vendemos ni alquilamos su información personal. Podemos compartirla con proveedores de servicios de confianza, socios de API de juegos para el cumplimiento de pedidos, autoridades legales cuando sea requerido, y en caso de transferencias comerciales. Todos los terceros están obligados contractualmente a proteger sus datos." },
      { heading: "4. Sus Derechos", body: "Según su ubicación, puede tener derechos de acceso, rectificación, supresión, portabilidad, oposición y restricción del procesamiento de sus datos personales. Para ejercer estos derechos, contáctenos en privacy@noxystore.com." },
      { heading: "5. Seguridad de los Datos", body: "Implementamos medidas de seguridad de nivel industrial incluyendo cifrado TLS/SSL, cifrado AES-256, hash de contraseñas, autenticación multifactor, controles de acceso basados en roles y auditorías de seguridad regulares." },
      { heading: "6. Retención de Datos", body: "Conservamos su información durante el tiempo necesario para los fines descritos. Los datos de cuenta se conservan durante la vida útil de su cuenta. Los registros de transacciones se conservan durante 7 años por razones contables y fiscales." },
      { heading: "7. Cambios a esta Política", body: "Podemos actualizar esta Política de Privacidad periódicamente. Le notificaremos sobre cambios materiales por correo electrónico o mediante un aviso destacado en nuestra plataforma. Su uso continuado después de los cambios constituye su aceptación." },
      { heading: "8. Contacto", body: "Para preguntas sobre privacidad, contáctenos en: privacy@noxystore.com" }
    ]
  },
  fr: {
    title: "Politique de Confidentialité",
    updated: "Dernière mise à jour : 10 mai 2026",
    intro: "NoxyStore.com s'engage à protéger vos informations personnelles et votre droit à la vie privée. Cette Politique de Confidentialité explique en détail comment nous collectons, utilisons, partageons et protégeons vos informations lorsque vous visitez notre site web, utilisez notre application mobile ou interagissez avec nous de toute autre manière.",
    sections: [
      { heading: "1. Informations que nous collectons", body: "Nous collectons les informations que vous nous fournissez directement, les informations collectées automatiquement lors de votre utilisation de nos services et les informations provenant de sources tierces. Cela comprend : votre nom complet, adresse e-mail, nom d'utilisateur, historique des commandes, identifiants de compte de jeu, adresse IP, type d'appareil, données comportementales, identifiants de jeu et communications de support." },
      { heading: "2. Utilisation de vos informations", body: "Nous utilisons les informations collectées pour traiter vos commandes de recharge, gérer votre compte, fournir un support client, personnaliser votre expérience, envoyer des communications marketing (avec votre consentement), analyser les performances de la plateforme, prévenir les fraudes et respecter les obligations légales." },
      { heading: "3. Partage de vos informations", body: "Nous ne vendons ni ne louons vos informations personnelles. Nous pouvons les partager avec des prestataires de services de confiance, des partenaires API de jeux pour le traitement des commandes, les autorités légales si requis, et dans le cadre de transferts commerciaux. Tous les tiers sont contractuellement tenus de protéger vos données." },
      { heading: "4. Vos droits", body: "Selon votre localisation, vous pouvez disposer de droits d'accès, de rectification, d'effacement, de portabilité, d'opposition et de limitation du traitement. Pour exercer ces droits, contactez-nous à privacy@noxystore.com." },
      { heading: "5. Sécurité des données", body: "Nous mettons en œuvre des mesures de sécurité de niveau industriel incluant le chiffrement TLS/SSL, le chiffrement AES-256, le hachage des mots de passe, l'authentification multifacteur et des audits de sécurité réguliers." },
      { heading: "6. Conservation des données", body: "Nous conservons vos informations aussi longtemps que nécessaire. Les données de compte sont conservées pendant toute la durée de vie de votre compte. Les enregistrements de transactions sont conservés 7 ans à des fins comptables et fiscales." },
      { heading: "7. Modifications de cette politique", body: "Nous pouvons mettre à jour cette politique périodiquement. Nous vous informerons des changements importants par e-mail ou par un avis prominent sur notre plateforme." },
      { heading: "8. Contact", body: "Pour toute question relative à la confidentialité, contactez-nous à : privacy@noxystore.com" }
    ]
  },
  id: {
    title: "Kebijakan Privasi",
    updated: "Terakhir diperbarui: 10 Mei 2026",
    intro: "NoxyStore.com berkomitmen untuk melindungi informasi pribadi Anda dan hak privasi Anda. Kebijakan Privasi ini menjelaskan secara rinci bagaimana kami mengumpulkan, menggunakan, berbagi, dan melindungi informasi Anda saat Anda mengunjungi situs web kami, menggunakan aplikasi seluler kami, atau berinteraksi dengan kami dengan cara lain.",
    sections: [
      { heading: "1. Informasi yang Kami Kumpulkan", body: "Kami mengumpulkan informasi yang Anda berikan langsung kepada kami, informasi yang dikumpulkan secara otomatis saat Anda menggunakan layanan kami, dan informasi dari sumber pihak ketiga. Ini mencakup: nama lengkap, alamat email, nama pengguna, riwayat pesanan, pengidentifikasi akun game, alamat IP, jenis perangkat, data perilaku, dan komunikasi dukungan pelanggan." },
      { heading: "2. Cara Kami Menggunakan Informasi Anda", body: "Kami menggunakan informasi yang dikumpulkan untuk: memproses pesanan top-up Anda, mengelola akun Anda, memberikan dukungan pelanggan, mempersonalisasi pengalaman Anda, mengirim komunikasi pemasaran (dengan persetujuan Anda), menganalisis kinerja platform, mencegah penipuan, dan mematuhi kewajiban hukum." },
      { heading: "3. Berbagi Informasi Anda", body: "Kami tidak menjual atau menyewakan informasi pribadi Anda. Kami dapat membagikannya dengan penyedia layanan tepercaya, mitra API game untuk pemenuhan pesanan, otoritas hukum jika diperlukan, dan dalam kasus transfer bisnis." },
      { heading: "4. Hak Anda", body: "Bergantung pada lokasi Anda, Anda mungkin memiliki hak akses, perbaikan, penghapusan, portabilitas, keberatan, dan pembatasan pemrosesan data pribadi Anda. Untuk menggunakan hak-hak ini, hubungi kami di privacy@noxystore.com." },
      { heading: "5. Keamanan Data", body: "Kami menerapkan langkah-langkah keamanan tingkat industri termasuk enkripsi TLS/SSL, enkripsi AES-256, hashing kata sandi, autentikasi multi-faktor, dan audit keamanan rutin." },
      { heading: "6. Retensi Data", body: "Kami menyimpan informasi Anda selama yang diperlukan. Data akun disimpan selama masa aktif akun Anda. Catatan transaksi disimpan selama 7 tahun untuk keperluan akuntansi dan pajak." },
      { heading: "7. Perubahan pada Kebijakan Ini", body: "Kami dapat memperbarui Kebijakan Privasi ini secara berkala. Kami akan memberi tahu Anda tentang perubahan material melalui email atau pemberitahuan di platform kami." },
      { heading: "8. Kontak", body: "Untuk pertanyaan tentang privasi, hubungi kami di: privacy@noxystore.com" }
    ]
  }
};

export function PrivacyPage() {
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
          {/* Header */}
          <div className="bg-gradient-to-r from-gray-900 to-gray-700 px-8 py-10 text-white">
            <div className="flex items-center gap-3 mb-3">
              <Shield size={28} className="text-yellow-400" />
              <span className="text-yellow-400 text-sm font-bold uppercase tracking-widest">NoxyStore</span>
            </div>
            <h1 className="text-3xl font-black mb-2">{content.title}</h1>
            <p className="text-gray-300 text-sm">{content.updated}</p>
          </div>

          {/* Intro */}
          <div className="px-8 py-6 border-b border-gray-100 bg-gray-50">
            <p className="text-gray-600 leading-relaxed text-sm">{content.intro}</p>
          </div>

          {/* Sections */}
          <div className="px-8 py-6 space-y-8">
            {content.sections.map((section, idx) => (
              <div key={idx}>
                <h2 className="text-lg font-bold text-gray-900 mb-3">{section.heading}</h2>
                <div className="text-gray-600 leading-relaxed text-sm whitespace-pre-line">{section.body}</div>
              </div>
            ))}
          </div>

          {/* Footer nav */}
          <div className="px-8 py-6 bg-gray-50 border-t border-gray-100 flex flex-wrap gap-4">
            <button onClick={() => navigate("/terms")} className="text-sm text-blue-600 hover:underline font-medium">Terms of Service</button>
            <button onClick={() => navigate("/cookies")} className="text-sm text-blue-600 hover:underline font-medium">Cookie Policy</button>
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
