"use strict";
const common_vendor = require("../../common/vendor.js");
const store_user = require("../../store/user.js");
const pageSize = 10;
const _sfc_main = {
  __name: "index",
  setup(__props, { expose: __expose }) {
    const userStore = store_user.useUserStore();
    const statusTabs = common_vendor.ref([
      { label: "待回访", value: "待回访", count: 0 },
      { label: "处理中", value: "处理中", count: 0 },
      { label: "已完成", value: "已化解", count: 0 }
    ]);
    const currentStatus = common_vendor.ref("待回访");
    const taskList = common_vendor.ref([]);
    const loading = common_vendor.ref(false);
    const page = common_vendor.ref(1);
    const hasMore = common_vendor.ref(true);
    common_vendor.onMounted(() => {
      loadTaskCounts();
      loadList();
    });
    common_vendor.onShow(() => {
      loadTaskCounts();
      refresh();
    });
    async function loadTaskCounts() {
      var _a, _b;
      try {
        for (let tab of statusTabs.value) {
          const res = await common_vendor.tr.callFunction({
            name: "getDisputeList",
            data: {
              role: userStore.role,
              community: userStore.community,
              status: tab.value,
              page: 1,
              pageSize: 1
            }
          });
          if (res.result.success) {
            const countRes = await common_vendor.tr.callFunction({
              name: "getStatistics",
              data: {
                role: userStore.role,
                community: userStore.community
              }
            });
            if (tab.value === "待回访") {
              tab.count = ((_a = countRes.result.data) == null ? void 0 : _a.pendingVisit) || 0;
            } else if (tab.value === "处理中") {
              tab.count = 0;
            } else if (tab.value === "已化解") {
              tab.count = ((_b = countRes.result.data) == null ? void 0 : _b.resolved) || 0;
            }
          }
        }
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/community/index.vue:135", "加载任务数量失败", e);
      }
    }
    async function loadList() {
      if (loading.value)
        return;
      loading.value = true;
      try {
        const res = await common_vendor.tr.callFunction({
          name: "getDisputeList",
          data: {
            role: userStore.role,
            community: userStore.community,
            status: currentStatus.value,
            page: page.value,
            pageSize
          }
        });
        if (res.result.success) {
          if (page.value === 1) {
            taskList.value = res.result.data;
          } else {
            taskList.value.push(...res.result.data);
          }
          hasMore.value = res.result.hasMore;
        }
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/community/index.vue:164", "加载任务列表失败", e);
        common_vendor.index.showToast({
          title: "加载失败",
          icon: "none"
        });
      } finally {
        loading.value = false;
      }
    }
    function switchStatus(status) {
      currentStatus.value = status;
      page.value = 1;
      hasMore.value = true;
      loadList();
    }
    function refresh() {
      page.value = 1;
      hasMore.value = true;
      loadList();
    }
    function loadMore() {
      if (hasMore.value && !loading.value) {
        page.value++;
        loadList();
      }
    }
    function goToDetail(id) {
      common_vendor.index.navigateTo({
        url: `/pages/detail/index?id=${id}`
      });
    }
    function formatTime(timestamp) {
      if (!timestamp)
        return "";
      const date = new Date(timestamp);
      const now = /* @__PURE__ */ new Date();
      const diff = now - date;
      const minutes = Math.floor(diff / 6e4);
      if (minutes < 1)
        return "刚刚";
      if (minutes < 60)
        return `${minutes}分钟前`;
      if (minutes < 1440)
        return `${Math.floor(minutes / 60)}小时前`;
      return `${date.getMonth() + 1}-${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, "0")}`;
    }
    function getStatusClass(status) {
      const map = {
        "待回访": "status-pending",
        "处理中": "status-processing",
        "已化解": "status-resolved",
        "已关闭": "status-closed"
      };
      return map[status] || "";
    }
    const onShareAppMessage = () => {
      return {
        title: "社区任务管理",
        path: "/pages/community/index",
        desc: "查看和处理社区矛盾纠纷任务",
        imageUrl: "/static/logo.png"
      };
    };
    __expose({
      onShareAppMessage
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.f(statusTabs.value, (status, index, i0) => {
          return common_vendor.e({
            a: common_vendor.t(status.label),
            b: status.count > 0
          }, status.count > 0 ? {
            c: common_vendor.t(status.count)
          } : {}, {
            d: index,
            e: currentStatus.value === status.value ? 1 : "",
            f: common_vendor.o(($event) => switchStatus(status.value), index)
          });
        }),
        b: common_vendor.f(taskList.value, (item, k0, i0) => {
          var _a;
          return common_vendor.e({
            a: common_vendor.t(item.title),
            b: item.urgency === "特急"
          }, item.urgency === "特急" ? {} : item.urgency === "紧急" ? {} : {}, {
            c: item.urgency === "紧急",
            d: common_vendor.t(item.source),
            e: common_vendor.t(item.parties || "未填写"),
            f: common_vendor.t(((_a = item.location) == null ? void 0 : _a.address) || "未填写"),
            g: common_vendor.t(item.occur_count || 1),
            h: common_vendor.t(formatTime(item.assign_time || item.create_time)),
            i: common_vendor.t(item.status),
            j: common_vendor.n(getStatusClass(item.status)),
            k: item.status === "待回访"
          }, item.status === "待回访" ? {
            l: common_vendor.o(($event) => goToDetail(item._id), item._id)
          } : {}, {
            m: item._id,
            n: common_vendor.o(($event) => goToDetail(item._id), item._id)
          });
        }),
        c: loading.value
      }, loading.value ? {} : {}, {
        d: !hasMore.value && taskList.value.length > 0
      }, !hasMore.value && taskList.value.length > 0 ? {} : {}, {
        e: taskList.value.length === 0 && !loading.value
      }, taskList.value.length === 0 && !loading.value ? {} : {}, {
        f: common_vendor.o(loadMore),
        g: common_vendor.o(refresh)
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-35ff9bcb"]]);
_sfc_main.__runtimeHooks = 2;
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/community/index.js.map
