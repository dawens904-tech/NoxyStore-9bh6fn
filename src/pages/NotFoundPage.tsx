import { useNavigate } from "react-router-dom";

export function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <div className="page-container bg-white min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <div className="text-8xl mb-4">🎮</div>
      <h1 className="text-4xl font-bold text-gray-900 mb-2">404</h1>
      <p className="text-gray-500 mb-8">Page not found. This level doesn't exist!</p>
      <button onClick={() => navigate("/")} className="btn-primary px-10">
        Return Home
      </button>
    </div>
  );
}
