"use strict";
const common_vendor = require("../../common/vendor.js");
const store_user = require("../../store/user.js");
const store_dispute = require("../../store/dispute.js");
const _sfc_main = {
  setup() {
    const userStore = store_user.useUserStore();
    store_dispute.useDisputeStore();
    const isLoading = common_vendor.ref(false);
    const statistics = common_vendor.ref({
      todayNew: 0,
      pendingAssign: 0,
      pendingVisit: 0,
      pendingPolice: 0,
      resolved: 0,
      resolveRate: "0.0",
      totalCount: 0,
      userCount: 0
    });
    const recentDisputes = common_vendor.ref([]);
    const startDate = common_vendor.ref("");
    const endDate = common_vendor.ref("");
    const statusOptions = ["全部", "待分派", "待回访", "处理中", "已化解", "已关闭"];
    const statusIndex = common_vendor.ref(0);
    const userInfo = common_vendor.computed(() => userStore.userInfo);
    const isPolice = common_vendor.computed(() => userStore.role === "police");
    const isStreet = common_vendor.computed(() => userStore.role === "street");
    const isCommunity = common_vendor.computed(() => userStore.role === "community");
    const isAdmin = common_vendor.computed(() => userStore.role === "admin");
    const goToInput = () => {
      common_vendor.index.navigateTo({
        url: "/pages/input/index"
      });
    };
    const goToStreetManage = () => {
      common_vendor.index.switchTab({
        url: "/pages/street/index"
      });
    };
    const goToDetail = (id) => {
      common_vendor.index.navigateTo({
        url: `/pages/detail/index?id=${id}`
      });
    };
    const goToUserManage = () => {
      common_vendor.index.navigateTo({
        url: "/pages/admin/user-list"
      });
    };
    const formatTime = (time) => {
      if (!time)
        return "";
      const date = new Date(time);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
    };
    const onStartDateChange = (e) => {
      startDate.value = e.detail.value;
      if (endDate.value && endDate.value < startDate.value) {
        endDate.value = "";
      }
    };
    const onEndDateChange = (e) => {
      endDate.value = e.detail.value;
      if (startDate.value && endDate.value < startDate.value) {
        const temp = startDate.value;
        startDate.value = endDate.value;
        endDate.value = temp;
      }
    };
    const onStatusChange = (e) => {
      statusIndex.value = Number(e.detail.value) || 0;
    };
    const resetForm = () => {
      startDate.value = "";
      endDate.value = "";
    };
    const exportData = async () => {
      if (!userStore.isAdmin)
        return;
      try {
        common_vendor.index.showLoading({
          title: "正在导出..."
        });
        const pageSize = 100;
        let page = 1;
        const allData = [];
        const status = statusOptions[statusIndex.value];
        const statusFilter = status === "全部" ? "" : status;
        while (true) {
          const res = await common_vendor.tr.callFunction({
            name: "getDisputeList",
            data: {
              role: userStore.role,
              community: userStore.community,
              status: statusFilter,
              startDate: startDate.value,
              endDate: endDate.value,
              page,
              pageSize,
              needTotal: false
            }
          });
          if (!res.result || !res.result.success) {
            throw new Error("获取数据失败");
          }
          const data = res.result.data || [];
          allData.push(...data);
          if (!res.result.hasMore || data.length < pageSize) {
            break;
          }
          page++;
        }
        if (allData.length === 0) {
          common_vendor.index.hideLoading();
          common_vendor.index.showToast({
            title: "暂无数据可导出",
            icon: "none"
          });
          return;
        }
        const headers = ["纠纷ID", "标题", "来源", "状态", "紧急度", "发生次数", "涉及人员", "地址", "创建时间", "分派社区ID", "分派时间"];
        const rows = allData.map((item) => {
          var _a;
          const createTime = item.create_time ? new Date(item.create_time) : null;
          const assignTime = item.assign_time ? new Date(item.assign_time) : null;
          const formatDate = (date) => {
            if (!date)
              return "";
            return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}:${String(date.getSeconds()).padStart(2, "0")}`;
          };
          const formatNumber = (num) => {
            if (num == null)
              return "";
            return String(num);
          };
          return [
            item._id || "",
            `"${item.title || ""}"`,
            item.source || "",
            item.status || "",
            item.urgency || "",
            formatNumber(item.occur_count || 1),
            `"${item.parties || ""}"`,
            `"${((_a = item.location) == null ? void 0 : _a.address) || ""}"`,
            formatDate(createTime),
            item.assign_community_id || "",
            formatDate(assignTime)
          ];
        });
        const csvContent = [
          headers.join(","),
          ...rows.map((row) => row.join(","))
        ].join("\n");
        const fileName = `纠纷数据_${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}.csv`;
        if (common_vendor.index.saveFile) {
          const tempFilePath = `${common_vendor.wx$1.env.USER_DATA_PATH}/${fileName}`;
          common_vendor.wx$1.writeFile({
            filePath: tempFilePath,
            data: csvContent,
            encoding: "utf8",
            success: (res) => {
              common_vendor.index.hideLoading();
              common_vendor.index.showToast({
                title: "导出成功",
                icon: "success"
              });
              common_vendor.wx$1.openDocument({
                filePath: res.savedFilePath
              });
            },
            fail: (err) => {
              common_vendor.index.hideLoading();
              common_vendor.index.showToast({
                title: "导出失败",
                icon: "none"
              });
              common_vendor.index.__f__("error", "at pages/index/index.vue:411", "导出失败", err);
            }
          });
        } else {
          const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
          const link = document.createElement("a");
          const url = URL.createObjectURL(blob);
          link.setAttribute("href", url);
          link.setAttribute("download", fileName);
          link.style.visibility = "hidden";
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          common_vendor.index.hideLoading();
          common_vendor.index.showToast({
            title: "导出成功",
            icon: "success"
          });
        }
      } catch (error) {
        common_vendor.index.hideLoading();
        common_vendor.index.showToast({
          title: "导出失败",
          icon: "none"
        });
        common_vendor.index.__f__("error", "at pages/index/index.vue:437", "导出失败", error);
      }
    };
    const loadStatistics = async () => {
      if (!userStore.userInfo)
        return;
      try {
        isLoading.value = true;
        const res = await common_vendor.tr.callFunction({
          name: "getStatistics",
          data: {
            role: userStore.role,
            community: userStore.community
          }
        });
        if (res.result && res.result.success) {
          statistics.value = {
            ...statistics.value,
            ...res.result.data
          };
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/index/index.vue:462", "获取统计数据失败", error);
      } finally {
        isLoading.value = false;
      }
    };
    const loadRecentDisputes = async () => {
      if (!userStore.userInfo)
        return;
      try {
        isLoading.value = true;
        const res = await common_vendor.tr.callFunction({
          name: "getDisputeList",
          data: {
            role: userStore.role,
            community: userStore.community,
            page: 1,
            pageSize: 10,
            needTotal: false
          }
        });
        if (res.result && res.result.success) {
          recentDisputes.value = (res.result.data || []).map((item) => ({
            ...item,
            statusClass: {
              "待分派": "pending",
              "待回访": "pending",
              "处理中": "processing",
              "已化解": "resolved",
              "已关闭": "closed"
            }[item.status] || ""
          }));
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/index/index.vue:498", "获取最近纠纷失败", error);
      } finally {
        isLoading.value = false;
      }
    };
    common_vendor.onMounted(() => {
      loadStatistics();
      loadRecentDisputes();
    });
    return {
      userInfo,
      isPolice,
      isStreet,
      isCommunity,
      isAdmin,
      isLoading,
      statistics,
      recentDisputes,
      startDate,
      endDate,
      statusOptions,
      statusIndex,
      goToInput,
      goToStreetManage,
      goToDetail,
      goToUserManage,
      formatTime,
      onStartDateChange,
      onEndDateChange,
      onStatusChange,
      resetForm,
      exportData
    };
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: $setup.isPolice
  }, $setup.isPolice ? common_vendor.e({
    b: common_vendor.o((...args) => $setup.goToInput && $setup.goToInput(...args)),
    c: common_vendor.t($setup.statistics.todayNew),
    d: $setup.statistics.pendingPolice > 0
  }, $setup.statistics.pendingPolice > 0 ? {
    e: common_vendor.t($setup.statistics.pendingPolice)
  } : {}, {
    f: common_vendor.f($setup.recentDisputes, (item, index, i0) => {
      return {
        a: common_vendor.t(item.title),
        b: common_vendor.t(item.source),
        c: common_vendor.t($setup.formatTime(item.create_time)),
        d: common_vendor.t(item.status),
        e: common_vendor.n(item.statusClass),
        f: item._id,
        g: common_vendor.o(($event) => $setup.goToDetail(item._id), item._id)
      };
    }),
    g: $setup.recentDisputes.length === 0
  }, $setup.recentDisputes.length === 0 ? {} : {}) : $setup.isStreet ? common_vendor.e({
    i: common_vendor.t($setup.statistics.pendingAssign),
    j: common_vendor.t($setup.statistics.resolved),
    k: common_vendor.t($setup.statistics.resolveRate),
    l: common_vendor.o((...args) => $setup.goToStreetManage && $setup.goToStreetManage(...args)),
    m: common_vendor.f($setup.recentDisputes, (item, index, i0) => {
      return common_vendor.e({
        a: common_vendor.t(item.title),
        b: item.urgency === "特急"
      }, item.urgency === "特急" ? {} : item.urgency === "紧急" ? {} : {}, {
        c: item.urgency === "紧急",
        d: common_vendor.t($setup.formatTime(item.create_time)),
        e: common_vendor.t(item.status),
        f: item._id,
        g: common_vendor.o(($event) => $setup.goToDetail(item._id), item._id)
      });
    }),
    n: $setup.recentDisputes.length === 0
  }, $setup.recentDisputes.length === 0 ? {} : {}) : $setup.isCommunity ? common_vendor.e({
    p: common_vendor.t($setup.statistics.pendingVisit),
    q: common_vendor.f($setup.recentDisputes, (item, index, i0) => {
      return {
        a: common_vendor.t(item.title),
        b: common_vendor.t(item.status),
        c: common_vendor.t($setup.formatTime(item.assign_time || item.create_time)),
        d: common_vendor.t(item.source),
        e: item._id,
        f: common_vendor.o(($event) => $setup.goToDetail(item._id), item._id)
      };
    }),
    r: $setup.recentDisputes.length === 0
  }, $setup.recentDisputes.length === 0 ? {} : {}) : $setup.isAdmin ? {
    t: common_vendor.t($setup.statistics.totalCount),
    v: common_vendor.t($setup.statistics.resolved),
    w: common_vendor.t($setup.statistics.userCount),
    x: common_vendor.o((...args) => $setup.goToUserManage && $setup.goToUserManage(...args)),
    y: common_vendor.o((...args) => $setup.goToStreetManage && $setup.goToStreetManage(...args)),
    z: common_vendor.o((...args) => $setup.exportData && $setup.exportData(...args)),
    A: common_vendor.t($setup.statusOptions[$setup.statusIndex]),
    B: $setup.statusOptions,
    C: $setup.statusIndex,
    D: common_vendor.o((...args) => $setup.onStatusChange && $setup.onStatusChange(...args)),
    E: common_vendor.t($setup.startDate || "请选择"),
    F: common_vendor.o((...args) => $setup.onStartDateChange && $setup.onStartDateChange(...args)),
    G: common_vendor.t($setup.endDate || "请选择"),
    H: common_vendor.o((...args) => $setup.onEndDateChange && $setup.onEndDateChange(...args)),
    I: common_vendor.o((...args) => $setup.exportData && $setup.exportData(...args)),
    J: common_vendor.o((...args) => $setup.resetForm && $setup.resetForm(...args))
  } : $setup.userInfo ? {} : {}, {
    h: $setup.isStreet,
    o: $setup.isCommunity,
    s: $setup.isAdmin,
    K: $setup.userInfo
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/index/index.js.map
