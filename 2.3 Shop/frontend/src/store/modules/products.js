import productService from '../../services/productService';

const state = {
  items: [],
  loading: false,
  error: '',
};

const mutations = {
  SET_LOADING(currentState, value) {
    currentState.loading = value;
  },
  SET_ERROR(currentState, value) {
    currentState.error = value;
  },
  SET_ITEMS(currentState, items) {
    currentState.items = items;
  },
  ADD_ITEM(currentState, item) {
    currentState.items.unshift(item);
  },
  REPLACE_ITEM(currentState, item) {
    const index = currentState.items.findIndex((product) => product._id === item._id);
    if (index !== -1) currentState.items.splice(index, 1, item);
  },
  REMOVE_ITEM(currentState, id) {
    currentState.items = currentState.items.filter((product) => product._id !== id);
  },
};

const actions = {
  async fetchProducts({ commit }) {
    commit('SET_LOADING', true);
    commit('SET_ERROR', '');
    try {
      const { data } = await productService.list();
      commit('SET_ITEMS', data.data || []);
      return data.data || [];
    } catch (error) {
      commit('SET_ERROR', error.response?.data?.message || 'โหลดสินค้าไม่สำเร็จ');
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },
  async createProduct({ commit }, payload) {
    const { data } = await productService.create(payload);
    commit('ADD_ITEM', data.data);
    return data.data;
  },
  async updateProduct({ commit }, { id, payload }) {
    const { data } = await productService.update(id, payload);
    commit('REPLACE_ITEM', data.data);
    return data.data;
  },
  async deleteProduct({ commit }, id) {
    await productService.remove(id);
    commit('REMOVE_ITEM', id);
  },
};

export default {
  namespaced: true,
  state,
  getters: {
    products: (currentState) => currentState.items,
  },
  mutations,
  actions,
};
