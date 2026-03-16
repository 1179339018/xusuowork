"use strict";
const common_vendor = require("../common/vendor.js");
const useUserStore = common_vendor.defineStore("user", {
  state: () => ({
    openid: "",
    role: "",
    // '派出所' | '街道' | '社区' | '管理员'
    name: "",
    phone: "",
    avatar: "",
    community: "",
    // 社区ID（仅社区角色有）
    authorized_roles: [],
    // 授权的角色列表
    isLogin: false,
    manuallyLoggedOut: false
  }),
  getters: {
    isPolice: (state) => state.role === "派出所",
    isStreet: (state) => state.role === "街道",
    isCommunity: (state) => state.role === "社区",
    isAdmin: (state) => state.role === "管理员"
  },
  actions: {
    setUser(userInfo) {
      this.openid = userInfo.openid || "";
      this.role = userInfo.role || "";
      this.name = userInfo.name || "";
      this.phone = userInfo.phone || "";
      this.avatar = userInfo.avatar || "";
      this.community = userInfo.community || "";
      this.authorized_roles = userInfo.authorized_roles || [];
      this.isLogin = true;
      this.manuallyLoggedOut = false;
    },
    clearUser() {
      this.openid = "";
      this.role = "";
      this.name = "";
      this.phone = "";
      this.avatar = "";
      this.community = "";
      this.authorized_roles = [];
      this.isLogin = false;
    },
    logout() {
      this.clearUser();
      this.manuallyLoggedOut = true;
    },
    switchRole(newRole) {
      if (this.authorized_roles.includes(newRole)) {
        this.role = newRole;
      }
    }
  },
  persist: {
    enabled: true,
    strategies: [
      {
        key: "user",
        storage: {
          getItem: (key) => common_vendor.index.getStorageSync(key),
          setItem: (key, value) => common_vendor.index.setStorageSync(key, value),
          removeItem: (key) => common_vendor.index.removeStorageSync(key)
        }
      }
    ]
  }
});
exports.useUserStore = useUserStore;
//# sourceMappingURL=../../.sourcemap/mp-weixin/store/user.js.map
