"use strict";
const common_vendor = require("../../common/vendor.js");
const common_assets = require("../../common/assets.js");
const store_user = require("../../store/user.js");
const _sfc_main = {
  __name: "index",
  setup(__props) {
    const userStore = store_user.useUserStore();
    const canSwitchRole = common_vendor.computed(() => {
      return userStore.authorized_roles && userStore.authorized_roles.length > 1;
    });
    const isAdmin = common_vendor.computed(() => {
      return userStore.authorized_roles && userStore.authorized_roles.includes("管理员");
    });
    const handleAvatarClick = () => {
      if (!userStore.isLogin) {
        common_vendor.index.showToast({
          title: "请先登录",
          icon: "none"
        });
        return;
      }
      const itemList = ["上传头像"];
      if (userStore.avatar) {
        itemList.push("查看大头像");
      }
      common_vendor.index.showActionSheet({
        itemList,
        success: (res) => {
          const action = itemList[res.tapIndex];
          if (action === "上传头像") {
            uploadAvatar();
          } else if (action === "查看大头像") {
            previewAvatar();
          }
        }
      });
    };
    const uploadAvatar = async () => {
      try {
        const chooseRes = await common_vendor.index.chooseImage({
          count: 1,
          sizeType: ["compressed"],
          sourceType: ["album", "camera"]
        });
        const tempFilePath = chooseRes.tempFilePaths[0];
        if (!tempFilePath)
          return;
        common_vendor.index.showLoading({ title: "上传中..." });
        const uploadRes = await common_vendor.tr.uploadFile({
          filePath: tempFilePath,
          cloudPath: `avatar/${userStore.openid || Date.now()}_${Math.random().toString(36).slice(2)}.${tempFilePath.split(".").pop()}`
        });
        const fileID = uploadRes.fileID || uploadRes.fileId;
        if (!fileID) {
          throw new Error("上传失败，请稍后重试");
        }
        const { result } = await common_vendor.tr.callFunction({
          name: "updateUserInfo",
          data: {
            openid: userStore.openid,
            avatar: fileID
          }
        });
        if (!result || !result.success) {
          throw new Error(result && result.error || "更新失败");
        }
        userStore.avatar = fileID;
        common_vendor.index.showToast({
          title: "头像已更新",
          icon: "success"
        });
      } catch (error) {
        if (error && error.errMsg && error.errMsg.includes("cancel"))
          return;
        common_vendor.index.__f__("error", "at pages/mine/index.vue:144", "上传头像失败", error);
        common_vendor.index.showToast({
          title: error.message || "上传失败",
          icon: "none"
        });
      } finally {
        common_vendor.index.hideLoading();
      }
    };
    const previewAvatar = () => {
      if (userStore.avatar) {
        common_vendor.index.previewImage({
          current: userStore.avatar,
          urls: [userStore.avatar]
        });
      } else {
        common_vendor.index.showToast({
          title: "请先上传头像",
          icon: "none"
        });
      }
    };
    const switchRole = () => {
      const roles = [...userStore.authorized_roles];
      common_vendor.index.showActionSheet({
        itemList: roles,
        success: (res) => {
          const selectedRole = roles[res.tapIndex];
          if (selectedRole !== userStore.role) {
            userStore.switchRole(selectedRole);
            common_vendor.index.showToast({
              title: `已切换为${selectedRole}`,
              icon: "none"
            });
          }
        }
      });
    };
    const goToUserManage = () => {
      common_vendor.index.navigateTo({
        url: "/pages/admin/user-list"
      });
    };
    const goToTaskManage = () => {
      common_vendor.index.switchTab({
        url: "/pages/street/index"
      });
    };
    const subscribeMessage = () => {
      const tmplId = "5dkonBVIOQ1yUZYDyA7QE-YND6WQUQcFkFP9LifwVHw";
      common_vendor.index.requestSubscribeMessage({
        tmplIds: [tmplId],
        success: (res) => {
          if (res[tmplId] === "accept") {
            common_vendor.index.showToast({
              title: "订阅成功",
              icon: "success"
            });
          } else {
            common_vendor.index.showToast({
              title: "已取消订阅",
              icon: "none"
            });
          }
        },
        fail: (err) => {
          common_vendor.index.__f__("error", "at pages/mine/index.vue:220", "订阅失败", err);
          common_vendor.index.showToast({
            title: "订阅失败，请稍后重试",
            icon: "none"
          });
        }
      });
    };
    const editName = () => {
      if (!userStore.isLogin)
        return;
      common_vendor.index.showModal({
        title: "修改姓名",
        content: userStore.name,
        editable: true,
        success: async (res) => {
          if (res.confirm && res.content && res.content !== userStore.name) {
            try {
              common_vendor.index.showLoading({ title: "更新中..." });
              const { result } = await common_vendor.tr.callFunction({
                name: "updateUserInfo",
                data: {
                  openid: userStore.openid,
                  name: res.content
                }
              });
              if (result && result.success) {
                userStore.setUser({
                  ...userStore.$state,
                  name: res.content
                });
                common_vendor.index.showToast({
                  title: "修改成功",
                  icon: "success"
                });
              } else {
                throw new Error(result && result.error || "更新失败");
              }
            } catch (error) {
              common_vendor.index.showToast({
                title: error.message || "修改失败",
                icon: "none"
              });
            } finally {
              common_vendor.index.hideLoading();
            }
          }
        }
      });
    };
    const logout = () => {
      common_vendor.index.showModal({
        title: "确认退出",
        content: "确定要退出登录吗？",
        success: (res) => {
          if (res.confirm) {
            userStore.logout();
            common_vendor.index.showToast({
              title: "已退出登录",
              icon: "success"
            });
            setTimeout(() => {
              common_vendor.index.reLaunch({
                url: "/pages/login/index"
              });
            }, 1500);
          }
        }
      });
    };
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.unref(userStore).avatar
      }, common_vendor.unref(userStore).avatar ? {
        b: common_vendor.unref(userStore).avatar
      } : {
        c: common_vendor.t(common_vendor.unref(userStore).name ? common_vendor.unref(userStore).name[0] : "用")
      }, {
        d: common_vendor.o(handleAvatarClick),
        e: common_vendor.t(common_vendor.unref(userStore).name || "未命名用户"),
        f: common_vendor.unref(userStore).isLogin
      }, common_vendor.unref(userStore).isLogin ? {} : {}, {
        g: common_vendor.o(editName),
        h: common_vendor.unref(userStore).role
      }, common_vendor.unref(userStore).role ? {
        i: common_vendor.t(common_vendor.unref(userStore).role)
      } : {}, {
        j: canSwitchRole.value
      }, canSwitchRole.value ? {
        k: common_assets._imports_0,
        l: common_vendor.o(switchRole)
      } : {}, {
        m: isAdmin.value
      }, isAdmin.value ? {
        n: common_assets._imports_0,
        o: common_vendor.o(goToUserManage)
      } : {}, {
        p: common_vendor.unref(userStore).isLogin
      }, common_vendor.unref(userStore).isLogin ? {
        q: common_assets._imports_0,
        r: common_vendor.o(goToTaskManage)
      } : {}, {
        s: common_vendor.unref(userStore).isLogin
      }, common_vendor.unref(userStore).isLogin ? {
        t: common_assets._imports_0,
        v: common_vendor.o(subscribeMessage)
      } : {}, {
        w: common_assets._imports_0,
        x: common_vendor.o(logout)
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-569e925a"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/mine/index.js.map
