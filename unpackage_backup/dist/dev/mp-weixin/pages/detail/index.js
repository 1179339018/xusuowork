"use strict";
const common_vendor = require("../../common/vendor.js");
const store_user = require("../../store/user.js");
const _sfc_main = {
  __name: "index",
  setup(__props, { expose: __expose }) {
    const userStore = store_user.useUserStore();
    const disputeId = common_vendor.ref("");
    const disputeInfo = common_vendor.ref({});
    const feedbacks = common_vendor.ref([]);
    const logs = common_vendor.ref([]);
    const loading = common_vendor.ref(false);
    const typeOptions = ["见面", "电话"];
    const resultOptions = ["已化解", "未化解"];
    const feedbackForm = common_vendor.reactive({
      type: "",
      result: "",
      method: "",
      notes: "",
      media: [],
      nextDate: ""
    });
    const submitting = common_vendor.ref(false);
    const minDate = common_vendor.computed(() => {
      const tomorrow = /* @__PURE__ */ new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow.toISOString().split("T")[0];
    });
    const markers = common_vendor.ref([]);
    const canFeedback = common_vendor.computed(() => {
      return disputeInfo.value.status === "待回访" || disputeInfo.value.status === "处理中";
    });
    common_vendor.onMounted(() => {
      var _a;
      const pages = getCurrentPages();
      const currentPage = pages[pages.length - 1];
      disputeId.value = ((_a = currentPage.options) == null ? void 0 : _a.id) || "";
      if (disputeId.value) {
        loadDetail();
      }
    });
    async function loadDetail() {
      var _a;
      loading.value = true;
      try {
        const res = await common_vendor.tr.callFunction({
          name: "getDisputeDetail",
          data: {
            disputeId: disputeId.value
          }
        });
        if (res.result.success) {
          disputeInfo.value = res.result.data.dispute;
          feedbacks.value = res.result.data.feedbacks;
          logs.value = res.result.data.logs;
          if ((_a = disputeInfo.value.location) == null ? void 0 : _a.latitude) {
            markers.value = [{
              id: 1,
              latitude: disputeInfo.value.location.latitude,
              longitude: disputeInfo.value.location.longitude,
              title: disputeInfo.value.location.address
            }];
          }
        } else {
          throw new Error(res.result.error || "加载失败");
        }
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/detail/index.vue:262", "加载详情失败", e);
        common_vendor.index.showToast({
          title: e.message || "加载失败",
          icon: "none"
        });
      } finally {
        loading.value = false;
      }
    }
    function onTypeChange(e) {
      feedbackForm.type = e.detail.value;
    }
    function onResultChange(e) {
      feedbackForm.result = e.detail.value;
    }
    function onDateChange(e) {
      feedbackForm.nextDate = e.detail.value;
    }
    async function chooseMedia() {
      try {
        const res = await common_vendor.index.chooseMedia({
          count: 9 - feedbackForm.media.length,
          mediaType: ["image", "video"],
          sourceType: ["camera", "album"]
        });
        for (let tempFile of res.tempFiles) {
          const uploadRes = await common_vendor.tr.uploadFile({
            filePath: tempFile.tempFilePath,
            cloudPath: `feedback/${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${tempFile.tempFilePath.split(".").pop()}`
          });
          feedbackForm.media.push({
            type: tempFile.fileType === "image" ? "image" : "audio",
            url: uploadRes.fileID,
            name: tempFile.name
          });
        }
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/detail/index.vue:306", "选择媒体失败", e);
        if (e.errMsg && !e.errMsg.includes("cancel")) {
          common_vendor.index.showToast({
            title: "选择失败",
            icon: "none"
          });
        }
      }
    }
    function removeMedia(index) {
      feedbackForm.media.splice(index, 1);
    }
    function previewImage(current, urls) {
      const imageUrls = urls.filter((m) => m.type === "image").map((m) => m.url);
      common_vendor.index.previewImage({
        current,
        urls: imageUrls
      });
    }
    async function submitFeedback() {
      if (!feedbackForm.type) {
        common_vendor.index.showToast({
          title: "请选择回访方式",
          icon: "none"
        });
        return;
      }
      if (!feedbackForm.result) {
        common_vendor.index.showToast({
          title: "请选择回访结果",
          icon: "none"
        });
        return;
      }
      submitting.value = true;
      try {
        const res = await common_vendor.tr.callFunction({
          name: "submitFeedback",
          data: {
            disputeId: disputeId.value,
            feedbackData: {
              type: feedbackForm.type,
              result: feedbackForm.result,
              method: feedbackForm.method,
              notes: feedbackForm.notes,
              media: feedbackForm.media,
              next_date: feedbackForm.nextDate
            },
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
          feedbackForm.type = "";
          feedbackForm.result = "";
          feedbackForm.method = "";
          feedbackForm.notes = "";
          feedbackForm.media = [];
          feedbackForm.nextDate = "";
          setTimeout(() => {
            loadDetail();
          }, 1500);
        } else {
          throw new Error(res.result.error || "提交失败");
        }
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/detail/index.vue:390", "提交回访失败", e);
        common_vendor.index.showToast({
          title: e.message || "提交失败",
          icon: "none"
        });
      } finally {
        submitting.value = false;
      }
    }
    function formatDateTime(timestamp) {
      if (!timestamp)
        return "";
      const date = new Date(timestamp);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");
      return `${year}-${month}-${day} ${hours}:${minutes}`;
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
        "一般": "tag-primary",
        "紧急": "tag-warning",
        "特急": "tag-danger"
      };
      return map[urgency] || "";
    }
    function getResultClass(result) {
      return result === "已化解" ? "tag-success" : "tag-warning";
    }
    const onShareAppMessage = () => {
      return {
        title: `纠纷详情：${disputeInfo.value.title || "矛盾纠纷"}`,
        path: `/pages/detail/index?id=${disputeId.value}`,
        desc: "查看矛盾纠纷详情和处理记录",
        imageUrl: "/static/logo.png"
      };
    };
    __expose({
      onShareAppMessage
    });
    return (_ctx, _cache) => {
      var _a, _b, _c;
      return common_vendor.e({
        a: common_vendor.t(disputeInfo.value.title),
        b: common_vendor.t(disputeInfo.value.source),
        c: common_vendor.t(disputeInfo.value.urgency),
        d: common_vendor.n(getUrgencyClass(disputeInfo.value.urgency)),
        e: common_vendor.t(disputeInfo.value.status),
        f: common_vendor.n(getStatusClass(disputeInfo.value.status)),
        g: common_vendor.t(disputeInfo.value.parties || "未填写"),
        h: common_vendor.t(((_a = disputeInfo.value.location) == null ? void 0 : _a.address) || "未填写"),
        i: common_vendor.t(disputeInfo.value.occur_count || 1),
        j: common_vendor.t(formatDateTime(disputeInfo.value.create_time)),
        k: common_vendor.t(disputeInfo.value.description),
        l: (_b = disputeInfo.value.location) == null ? void 0 : _b.latitude
      }, ((_c = disputeInfo.value.location) == null ? void 0 : _c.latitude) ? {
        m: disputeInfo.value.location.latitude,
        n: disputeInfo.value.location.longitude,
        o: markers.value
      } : {}, {
        p: feedbacks.value.length > 0
      }, feedbacks.value.length > 0 ? {
        q: common_vendor.f(feedbacks.value, (feedback, index, i0) => {
          return common_vendor.e({
            a: common_vendor.t(formatDateTime(feedback.feedback_time)),
            b: common_vendor.t(feedback.result),
            c: common_vendor.n(getResultClass(feedback.result)),
            d: common_vendor.t(feedback.type),
            e: feedback.method
          }, feedback.method ? {
            f: common_vendor.t(feedback.method)
          } : {}, {
            g: feedback.notes
          }, feedback.notes ? {
            h: common_vendor.t(feedback.notes)
          } : {}, {
            i: feedback.media && feedback.media.length > 0
          }, feedback.media && feedback.media.length > 0 ? common_vendor.e({
            j: _ctx.media.type === "image"
          }, _ctx.media.type === "image" ? {
            k: common_vendor.f(feedback.media, (media, idx, i1) => {
              return {
                a: idx,
                b: media.url,
                c: common_vendor.o(($event) => previewImage(media.url, feedback.media), idx)
              };
            })
          } : {}) : {}, {
            l: feedback._id
          });
        })
      } : {}, {
        r: common_vendor.unref(userStore).isCommunity && canFeedback.value
      }, common_vendor.unref(userStore).isCommunity && canFeedback.value ? {
        s: common_vendor.f(typeOptions, (type, index, i0) => {
          return {
            a: type,
            b: feedbackForm.type === type,
            c: common_vendor.t(type),
            d: index
          };
        }),
        t: common_vendor.o(onTypeChange),
        v: common_vendor.f(resultOptions, (result, index, i0) => {
          return {
            a: result,
            b: feedbackForm.result === result,
            c: common_vendor.t(result),
            d: index
          };
        }),
        w: common_vendor.o(onResultChange),
        x: feedbackForm.method,
        y: common_vendor.o(($event) => feedbackForm.method = $event.detail.value),
        z: feedbackForm.notes,
        A: common_vendor.o(($event) => feedbackForm.notes = $event.detail.value),
        B: common_vendor.f(feedbackForm.media, (media, index, i0) => {
          return common_vendor.e({
            a: media.type === "image"
          }, media.type === "image" ? {
            b: media.url,
            c: common_vendor.o(($event) => previewImage(media.url, feedbackForm.media), index)
          } : {
            d: common_vendor.t(media.name || "录音")
          }, {
            e: common_vendor.o(($event) => removeMedia(index), index),
            f: index
          });
        }),
        C: common_vendor.o(chooseMedia),
        D: common_vendor.t(feedbackForm.nextDate || "选择日期（可选）"),
        E: !feedbackForm.nextDate ? 1 : "",
        F: feedbackForm.nextDate,
        G: minDate.value,
        H: common_vendor.o(onDateChange),
        I: common_vendor.t(submitting.value ? "提交中..." : "提交回访"),
        J: common_vendor.o(submitFeedback),
        K: submitting.value
      } : {});
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-2fd5b0a7"]]);
_sfc_main.__runtimeHooks = 2;
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/detail/index.js.map
