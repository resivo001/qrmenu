import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import SuperAdmin from './pages/SuperAdmin.jsx'
import RestaurantAdmin from './pages/RestaurantAdmin.jsx'
import CustomerMenu from './pages/CustomerMenu.jsx'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/menu" replace />} />
        <Route path="/super-admin" element={<SuperAdmin />} />
        <Route path="/admin" element={<RestaurantAdmin />} />
        <Route path="/menu" element={<CustomerMenu />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
