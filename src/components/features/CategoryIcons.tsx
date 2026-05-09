import { useNavigate } from "react-router-dom";

const CATEGORIES = [
  {
    label: "Top Up",
    color: "bg-orange-500",
    icon: (
      <svg viewBox="0 0 24 24" fill="white" width="22" height="22">
        <path d="M12 1C6.48 1 2 5.48 2 11s4.48 10 10 10 10-4.48 10-10S17.52 1 12 1zm1 14.93V18h-2v-2.07C9.21 15.5 8 14.38 8 13c0-.55.45-1 1-1s1 .45 1 1c0 .55.45 1 1 1h2c.55 0 1-.45 1-1s-.45-1-1-1h-2C9.79 12 8 10.21 8 8.5 8 7.12 9.21 6 11 5.57V4h2v1.57C14.79 6 16 7.12 16 8.5c0 .55-.45 1-1 1s-1-.45-1-1c0-.55-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1h2c2.21 0 4 1.79 4 3.5C17 14.12 15.79 15.5 14 15.93z" />
      </svg>
    ),
    filter: "Top Up",
  },
  {
    label: "Game Coins",
    color: "bg-yellow-500",
    icon: (
      <svg viewBox="0 0 24 24" fill="white" width="22" height="22">
        <path d="M11.5 2C6.26 2 2 6.26 2 11.5S6.26 21 11.5 21 21 16.74 21 11.5 16.74 2 11.5 2zm0 17C7.36 19 4 15.64 4 11.5S7.36 4 11.5 4 19 7.36 19 11.5 15.64 19 11.5 19zm.5-11h-1v6l4.5 2.7.75-1.23-4.25-2.52V8z" />
      </svg>
    ),
    filter: "Game Coins",
  },
  {
    label: "Gift Card",
    color: "bg-pink-500",
    icon: (
      <svg viewBox="0 0 24 24" fill="white" width="22" height="22">
        <path d="M20 6h-2.18c.07-.44.18-.88.18-1.36C18 3.05 16.96 2 15.64 2c-.7 0-1.37.3-1.84.83L12 5.27 9.2 2.83C8.73 2.3 8.06 2 7.36 2 6.04 2 5 3.05 5 4.64c0 .48.11.92.18 1.36H3c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2h17c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2z" />
      </svg>
    ),
    filter: "Gift Card",
  },
  {
    label: "Game Keys",
    color: "bg-purple-600",
    isHot: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="white" width="22" height="22">
        <path d="M12.65 10C11.83 7.67 9.61 6 7 6c-3.31 0-6 2.69-6 6s2.69 6 6 6c2.61 0 4.83-1.67 5.65-4H17v4h4v-4h2v-4H12.65zM7 14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z" />
      </svg>
    ),
    filter: "Game Keys",
  },
  {
    label: "Game Items",
    color: "bg-sky-500",
    icon: (
      <svg viewBox="0 0 24 24" fill="white" width="22" height="22">
        <path d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z" />
      </svg>
    ),
    filter: "Game Items",
  },
];

export function CategoryIcons() {
  const navigate = useNavigate();

  return (
    <div className="px-3">
      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.label}
            onClick={() => navigate(`/categories?filter=${encodeURIComponent(cat.filter)}`)}
            className="flex flex-col items-center gap-2 min-w-[60px] flex-shrink-0"
          >
            <div className="relative">
              <div className={`w-14 h-14 rounded-2xl ${cat.color} flex items-center justify-center shadow-md`}>
                {cat.icon}
              </div>
              {cat.isHot && (
                <span className="absolute -top-1.5 -right-1 bg-orange-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                  HOT
                </span>
              )}
            </div>
            <span className="text-xs font-medium text-gray-600 text-center leading-tight">
              {cat.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
