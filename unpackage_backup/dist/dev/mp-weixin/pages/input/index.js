"use strict";
const common_vendor = require("../../common/vendor.js");
const store_user = require("../../store/user.js");
const _sfc_main = {
  __name: "index",
  setup(__props, { expose: __expose }) {
    const userStore = store_user.useUserStore();
    const sourceOptions = ["接处警", "社区摸排", "工作发现"];
    const urgencyOptions = ["一般", "紧急", "特急"];
    const sourceIndex = common_vendor.ref(0);
    const formData = common_vendor.reactive({
      source: "",
      title: "",
      description: "",
      location: {
        address: "",
        latitude: null,
        longitude: null
      },
      parties: "",
      urgency: "一般",
      occur_count: 1
    });
    const markers = common_vendor.ref([]);
    const submitting = common_vendor.ref(false);
    function onSourceChange(e) {
      const index = parseInt(e.detail.value);
      sourceIndex.value = index;
      formData.source = sourceOptions[index];
    }
    function onUrgencyChange(e) {
      formData.urgency = e.detail.value;
    }
    async function chooseLocation() {
      try {
        const locationRes = await common_vendor.index.chooseLocation({
          success: (res) => {
            formData.location = {
              address: res.address,
              latitude: res.latitude,
              longitude: res.longitude
            };
            markers.value = [{
              id: 1,
              latitude: res.latitude,
              longitude: res.longitude,
              title: res.name
            }];
          },
          fail: (err) => {
            common_vendor.index.__f__("error", "at pages/input/index.vue:129", "选择位置失败", err);
            common_vendor.index.showToast({
              title: "选择位置失败",
              icon: "none"
            });
          }
        });
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/input/index.vue:137", "获取位置失败", e);
        common_vendor.index.showToast({
          title: "请授权位置权限",
          icon: "none"
        });
      }
    }
    async function submitForm() {
      if (!formData.source) {
        common_vendor.index.showToast({
          title: "请选择纠纷来源",
          icon: "none"
        });
        return;
      }
      if (!formData.title.trim()) {
        common_vendor.index.showToast({
          title: "请输入纠纷标题",
          icon: "none"
        });
        return;
      }
      if (!formData.description.trim()) {
        common_vendor.index.showToast({
          title: "请输入纠纷描述",
          icon: "none"
        });
        return;
      }
      if (!formData.location.address) {
        common_vendor.index.showToast({
          title: "请选择发生位置",
          icon: "none"
        });
        return;
      }
      submitting.value = true;
      try {
        const res = await common_vendor.tr.callFunction({
          name: "pushToStreet",
          data: {
            disputeData: formData,
            userInfo: {
              openid: userStore.openid,
              name: userStore.name
            }
          }
        });
        if (res.result.success) {
          common_vendor.index.showToast({
            title: "提交成功",
            icon: "success"
          });
          setTimeout(() => {
            formData.source = "";
            formData.title = "";
            formData.description = "";
            formData.location = { address: "", latitude: null, longitude: null };
            formData.parties = "";
            formData.urgency = "一般";
            formData.occur_count = 1;
            markers.value = [];
            sourceIndex.value = 0;
            common_vendor.index.switchTab({
              url: "/pages/index/index"
            });
          }, 1500);
        } else {
          throw new Error(res.result.error || "提交失败");
        }
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/input/index.vue:220", "提交失败", e);
        common_vendor.index.showToast({
          title: e.message || "提交失败",
          icon: "none"
        });
      } finally {
        submitting.value = false;
      }
    }
    const onShareAppMessage = () => {
      return {
        title: "纠纷录入",
        path: "/pages/input/index",
        desc: "快速录入矛盾纠纷信息，及时处理社会问题",
        imageUrl: "/static/logo.png"
      };
    };
    __expose({
      onShareAppMessage
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.t(formData.source || "请选择纠纷来源"),
        b: !formData.source ? 1 : "",
        c: sourceOptions,
        d: sourceIndex.value,
        e: common_vendor.o(onSourceChange),
        f: formData.title,
        g: common_vendor.o(($event) => formData.title = $event.detail.value),
        h: formData.description,
        i: common_vendor.o(($event) => formData.description = $event.detail.value),
        j: formData.location.address
      }, formData.location.address ? {
        k: common_vendor.t(formData.location.address)
      } : {}, {
        l: common_vendor.o(chooseLocation),
        m: formData.location.latitude
      }, formData.location.latitude ? {
        n: formData.location.latitude,
        o: formData.location.longitude,
        p: markers.value,
        q: common_vendor.o(chooseLocation)
      } : {}, {
        r: formData.parties,
        s: common_vendor.o(($event) => formData.parties = $event.detail.value),
        t: common_vendor.f(urgencyOptions, (item, index, i0) => {
          return {
            a: item,
            b: formData.urgency === item,
            c: common_vendor.t(item),
            d: index
          };
        }),
        v: common_vendor.o(onUrgencyChange),
        w: formData.occur_count,
        x: common_vendor.o(common_vendor.m(($event) => formData.occur_count = $event.detail.value, {
          number: true
        })),
        y: common_vendor.t(submitting.value ? "提交中..." : "提交"),
        z: common_vendor.o(submitForm),
        A: submitting.value
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-b4a876a4"]]);
_sfc_main.__runtimeHooks = 2;
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/input/index.js.map
