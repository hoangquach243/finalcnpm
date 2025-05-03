import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store/store';
import UserApp from './user/UserApp';
import AdminApp from './admin/AdminApp';
import Login from './user/components/Login';

function App() {
  return (
    <Provider store={store}>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/user/*" element={<UserApp />} />
          <Route path="/admin/*" element={<AdminApp />} />
          <Route path="/" element={<Login />} />
        </Routes>
      </Router>
    </Provider>
  );
}

export default App;