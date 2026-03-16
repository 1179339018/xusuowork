"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const common_vendor = require("./common/vendor.js");
const store_user = require("./store/user.js");
if (!Math) {
  "./pages/index/index.js";
  "./pages/input/index.js";
  "./pages/street/index.js";
  "./pages/community/index.js";
  "./pages/detail/index.js";
  "./pages/login/index.js";
  "./pages/mine/index.js";
  "./pages/admin/user-list.js";
}
const _sfc_main = {
  onLaunch: function() {
    this.checkLogin();
  },
  onShow: function() {
  },
  onHide: function() {
  },
  methods: {
    async checkLogin() {
      try {
        const userStore = store_user.useUserStore();
        if (userStore.manuallyLoggedOut) {
          common_vendor.index.__f__("log", "at App.vue:28", "用户手动退出，跳过静默登录");
          return;
        }
        const loginRes = await common_vendor.index.login({
          provider: "weixin"
        });
        if (loginRes.code) {
          const res = await common_vendor.tr.callFunction({
            name: "login",
            data: {
              code: loginRes.code
            }
          });
          if (res.result.success) {
            userStore.setUser(res.result.userInfo);
            common_vendor.index.setStorageSync("openid", res.result.userInfo.openid);
            common_vendor.index.switchTab({
              url: "/pages/index/index"
            });
          }
        }
      } catch (e) {
        common_vendor.index.__f__("error", "at App.vue:60", "静默登录失败", e);
      }
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return {};
}
const App = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
function createApp() {
  const app = common_vendor.createSSRApp(App);
  const pinia = common_vendor.createPinia();
  app.use(pinia);
  return {
    app
  };
}
createApp().app.mount("#app");
exports.createApp = createApp;
//# sourceMappingURL=../.sourcemap/mp-weixin/app.js.map
