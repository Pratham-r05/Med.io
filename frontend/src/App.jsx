import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Chat from './pages/Chat';
import Documents from './pages/Documents';
import Images from './pages/Images';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/chat" replace />} />
        <Route path="chat" element={<Chat />} />
        <Route path="documents" element={<Documents />} />
        <Route path="images" element={<Images />} />
      </Route>
    </Routes>
  );
}

export default App;
