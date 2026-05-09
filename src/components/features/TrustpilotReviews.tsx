import { useEffect } from 'react';

declare global {
  interface Window {
    Trustpilot?: any;
  }
}

export default function TrustpilotReviews() {
  useEffect(() => {
    if (window.Trustpilot) {
      window.Trustpilot.loadFromElement(
        document.querySelector('.trustpilot-widget'),
        true
      );
    }
  }, []);

  return (
    <section className="hidden lg:block bg-gray-50 dark:bg-gray-900/30 py-12">
      <div className="container mx-auto px-6">
        <h2 className="text-2xl font-bold mb-8">What Our Customers Say</h2>

        {/* ✅ REAL TRUSTPILOT REVIEWS */}
        <div
          className="trustpilot-widget"
          data-locale="en-US"
          data-template-id="53aa8807dec7e10d38f59f36"
          data-businessunit-id="6957ec3e74cf034e3abd2cfb"
          data-style-height="240px"
          data-style-width="100%"
          data-theme="light"
        >
          <a
            href="https://www.trustpilot.com/review/noxystore.com"
            target="_blank"
            rel="noopener"
          >
            Trustpilot
          </a>
        </div>
      </div>
    </section>
  );
}
