import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LoginForm from './components/LoginFrom';
import Register from './pages/Register';
import Chat from './pages/Chat';

function App() {
  console.log("App renderizada");
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginForm />} />
        <Route path="/register" element={<Register />} />
        <Route path="/chat" element={<Chat />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

