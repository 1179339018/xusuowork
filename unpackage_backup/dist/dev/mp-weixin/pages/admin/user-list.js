"use strict";
const common_vendor = require("../../common/vendor.js");
const store_user = require("../../store/user.js");
const _sfc_main = {
  __name: "user-list",
  setup(__props) {
    const userStore = store_user.useUserStore();
    const userList = common_vendor.ref([]);
    common_vendor.ref(false);
    const showModal = common_vendor.ref(false);
    const isEdit = common_vendor.ref(false);
    const roleOptions = ["派出所", "街道", "社区", "管理员"];
    const isSuperAdmin = common_vendor.computed(() => {
      return userStore.phone === "18926249923";
    });
    const form = common_vendor.reactive({
      id: "",
      phone: "",
      name: "",
      roles: []
    });
    common_vendor.onMounted(() => {
      loadUserList();
    });
    const loadUserList = async () => {
      common_vendor.index.showLoading({ title: "加载中..." });
      try {
        const { result } = await common_vendor.tr.callFunction({
          name: "adminManager",
          data: {
            action: "getUserList"
          }
        });
        if (result.success) {
          userList.value = result.data;
        }
      } catch (error) {
        common_vendor.index.showToast({
          title: "加载失败",
          icon: "none"
        });
      } finally {
        common_vendor.index.hideLoading();
      }
    };
    const openAddModal = () => {
      isEdit.value = false;
      form.id = "";
      form.phone = "";
      form.name = "";
      form.roles = [];
      showModal.value = true;
    };
    const openEditModal = (item) => {
      isEdit.value = true;
      form.id = item._id;
      form.phone = item.phone || "";
      form.name = item.name || "";
      form.roles = item.authorized_roles || (item.role ? [item.role] : []);
      showModal.value = true;
    };
    const closeModal = () => {
      showModal.value = false;
    };
    const onRoleChange = (e) => {
      form.roles = e.detail.value;
    };
    const canDelete = (item) => {
      if (item.authorized_roles && item.authorized_roles.includes("管理员")) {
        return isSuperAdmin.value;
      }
      return true;
    };
    const submitForm = async () => {
      if (!form.phone || form.roles.length === 0) {
        common_vendor.index.showToast({
          title: "请填写手机号并选择角色",
          icon: "none"
        });
        return;
      }
      common_vendor.index.showLoading({ title: "提交中..." });
      try {
        const action = isEdit.value ? "updateUser" : "addUser";
        const params = {
          phone: form.phone,
          name: form.name,
          roles: form.roles
        };
        if (isEdit.value) {
          params.userId = form.id;
        }
        const { result } = await common_vendor.tr.callFunction({
          name: "adminManager",
          data: {
            action,
            params
          }
        });
        if (result.success) {
          common_vendor.index.showToast({
            title: isEdit.value ? "更新成功" : "添加成功"
          });
          closeModal();
          loadUserList();
        } else {
          common_vendor.index.showToast({
            title: result.error || "操作失败",
            icon: "none"
          });
        }
      } catch (error) {
        common_vendor.index.showToast({
          title: "系统异常",
          icon: "none"
        });
      } finally {
        common_vendor.index.hideLoading();
      }
    };
    const unbindWechat = (item) => {
      common_vendor.index.showModal({
        title: "解绑确认",
        content: `确定要解除 "${item.name}" 的微信绑定吗？解绑后该用户可以使用任意微信重新绑定登录。`,
        success: async (res) => {
          if (res.confirm) {
            common_vendor.index.showLoading({ title: "处理中..." });
            try {
              const { result } = await common_vendor.tr.callFunction({
                name: "adminManager",
                data: {
                  action: "unbindWechat",
                  params: {
                    userId: item._id
                  }
                }
              });
              if (result.success) {
                common_vendor.index.showToast({
                  title: "解绑成功",
                  icon: "success"
                });
                loadUserList();
              } else {
                common_vendor.index.showToast({
                  title: result.error || "解绑失败",
                  icon: "none"
                });
              }
            } catch (error) {
              common_vendor.index.showToast({
                title: "系统异常",
                icon: "none"
              });
            } finally {
              common_vendor.index.hideLoading();
            }
          }
        }
      });
    };
    const deleteUser = (item) => {
      common_vendor.index.showModal({
        title: "删除确认",
        content: `确定要删除用户 "${item.name}" 吗？此操作不可恢复。`,
        confirmColor: "#ff4d4f",
        success: async (res) => {
          if (res.confirm) {
            common_vendor.index.showLoading({ title: "删除中..." });
            try {
              const { result } = await common_vendor.tr.callFunction({
                name: "adminManager",
                data: {
                  action: "deleteUser",
                  params: {
                    userId: item._id
                  }
                }
              });
              if (result.success) {
                common_vendor.index.showToast({
                  title: "删除成功",
                  icon: "success"
                });
                loadUserList();
              } else {
                common_vendor.index.showToast({
                  title: result.error || "删除失败",
                  icon: "none"
                });
              }
            } catch (error) {
              common_vendor.index.showToast({
                title: "系统异常",
                icon: "none"
              });
            } finally {
              common_vendor.index.hideLoading();
            }
          }
        }
      });
    };
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.t(userList.value.length),
        b: common_vendor.o(openAddModal),
        c: common_vendor.f(userList.value, (item, k0, i0) => {
          return common_vendor.e({
            a: common_vendor.t(item.name ? item.name[0] : "无"),
            b: common_vendor.t(item.name || "未命名"),
            c: common_vendor.t(item.phone || "无手机号"),
            d: common_vendor.t(item.openid ? "已绑定微信" : "未绑定"),
            e: common_vendor.n(item.openid ? "bound" : ""),
            f: common_vendor.f(item.authorized_roles || [item.role], (role, k1, i1) => {
              return {
                a: common_vendor.t(role),
                b: role
              };
            }),
            g: common_vendor.o(($event) => openEditModal(item), item._id),
            h: item.openid
          }, item.openid ? {
            i: common_vendor.o(($event) => unbindWechat(item), item._id)
          } : {}, {
            j: canDelete(item)
          }, canDelete(item) ? {
            k: common_vendor.o(($event) => deleteUser(item), item._id)
          } : {}, {
            l: item._id
          });
        }),
        d: showModal.value
      }, showModal.value ? {
        e: common_vendor.t(isEdit.value ? "编辑用户" : "添加用户"),
        f: form.phone,
        g: common_vendor.o(($event) => form.phone = $event.detail.value),
        h: form.name,
        i: common_vendor.o(($event) => form.name = $event.detail.value),
        j: common_vendor.f(roleOptions, (role, k0, i0) => {
          return {
            a: role,
            b: form.roles.includes(role),
            c: common_vendor.t(role),
            d: role
          };
        }),
        k: common_vendor.o(onRoleChange),
        l: common_vendor.o(closeModal),
        m: common_vendor.o(submitForm),
        n: common_vendor.o(() => {
        }),
        o: common_vendor.o(closeModal)
      } : {});
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-199b6c8f"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/admin/user-list.js.map
