import authService from '../../services/authService';

const savedUser = localStorage.getItem('shop_user');

const state = {
  token: localStorage.getItem('shop_token') || '',
  user: savedUser ? JSON.parse(savedUser) : null,
  loading: false,
  error: '',
};

const getters = {
  isAuthenticated: (currentState) => Boolean(currentState.token && currentState.user),
  isAdmin: (currentState) => currentState.user?.role === 'admin',
  currentUser: (currentState) => currentState.user,
};

const mutations = {
  SET_LOADING(currentState, value) {
    currentState.loading = value;
  },
  SET_ERROR(currentState, value) {
    currentState.error = value;
  },
  SET_AUTH(currentState, { token, user }) {
    currentState.token = token;
    currentState.user = user;
    localStorage.setItem('shop_token', token);
    localStorage.setItem('shop_user', JSON.stringify(user));
  },
  CLEAR_AUTH(currentState) {
    currentState.token = '';
    currentState.user = null;
    localStorage.removeItem('shop_token');
    localStorage.removeItem('shop_user');
  },
};

const actions = {
  async login({ commit }, payload) {
    commit('SET_LOADING', true);
    commit('SET_ERROR', '');
    try {
      const { data } = await authService.login(payload);
      commit('SET_AUTH', data.data);
      return data.data;
    } catch (error) {
      commit('SET_ERROR', error.response?.data?.message || 'เข้าสู่ระบบไม่สำเร็จ');
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },
  async register({ commit }, payload) {
    commit('SET_LOADING', true);
    commit('SET_ERROR', '');
    try {
      const { data } = await authService.register(payload);
      return data.data;
    } catch (error) {
      commit('SET_ERROR', error.response?.data?.message || 'สมัครสมาชิกไม่สำเร็จ');
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },
  logout({ commit }) {
    commit('CLEAR_AUTH');
  },
};

export default { namespaced: true, state, getters, mutations, actions };
