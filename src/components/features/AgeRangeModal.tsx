
/**
 * Age Range Modal — Set age range per NoxyStore User Agreement
 * Square / sharp-cornered styling to match the site's design language.
 */
import { useState } from "react";
import { X } from "lucide-react";

const RANGES = ["0~13", "13~17", "18+"];

export function AgeRangeModal({ onClose, onSave }: {
  onClose: () => void;
  onSave: (range: string) => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4">
      <div className="bg-white w-full max-w-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 transition-colors">
            <X size={20} className="text-gray-700" />
          </button>
          <h2 className="font-bold text-gray-900 text-base">Set Your Age</h2>
          <div className="w-8" />
        </div>

        <div className="px-5 py-6">
          <p className="font-semibold text-gray-900 mb-4 text-sm">Select Your Age Range</p>

          {/* Square age range buttons */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            {RANGES.map((r) => (
              <button
                key={r}
                onClick={() => setSelected(r)}
                className={`border-2 py-5 text-sm font-bold transition-all ${
                  selected === r
                    ? "border-yellow-400 bg-yellow-400 text-black"
                    : "border-gray-200 text-gray-700 hover:border-gray-400 bg-white"
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          <p className="text-xs text-gray-500 leading-relaxed mb-4">
            To comply with local laws and protect your rights, we need to know your age range. This information is only used for age restrictions and will be kept strictly confidential.
          </p>
          <p className="text-xs text-gray-500 leading-relaxed mb-6">
            By continuing, you agree to our{" "}
            <button className="text-blue-500 underline">NoxyStore User Agreement</button>{" "}
            and acknowledge our{" "}
            <button className="text-blue-500 underline">Privacy Policy</button>.
          </p>

          <button
            onClick={() => selected && onSave(selected)}
            disabled={!selected}
            className={`w-full py-4 font-bold text-base transition-colors ${
              selected ? "bg-yellow-400 hover:bg-yellow-300 text-black" : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
