import api from './api';

export default {
  login(payload) {
    return api.post('/login', payload);
  },
  register(payload) {
    return api.post('/register', payload);
  },
};
