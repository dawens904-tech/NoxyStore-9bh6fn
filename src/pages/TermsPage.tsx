import { useNavigate } from "react-router-dom";
import { ArrowLeft, FileText } from "lucide-react";
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
    title: "Terms of Service",
    updated: "Last updated: May 10, 2026",
    intro: "Welcome to NoxyStore.com. These Terms of Service ('Terms') govern your access to and use of the NoxyStore website, mobile application, and all related services (collectively, the 'Services'). By accessing or using our Services, you agree to be bound by these Terms and our Privacy Policy. If you do not agree to these Terms, please do not use our Services. These Terms constitute a legally binding agreement between you and NoxyStore Inc.",
    sections: [
      {
        heading: "1. Acceptance of Terms",
        body: `By creating an account, placing an order, or otherwise using any part of the NoxyStore platform, you confirm that:

(a) You are at least 13 years of age (or the minimum age required in your jurisdiction);
(b) You have the legal capacity to enter into a binding agreement;
(c) You have read, understood, and agree to be bound by these Terms;
(d) If you are using the Services on behalf of a business or organization, you have the authority to bind that entity to these Terms.

NoxyStore reserves the right to refuse service to anyone for any reason at any time.`
      },
      {
        heading: "2. Description of Services",
        body: `NoxyStore is an online marketplace specializing in digital gaming products, including but not limited to:

- In-game top-ups and currency (e.g., diamonds, gems, coins, UC)
- Game account services and boosting products
- Gift cards and digital vouchers
- Game keys and activation codes
- Virtual game items and cosmetics

All products are delivered digitally. NoxyStore acts as a reseller or facilitator between users and authorized game API providers. We do not develop, publish, or maintain the underlying games or platforms.

**Service Availability:** We strive to maintain 99.9% uptime but cannot guarantee uninterrupted access. Scheduled or unscheduled maintenance, third-party API outages, and circumstances beyond our control may affect service availability.`
      },
      {
        heading: "3. Account Registration and Security",
        body: `To access certain features of the Services, you must register for an account. You agree to:

(a) Provide accurate, complete, and up-to-date information during registration;
(b) Maintain the security of your account credentials and not share your password with any third party;
(c) Accept responsibility for all activities that occur under your account;
(d) Notify us immediately at support@noxystore.com if you suspect unauthorized access to your account;
(e) Not create more than one active account per person without prior written consent from NoxyStore.

We reserve the right to suspend or terminate accounts that violate these Terms, engage in fraudulent activity, or pose a security risk to other users.

**Two-Factor Authentication:** We strongly encourage enabling two-factor authentication (2FA) and/or WebAuthn passkeys to enhance your account security.`
      },
      {
        heading: "4. Ordering and Payment",
        body: `**Order Placement:** When you place an order on NoxyStore, you make an offer to purchase the selected product at the listed price. All orders are subject to availability and acceptance by NoxyStore.

**Pricing:** Prices are displayed in your selected currency and include any applicable platform fees. Prices are subject to change without prior notice, but the price at the time of your order is the price you pay.

**Payment Methods:** We accept various payment methods including credit/debit cards, PayPal, cryptocurrency, and other methods displayed at checkout. All payments are processed securely through PCI-DSS compliant payment processors.

**Currency:** Transactions are processed in USD by default. Currency conversion rates are provided for informational purposes and may differ from your bank's rates.

**Failed Payments:** If your payment fails, the order will not be processed. Please verify your payment details and try again. NoxyStore is not responsible for fees charged by your financial institution.

**Taxes:** You are responsible for any applicable taxes, duties, or levies imposed by your local jurisdiction on digital purchases.`
      },
      {
        heading: "5. Delivery of Digital Products",
        body: `**Delivery Method:** Most digital products are delivered directly to your in-game account using the information you provide (such as game UID, server, and region). Delivery typically occurs within minutes but may take up to 24 hours in exceptional circumstances.

**User Responsibility:** You are solely responsible for providing accurate account information (game ID, server region, username, etc.) at checkout. NoxyStore is not liable for delivery failures caused by incorrect user-provided information.

**Delivery Confirmation:** You will receive order status updates via email and within your account dashboard. You can track your order status at noxystore.com/orders.

**Non-Delivery:** If you do not receive your product within 24 hours of a successful payment, please contact our support team immediately. We will investigate and either complete the delivery or issue a refund.`
      },
      {
        heading: "6. Refund and Cancellation Policy",
        body: `**Digital Product Nature:** Due to the instant and irreversible nature of digital product delivery, all sales are generally final once the product has been delivered to your game account.

**Eligible Refund Scenarios:**
- Product not delivered within 24 hours of payment confirmation
- Incorrect product delivered due to a NoxyStore error
- Duplicate charges for the same order
- Technical failures on our platform preventing delivery

**Non-Refundable Scenarios:**
- Incorrect user information provided at checkout (wrong UID, server, or region)
- Change of mind after product delivery
- Account bans or restrictions imposed by the game publisher after delivery
- Products already consumed or redeemed in-game

**Refund Process:** To request a refund, contact support@noxystore.com within 7 days of the order date with your order ID and reason. Refunds are processed within 5-10 business days to your original payment method.

**Chargebacks:** Initiating an unauthorized chargeback may result in immediate account suspension. We encourage you to contact us directly to resolve payment disputes before involving your financial institution.`
      },
      {
        heading: "7. Prohibited Activities",
        body: `You agree not to engage in any of the following activities:

(a) **Fraud:** Using stolen payment methods, creating fraudulent orders, or misrepresenting your identity;
(b) **Account Abuse:** Creating multiple accounts to circumvent restrictions, bans, or to exploit promotions;
(c) **Unauthorized Access:** Attempting to gain unauthorized access to our systems, databases, or other users' accounts;
(d) **Scraping and Automation:** Using bots, scrapers, or automated tools to access or extract data from our platform without permission;
(e) **Reselling:** Reselling NoxyStore products commercially without a written affiliate or reseller agreement;
(f) **Intellectual Property Violations:** Uploading, sharing, or distributing content that infringes on any third party's intellectual property rights;
(g) **Harmful Content:** Transmitting malicious code, viruses, or any technology that harms our platform or users;
(h) **Illegal Activities:** Using our Services for any unlawful purpose or in violation of any applicable laws or regulations;
(i) **Impersonation:** Impersonating any person or entity, including NoxyStore staff;
(j) **Harassment:** Engaging in harassment, threats, or abusive behavior toward other users or our support team.

Violation of these prohibitions may result in immediate account termination, legal action, and/or reporting to appropriate authorities.`
      },
      {
        heading: "8. Intellectual Property Rights",
        body: `**NoxyStore Content:** All content on the NoxyStore platform, including but not limited to logos, trademarks, graphics, UI design, written content, code, and product descriptions, is the exclusive property of NoxyStore Inc. or its licensors and is protected by applicable intellectual property laws.

**User-Generated Content:** By submitting any content to NoxyStore (such as reviews, feedback, affiliate store descriptions, or profile information), you grant NoxyStore a non-exclusive, royalty-free, worldwide license to use, display, reproduce, and distribute such content in connection with our Services.

**Game Publisher Rights:** Game names, logos, characters, and all associated assets are the intellectual property of their respective game publishers. NoxyStore does not claim ownership of any third-party game content.

**DMCA Compliance:** We respect intellectual property rights and will respond to legitimate DMCA takedown notices. To submit a DMCA notice, email dmca@noxystore.com.`
      },
      {
        heading: "9. Disclaimer of Warranties",
        body: `THE SERVICES ARE PROVIDED 'AS IS' AND 'AS AVAILABLE' WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW, NOXYSTORE DISCLAIMS ALL WARRANTIES, INCLUDING BUT NOT LIMITED TO:

- IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
- WARRANTIES REGARDING THE ACCURACY, RELIABILITY, OR COMPLETENESS OF ANY INFORMATION
- WARRANTIES THAT THE SERVICES WILL BE UNINTERRUPTED, ERROR-FREE, OR FREE OF VIRUSES
- WARRANTIES REGARDING THIRD-PARTY API AVAILABILITY OR GAME PUBLISHER POLICIES

Your use of the Services is entirely at your own risk.`
      },
      {
        heading: "10. Limitation of Liability",
        body: `TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, NOXYSTORE AND ITS OFFICERS, DIRECTORS, EMPLOYEES, PARTNERS, AND AGENTS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, PUNITIVE, OR EXEMPLARY DAMAGES, INCLUDING BUT NOT LIMITED TO:

- Loss of profits, revenue, or data
- Loss of in-game items, currency, or account access
- Business interruption or lost opportunities
- Personal injury resulting from your use of the Services

IN NO EVENT SHALL NOXYSTORE'S TOTAL CUMULATIVE LIABILITY TO YOU EXCEED THE GREATER OF (A) THE AMOUNT YOU PAID TO NOXYSTORE IN THE 12 MONTHS PRECEDING THE CLAIM, OR (B) USD $100.

Some jurisdictions do not allow the exclusion or limitation of certain types of liability, so the above limitations may not apply to you in full.`
      },
      {
        heading: "11. Indemnification",
        body: `You agree to indemnify, defend, and hold harmless NoxyStore, its affiliates, officers, directors, employees, agents, and licensors from and against any and all claims, liabilities, damages, losses, costs, and expenses (including reasonable legal fees) arising out of or in connection with:

(a) Your use of the Services;
(b) Your violation of these Terms;
(c) Your violation of any third-party rights, including intellectual property rights;
(d) Any content you submit to the platform;
(e) Your fraudulent or illegal conduct.`
      },
      {
        heading: "12. Affiliate Program Terms",
        body: `If you participate in the NoxyStore Affiliate Program, additional terms apply:

**Eligibility:** Affiliate stores are available to registered users who complete the affiliate onboarding process and agree to the Traffic Alliance Agreement.

**Commission Structure:** Affiliates earn commissions on qualifying purchases made through their referral links or affiliate storefronts. Commission rates are published in the Affiliate Dashboard and subject to change with 30 days' notice.

**Prohibited Affiliate Practices:** Affiliates may not engage in spam, misleading advertising, cookie stuffing, trademark bidding without authorization, or any activity that creates a negative brand association with NoxyStore.

**Termination:** NoxyStore may terminate your affiliate account and withhold unpaid commissions if you violate these Terms or the Affiliate Agreement.`
      },
      {
        heading: "13. Governing Law and Dispute Resolution",
        body: `These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which NoxyStore Inc. is incorporated, without regard to conflict of law principles.

**Dispute Resolution:** Any dispute arising from these Terms or your use of the Services shall first be addressed through informal negotiation. If unresolved within 30 days, disputes shall be submitted to binding arbitration under the rules of the applicable arbitration authority.

**Class Action Waiver:** To the extent permitted by law, you waive any right to participate in a class action lawsuit or class-wide arbitration.

**Exceptions:** Either party may seek injunctive or other equitable relief in a court of competent jurisdiction to prevent irreparable harm pending arbitration.`
      },
      {
        heading: "14. Modifications to Terms",
        body: `NoxyStore reserves the right to modify these Terms at any time. We will provide at least 30 days' advance notice for material changes via email or a prominent notice on our platform. Changes will take effect on the date specified in the notice.

Your continued use of the Services after the effective date of revised Terms constitutes your acceptance of the changes. If you do not agree to the modified Terms, you must stop using our Services and may close your account.`
      },
      {
        heading: "15. Miscellaneous",
        body: `**Entire Agreement:** These Terms, together with our Privacy Policy and Cookie Policy, constitute the entire agreement between you and NoxyStore regarding your use of the Services.

**Severability:** If any provision of these Terms is found to be unenforceable, the remaining provisions will remain in full force and effect.

**Waiver:** Our failure to enforce any provision of these Terms shall not be deemed a waiver of our right to enforce such provision in the future.

**Assignment:** You may not assign your rights or obligations under these Terms without our prior written consent. NoxyStore may assign these Terms without restriction.

**Force Majeure:** NoxyStore shall not be liable for any failure or delay in performance due to circumstances beyond our reasonable control.

**Contact:** For questions about these Terms, contact us at legal@noxystore.com.`
      }
    ]
  },
  es: {
    title: "Términos de Servicio",
    updated: "Última actualización: 10 de mayo de 2026",
    intro: "Bienvenido a NoxyStore.com. Estos Términos de Servicio ('Términos') rigen su acceso y uso del sitio web NoxyStore, la aplicación móvil y todos los servicios relacionados. Al acceder o usar nuestros Servicios, usted acepta estar sujeto a estos Términos y nuestra Política de Privacidad.",
    sections: [
      { heading: "1. Aceptación de Términos", body: "Al crear una cuenta o utilizar cualquier parte de la plataforma NoxyStore, confirma que tiene al menos 13 años, capacidad legal para celebrar un acuerdo vinculante, y que ha leído y acepta estos Términos." },
      { heading: "2. Descripción de los Servicios", body: "NoxyStore es un mercado en línea especializado en productos de juegos digitales, incluyendo recargas en el juego, tarjetas de regalo, claves de juego y artículos virtuales. Actuamos como revendedor o facilitador entre usuarios y proveedores de API de juegos autorizados." },
      { heading: "3. Pedidos y Pagos", body: "Todos los precios se muestran en su moneda seleccionada. Los pagos se procesan de forma segura. Los impuestos aplicables son su responsabilidad. En caso de pago fallido, el pedido no será procesado." },
      { heading: "4. Entrega de Productos Digitales", body: "La mayoría de los productos digitales se entregan directamente a su cuenta de juego en minutos. Usted es responsable de proporcionar información de cuenta precisa. En caso de no entrega dentro de 24 horas, contáctenos." },
      { heading: "5. Política de Reembolsos", body: "Debido a la naturaleza instantánea de la entrega de productos digitales, todas las ventas son generalmente finales. Los reembolsos se aplican solo en casos de no entrega, producto incorrecto por error nuestro, o cargos duplicados." },
      { heading: "6. Actividades Prohibidas", body: "Está prohibido el fraude, abuso de cuenta, acceso no autorizado, scraping automatizado, reventa sin acuerdo, violaciones de propiedad intelectual, contenido dañino, actividades ilegales, suplantación de identidad y acoso." },
      { heading: "7. Limitación de Responsabilidad", body: "En la máxima medida permitida por la ley, NoxyStore no será responsable de daños indirectos, incidentales, especiales, consecuentes o punitivos. La responsabilidad total de NoxyStore no excederá el importe pagado en los 12 meses anteriores a la reclamación." },
      { heading: "8. Modificaciones", body: "NoxyStore se reserva el derecho de modificar estos Términos en cualquier momento con 30 días de aviso previo para cambios materiales. Su uso continuado después de la fecha efectiva constituye su aceptación de los cambios." }
    ]
  },
  fr: {
    title: "Conditions d'Utilisation",
    updated: "Dernière mise à jour : 10 mai 2026",
    intro: "Bienvenue sur NoxyStore.com. Ces Conditions d'Utilisation régissent votre accès et votre utilisation du site web NoxyStore, de l'application mobile et de tous les services associés. En accédant ou en utilisant nos Services, vous acceptez d'être lié par ces Conditions.",
    sections: [
      { heading: "1. Acceptation des Conditions", body: "En créant un compte ou en utilisant une partie quelconque de la plateforme NoxyStore, vous confirmez que vous avez au moins 13 ans, que vous avez la capacité juridique pour conclure un accord contraignant, et que vous avez lu et accepté ces Conditions." },
      { heading: "2. Description des Services", body: "NoxyStore est une place de marché en ligne spécialisée dans les produits de jeux numériques, notamment les recharges en jeu, les cartes-cadeaux, les clés de jeu et les articles virtuels. Nous agissons en tant que revendeur ou facilitateur entre les utilisateurs et les fournisseurs d'API de jeux autorisés." },
      { heading: "3. Commandes et Paiements", body: "Tous les prix sont affichés dans votre devise sélectionnée. Les paiements sont traités en toute sécurité. Les taxes applicables sont de votre responsabilité. En cas d'échec de paiement, la commande ne sera pas traitée." },
      { heading: "4. Livraison des Produits Numériques", body: "La plupart des produits numériques sont livrés directement sur votre compte de jeu en quelques minutes. Vous êtes responsable de fournir des informations de compte précises. En cas de non-livraison dans les 24 heures, contactez-nous." },
      { heading: "5. Politique de Remboursement", body: "En raison de la nature instantanée de la livraison des produits numériques, toutes les ventes sont généralement définitives. Les remboursements s'appliquent uniquement en cas de non-livraison, de produit incorrect dû à une erreur de notre part, ou de doubles facturation." },
      { heading: "6. Activités Interdites", body: "Il est interdit de commettre une fraude, d'abuser du compte, d'accéder sans autorisation, d'utiliser des outils automatisés, de revendre sans accord, de violer la propriété intellectuelle, de transmettre du contenu nuisible, d'effectuer des activités illégales, de se faire passer pour quelqu'un d'autre et de harceler." },
      { heading: "7. Limitation de Responsabilité", body: "Dans la mesure maximale permise par la loi applicable, NoxyStore ne sera pas responsable des dommages indirects, accessoires, spéciaux, consécutifs ou punitifs. La responsabilité totale de NoxyStore n'excédera pas le montant payé au cours des 12 mois précédant la réclamation." },
      { heading: "8. Modifications", body: "NoxyStore se réserve le droit de modifier ces Conditions à tout moment avec un préavis de 30 jours pour les changements importants. Votre utilisation continue après la date d'entrée en vigueur constitue votre acceptation des changements." }
    ]
  },
  id: {
    title: "Ketentuan Layanan",
    updated: "Terakhir diperbarui: 10 Mei 2026",
    intro: "Selamat datang di NoxyStore.com. Ketentuan Layanan ini mengatur akses dan penggunaan Anda terhadap situs web NoxyStore, aplikasi seluler, dan semua layanan terkait. Dengan mengakses atau menggunakan Layanan kami, Anda setuju untuk terikat oleh Ketentuan ini.",
    sections: [
      { heading: "1. Penerimaan Ketentuan", body: "Dengan membuat akun atau menggunakan bagian mana pun dari platform NoxyStore, Anda mengkonfirmasi bahwa Anda berusia minimal 13 tahun, memiliki kapasitas hukum untuk membuat perjanjian yang mengikat, dan telah membaca serta menyetujui Ketentuan ini." },
      { heading: "2. Deskripsi Layanan", body: "NoxyStore adalah marketplace online yang berspesialisasi dalam produk game digital, termasuk top-up dalam game, kartu hadiah, kunci game, dan item virtual. Kami bertindak sebagai reseller atau fasilitator antara pengguna dan penyedia API game yang berwenang." },
      { heading: "3. Pemesanan dan Pembayaran", body: "Semua harga ditampilkan dalam mata uang pilihan Anda. Pembayaran diproses dengan aman. Pajak yang berlaku adalah tanggung jawab Anda. Jika pembayaran gagal, pesanan tidak akan diproses." },
      { heading: "4. Pengiriman Produk Digital", body: "Sebagian besar produk digital dikirimkan langsung ke akun game Anda dalam hitungan menit. Anda bertanggung jawab untuk memberikan informasi akun yang akurat. Jika tidak ada pengiriman dalam 24 jam, hubungi kami." },
      { heading: "5. Kebijakan Pengembalian Dana", body: "Karena sifat pengiriman produk digital yang instan, semua penjualan umumnya bersifat final. Pengembalian dana berlaku hanya dalam kasus tidak ada pengiriman, produk yang salah karena kesalahan kami, atau tagihan ganda." },
      { heading: "6. Aktivitas yang Dilarang", body: "Dilarang melakukan penipuan, penyalahgunaan akun, akses tidak sah, penggunaan alat otomatis, penjualan kembali tanpa perjanjian, pelanggaran kekayaan intelektual, konten berbahaya, aktivitas ilegal, peniruan identitas, dan pelecehan." },
      { heading: "7. Batasan Tanggung Jawab", body: "Sejauh diizinkan oleh hukum yang berlaku, NoxyStore tidak akan bertanggung jawab atas kerusakan tidak langsung, insidental, khusus, konsekuensial, atau hukuman. Total tanggung jawab NoxyStore tidak akan melebihi jumlah yang dibayarkan dalam 12 bulan sebelum klaim." },
      { heading: "8. Modifikasi", body: "NoxyStore berhak mengubah Ketentuan ini kapan saja dengan pemberitahuan 30 hari sebelumnya untuk perubahan material. Penggunaan Anda yang berkelanjutan setelah tanggal efektif merupakan penerimaan Anda atas perubahan tersebut." }
    ]
  }
};

export function TermsPage() {
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
          <div className="bg-gradient-to-r from-blue-900 to-blue-700 px-8 py-10 text-white">
            <div className="flex items-center gap-3 mb-3">
              <FileText size={28} className="text-yellow-400" />
              <span className="text-yellow-400 text-sm font-bold uppercase tracking-widest">NoxyStore</span>
            </div>
            <h1 className="text-3xl font-black mb-2">{content.title}</h1>
            <p className="text-blue-200 text-sm">{content.updated}</p>
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
