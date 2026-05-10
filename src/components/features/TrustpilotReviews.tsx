import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    Trustpilot?: any;
  }
}

export default function TrustpilotReviews() {
  const widgetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tryLoad = () => {
      if (window.Trustpilot && widgetRef.current) {
        window.Trustpilot.loadFromElement(widgetRef.current, true);
      }
    };

    // Try immediately
    tryLoad();

    // Also try after a short delay (script may still be loading)
    const timer = setTimeout(tryLoad, 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section className="hidden lg:block bg-white py-10 border-t border-gray-100">
      <div className="max-w-[1280px] mx-auto px-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Trustpilot Reviews</h2>
        {/* Trustpilot Carousel Widget */}
        <div
          ref={widgetRef}
          className="trustpilot-widget"
          data-locale="en-US"
          data-template-id="53aa8807dec7e10d38f59f36"
          data-businessunit-id="6957ec3e74cf034e3abd2cfb"
          data-style-height="240px"
          data-style-width="100%"
          data-theme="light"
          data-stars="4,5"
          data-review-languages="en"
        >
          <a href="https://www.trustpilot.com/review/noxystore.com" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline text-sm">
            Read our reviews on Trustpilot
          </a>
        </div>
      </div>
    </section>
  );
}
