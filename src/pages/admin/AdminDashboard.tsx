import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import AdminSidebar from './AdminSidebar';
import { Gamepad2, Box, Server } from 'lucide-react';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  useEffect(() => {
    if (user && user.role !== 'admin') {
      navigate('/');
    }
  }, [user, navigate]);

  const cards = [
    {
      label: 'Game Management',
      description: 'Add, edit, and manage all games',
      icon: Gamepad2,
      path: '/admin/games',
      color: 'bg-blue-50 text-blue-600',
    },
    {
      label: 'Product Management',
      description: 'Manage product listings and pricing',
      icon: Box,
      path: '/admin/products',
      color: 'bg-purple-50 text-purple-600',
    },
    {
      label: 'Server Management',
      description: 'Configure game servers',
      icon: Server,
      path: '/admin/games',
      color: 'bg-green-50 text-green-600',
    },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      <main className="ml-64 flex-1 p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Admin Dashboard</h1>
          <p className="text-gray-500 text-sm">Manage your NoxyStore platform</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <button
                key={card.label}
                onClick={() => navigate(card.path)}
                className="bg-white rounded-2xl border border-gray-200 p-6 text-left hover:shadow-md hover:-translate-y-0.5 transition-all"
              >
                <div className={`w-12 h-12 rounded-xl ${card.color} flex items-center justify-center mb-4`}>
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="font-bold text-gray-900 mb-1">{card.label}</h3>
                <p className="text-sm text-gray-500">{card.description}</p>
              </button>
            );
          })}
        </div>
      </main>
    </div>
  );
}
