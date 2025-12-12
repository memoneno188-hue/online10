import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { Toaster } from '@/lib/toast';
import Login from '@/pages/Login';
import MainLayout from '@/components/Layout/MainLayout';
import Dashboard from '@/pages/Dashboard';
import Customers from '@/pages/Customers';
import Invoices from '@/pages/Invoices';
import ExportInvoice from '@/pages/invoices/ExportInvoice';
import ImportInvoice from '@/pages/invoices/ImportInvoice';
import TransitInvoice from '@/pages/invoices/TransitInvoice';
import FreeInvoice from '@/pages/invoices/FreeInvoice';
import Agents from '@/pages/Agents';
import AddAgent from '@/pages/agents/AddAgent';
import NewTrip from '@/pages/agents/NewTrip';
import AdditionalFees from '@/pages/agents/AdditionalFees';
import Accounts from '@/pages/Accounts';
import Employees from '@/pages/Employees';
import Reports from '@/pages/Reports';
import Settings from '@/pages/Settings';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="customers" element={<Customers />} />
        <Route path="invoices" element={<Invoices />} />
        <Route path="invoices/export" element={<ExportInvoice />} />
        <Route path="invoices/import" element={<ImportInvoice />} />
        <Route path="invoices/transit" element={<TransitInvoice />} />
        <Route path="invoices/free" element={<FreeInvoice />} />
        <Route path="agents" element={<Agents />} />
        <Route path="agents/add" element={<AddAgent />} />
        <Route path="agents/trips" element={<NewTrip />} />
        <Route path="agents/fees" element={<AdditionalFees />} />
        <Route path="accounts" element={<Accounts />} />
        <Route path="employees" element={<Employees />} />
        <Route path="reports" element={<Reports />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ThemeProvider>
          <AuthProvider>
            <AppRoutes />
            <Toaster position="top-center" />
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
