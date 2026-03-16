"use strict";
const common_vendor = require("../../common/vendor.js");
const store_user = require("../../store/user.js");
const _sfc_main = {
  __name: "index",
  setup(__props) {
    const userStore = store_user.useUserStore();
    const loading = common_vendor.ref(false);
    const phone = common_vendor.ref("");
    common_vendor.onMounted(() => {
      checkAutoLogin();
    });
    const checkAutoLogin = async () => {
      if (userStore.manuallyLoggedOut) {
        common_vendor.index.__f__("log", "at pages/login/index.vue:57", "用户手动退出，跳过静默自动登录");
        return;
      }
      if (userStore.isLogin) {
        common_vendor.index.switchTab({
          url: "/pages/index/index"
        });
      } else {
        await silentLogin(true);
      }
    };
    const handleLogin = async () => {
      if (phone.value && phone.value.length === 11) {
        loading.value = true;
        try {
          const loginRes = await common_vendor.index.login({
            provider: "weixin"
          });
          if (loginRes.errMsg !== "login:ok") {
            throw new Error("微信登录失败");
          }
          const { result } = await common_vendor.tr.callFunction({
            name: "login",
            data: {
              code: loginRes.code,
              phone: phone.value
            }
          });
          if (!result.success) {
            throw new Error(result.error);
          }
          const userInfo = result.userInfo;
          userStore.setUser(userInfo);
          common_vendor.index.showToast({
            title: `欢迎回来，${userInfo.name || "用户"}`,
            icon: "success"
          });
          setTimeout(() => {
            common_vendor.index.switchTab({
              url: "/pages/index/index"
            });
          }, 1500);
        } catch (error) {
          common_vendor.index.__f__("error", "at pages/login/index.vue:110", error);
          common_vendor.index.showModal({
            title: "登录失败",
            content: error.message || "请重试",
            showCancel: false
          });
        } finally {
          loading.value = false;
        }
      } else {
        common_vendor.index.showToast({
          title: "请输入正确的手机号",
          icon: "none"
        });
      }
    };
    const silentLogin = async (isSilent = false) => {
      if (!isSilent) {
        loading.value = true;
      }
      try {
        const loginRes = await common_vendor.index.login({
          provider: "weixin"
        });
        if (loginRes.errMsg !== "login:ok") {
          if (!isSilent) {
            throw new Error("微信登录失败");
          }
          return;
        }
        const { result } = await common_vendor.tr.callFunction({
          name: "login",
          data: {
            code: loginRes.code
          }
        });
        if (result.success) {
          const userInfo = result.userInfo;
          userStore.setUser(userInfo);
          if (!isSilent) {
            common_vendor.index.showToast({
              title: `欢迎回来，${userInfo.name || "用户"}`,
              icon: "success"
            });
          }
          setTimeout(() => {
            common_vendor.index.switchTab({
              url: "/pages/index/index"
            });
          }, isSilent ? 0 : 1500);
        } else if (result.needBind) {
          if (!isSilent) {
            useManualLogin.value = true;
            common_vendor.index.showToast({
              title: "首次登录请验证手机号",
              icon: "none"
            });
          }
        } else if (!isSilent) {
          throw new Error(result.error);
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/login/index.vue:182", error);
        if (!isSilent) {
          common_vendor.index.showToast({
            title: error.message || "登录失败",
            icon: "none"
          });
        }
      } finally {
        if (!isSilent) {
          loading.value = false;
        }
      }
    };
    return (_ctx, _cache) => {
      return {
        a: phone.value,
        b: common_vendor.o(($event) => phone.value = $event.detail.value),
        c: common_vendor.t(loading.value ? "登录中..." : "登录"),
        d: common_vendor.o(handleLogin),
        e: loading.value
      };
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-d08ef7d4"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/login/index.js.map
