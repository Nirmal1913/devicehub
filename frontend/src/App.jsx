import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Header } from './components/Header';
import { DeviceList } from './pages/DeviceList';
import { DeviceDetail } from './pages/DeviceDetail';
import { MyActivity } from './pages/MyActivity';
import { AdminLogin } from './pages/AdminLogin';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminAnalytics } from './pages/AdminAnalytics';
import { AdminDevices } from './pages/AdminDevices';

export default function App() {
  return (
    <BrowserRouter>
      <Header />
      <Routes>
        <Route path="/" element={<DeviceList />} />
        <Route path="/devices/:id" element={<DeviceDetail />} />
        <Route path="/my-activity" element={<MyActivity />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/analytics" element={<AdminAnalytics />} />
        <Route path="/admin/devices" element={<AdminDevices />} />
      </Routes>
    </BrowserRouter>
  );
}
