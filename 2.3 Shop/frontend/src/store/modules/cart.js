import orderService from '../../services/orderService';

const readCart = () => {
  try {
    const saved = JSON.parse(localStorage.getItem('shop_cart') || '[]');
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
};

const persist = (items) => localStorage.setItem('shop_cart', JSON.stringify(items));

const state = {
  items: readCart(),
};

const getters = {
  items: (currentState) => currentState.items,
  count: (currentState) => currentState.items.reduce((sum, item) => sum + item.quantity, 0),
  total: (currentState) =>
    currentState.items.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
};

const mutations = {
  ADD_ITEM(currentState, { product, quantity }) {
    const existing = currentState.items.find((item) => item.product._id === product._id);
    if (existing) {
      existing.quantity += quantity;
      existing.product = product;
    } else {
      currentState.items.push({ product, quantity });
    }
    persist(currentState.items);
  },
  UPDATE_QUANTITY(currentState, { id, quantity }) {
    const item = currentState.items.find((entry) => entry.product._id === id);
    if (item) item.quantity = quantity;
    persist(currentState.items);
  },
  REMOVE_ITEM(currentState, id) {
    currentState.items = currentState.items.filter((item) => item.product._id !== id);
    persist(currentState.items);
  },
  CLEAR(currentState) {
    currentState.items = [];
    persist(currentState.items);
  },
  REPLACE_ITEMS(currentState, items) {
    currentState.items = items;
    persist(items);
  },
};

const actions = {
  addToCart({ commit, state: currentState }, { product, quantity = 1 }) {
    if (!product || product.stock < quantity || quantity < 1) {
      throw new Error('จำนวนสินค้าไม่ถูกต้องหรือสินค้าไม่เพียงพอ');
    }
    const existing = currentState.items.find((item) => item.product._id === product._id);
    const nextQuantity = (existing?.quantity || 0) + quantity;
    if (nextQuantity > product.stock) throw new Error('จำนวนสินค้าในตะกร้าเกินสต็อก');
    commit('ADD_ITEM', { product, quantity });
  },
  updateQuantity({ commit, state: currentState }, { id, quantity }) {
    const item = currentState.items.find((entry) => entry.product._id === id);
    if (!item || quantity < 1 || quantity > item.product.stock) {
      throw new Error('จำนวนสินค้าไม่ถูกต้องหรือเกินสต็อก');
    }
    commit('UPDATE_QUANTITY', { id, quantity });
  },
  removeItem({ commit }, id) {
    commit('REMOVE_ITEM', id);
  },
  clear({ commit }) {
    commit('CLEAR');
  },
  validateWithProducts({ commit, state: currentState }, products) {
    const currentProducts = new Map(products.map((product) => [product._id, product]));
    const validItems = currentState.items
      .map((item) => {
        const product = currentProducts.get(item.product._id);
        if (!product || product.stock < 1) return null;
        return { product, quantity: Math.min(item.quantity, product.stock) };
      })
      .filter(Boolean);
    commit('REPLACE_ITEMS', validItems);
  },
  async checkout({ commit, state: currentState }) {
    const items = currentState.items.map((item) => ({
      product: item.product._id,
      quantity: item.quantity,
    }));
    const { data } = await orderService.createOrder(items);
    commit('CLEAR');
    return data.data;
  },
};

export default { namespaced: true, state, getters, mutations, actions };
