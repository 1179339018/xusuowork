"use strict";
const common_vendor = require("../../common/vendor.js");
const store_user = require("../../store/user.js");
const store_dispute = require("../../store/dispute.js");
const pageSize = 10;
const _sfc_main = {
  __name: "index",
  setup(__props, { expose: __expose }) {
    const userStore = store_user.useUserStore();
    store_dispute.useDisputeStore();
    const statusTabs = ["全部", "待分派", "待回访", "处理中", "已化解"];
    const currentStatus = common_vendor.ref("全部");
    const keyword = common_vendor.ref("");
    const startDate = common_vendor.ref("");
    const endDate = common_vendor.ref("");
    const showDatePicker = common_vendor.ref(false);
    const disputeList = common_vendor.ref([]);
    const loading = common_vendor.ref(false);
    const page = common_vendor.ref(1);
    const hasMore = common_vendor.ref(true);
    const statistics = common_vendor.ref({
      todayNew: 0,
      pendingAssign: 0,
      resolved: 0
    });
    const showAssign = common_vendor.ref(false);
    const assigning = common_vendor.ref(false);
    const currentDispute = common_vendor.ref(null);
    const assignForm = common_vendor.reactive({
      communityId: "",
      communityName: "",
      communityIndex: 0,
      remark: ""
    });
    const communityOptions = common_vendor.ref(["社区A", "社区B", "社区C", "社区D"]);
    const dateRangeText = common_vendor.computed(() => {
      if (startDate.value && endDate.value) {
        return `${startDate.value} 至 ${endDate.value}`;
      }
      return "选择日期范围";
    });
    common_vendor.onMounted(() => {
      loadStatistics();
      loadList();
    });
    common_vendor.onShow(() => {
      loadStatistics();
      refresh();
    });
    async function loadStatistics() {
      try {
        const res = await common_vendor.tr.callFunction({
          name: "getStatistics",
          data: {
            role: userStore.role
          }
        });
        if (res.result.success) {
          statistics.value = res.result.data;
        }
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/street/index.vue:199", "加载统计失败", e);
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
            status: currentStatus.value === "全部" ? "" : currentStatus.value,
            keyword: keyword.value,
            startDate: startDate.value,
            endDate: endDate.value,
            page: page.value,
            pageSize
          }
        });
        if (res.result.success) {
          if (page.value === 1) {
            disputeList.value = res.result.data;
          } else {
            disputeList.value.push(...res.result.data);
          }
          hasMore.value = res.result.hasMore;
        }
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/street/index.vue:230", "加载列表失败", e);
        common_vendor.index.showToast({
          title: "加载失败",
          icon: "none"
        });
      } finally {
        loading.value = false;
      }
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
    function switchStatus(status) {
      currentStatus.value = status;
      refresh();
    }
    function goToDetail(id) {
      common_vendor.index.navigateTo({
        url: `/pages/detail/index?id=${id}`
      });
    }
    function openAssignModal(item) {
      currentDispute.value = item;
      assignForm.remark = "";
      assignForm.communityId = "";
      assignForm.communityName = "";
      showAssign.value = true;
    }
    function onCommunityChange(e) {
      const index = e.detail.value;
      assignForm.communityIndex = index;
      assignForm.communityName = communityOptions.value[index];
      assignForm.communityId = `community_${index + 1}`;
    }
    async function confirmAssign() {
      if (!assignForm.communityId) {
        common_vendor.index.showToast({
          title: "请选择社区",
          icon: "none"
        });
        return;
      }
      assigning.value = true;
      try {
        const res = await common_vendor.tr.callFunction({
          name: "assignToCommunity",
          data: {
            disputeId: currentDispute.value._id,
            communityId: assignForm.communityId,
            remark: assignForm.remark,
            userInfo: {
              openid: userStore.openid,
              name: userStore.name
            }
          }
        });
        if (res.result.success) {
          common_vendor.index.showToast({
            title: "分派成功",
            icon: "success"
          });
          showAssign.value = false;
          refresh();
          loadStatistics();
        } else {
          throw new Error(res.result.error);
        }
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/street/index.vue:317", "分派失败", e);
        common_vendor.index.showToast({
          title: "分派失败",
          icon: "none"
        });
      } finally {
        assigning.value = false;
      }
    }
    function onStartDateChange(e) {
      startDate.value = e.detail.value;
      showDatePicker.value = false;
      refresh();
    }
    function formatTime(timestamp) {
      if (!timestamp)
        return "";
      const date = new Date(timestamp);
      return `${date.getMonth() + 1}-${date.getDate()} ${date.getHours()}:${date.getMinutes().toString().padStart(2, "0")}`;
    }
    function getStatusClass(status) {
      const map = {
        "待分派": "status-pending",
        "待回访": "status-pending",
        "处理中": "status-processing",
        "已化解": "status-resolved",
        "已关闭": "status-closed"
      };
      return map[status] || "";
    }
    function getUrgencyClass(urgency) {
      const map = {
        "特急": "tag-danger",
        "紧急": "tag-warning",
        "一般": "tag-primary"
      };
      return map[urgency] || "";
    }
    const onShareAppMessage = () => {
      return {
        title: "街道纠纷管理",
        path: "/pages/street/index",
        desc: "管理和分派矛盾纠纷，提升治理效率",
        imageUrl: "/static/logo.png"
      };
    };
    __expose({
      onShareAppMessage
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.o(refresh),
        b: keyword.value,
        c: common_vendor.o(($event) => keyword.value = $event.detail.value),
        d: common_vendor.t(dateRangeText.value),
        e: common_vendor.o(($event) => showDatePicker.value = true),
        f: common_vendor.f(statusTabs, (item, index, i0) => {
          return {
            a: common_vendor.t(item),
            b: index,
            c: currentStatus.value === item ? 1 : "",
            d: common_vendor.o(($event) => switchStatus(item), index)
          };
        }),
        g: common_vendor.t(statistics.value.todayNew),
        h: common_vendor.t(statistics.value.pendingAssign),
        i: common_vendor.t(statistics.value.resolved),
        j: common_vendor.f(disputeList.value, (item, k0, i0) => {
          var _a;
          return common_vendor.e({
            a: common_vendor.t(item.title),
            b: common_vendor.t(item.urgency),
            c: common_vendor.n(getUrgencyClass(item.urgency)),
            d: common_vendor.t(item.status),
            e: common_vendor.n(getStatusClass(item.status)),
            f: common_vendor.t(item.source),
            g: common_vendor.t(formatTime(item.create_time)),
            h: common_vendor.t(((_a = item.location) == null ? void 0 : _a.address) || "未知"),
            i: item.status === "待分派"
          }, item.status === "待分派" ? {
            j: common_vendor.o(($event) => openAssignModal(item), item._id)
          } : {}, {
            k: item._id,
            l: common_vendor.o(($event) => goToDetail(item._id), item._id)
          });
        }),
        k: loading.value
      }, loading.value ? {} : {}, {
        l: !hasMore.value && disputeList.value.length > 0
      }, !hasMore.value && disputeList.value.length > 0 ? {} : {}, {
        m: disputeList.value.length === 0 && !loading.value
      }, disputeList.value.length === 0 && !loading.value ? {} : {}, {
        n: common_vendor.o(loadMore),
        o: common_vendor.o(refresh),
        p: showAssign.value
      }, showAssign.value ? {
        q: common_vendor.o(($event) => showAssign.value = false),
        r: common_vendor.t(assignForm.communityName || "请选择社区"),
        s: communityOptions.value,
        t: assignForm.communityIndex,
        v: common_vendor.o(onCommunityChange),
        w: assignForm.remark,
        x: common_vendor.o(($event) => assignForm.remark = $event.detail.value),
        y: common_vendor.o(($event) => showAssign.value = false),
        z: common_vendor.o(confirmAssign),
        A: assigning.value
      } : {}, {
        B: showDatePicker.value
      }, showDatePicker.value ? {
        C: startDate.value,
        D: endDate.value,
        E: common_vendor.o(onStartDateChange)
      } : {});
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-86123a21"]]);
_sfc_main.__runtimeHooks = 2;
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/street/index.js.map
