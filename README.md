# 矛盾纠纷管理系统

基于 uni-app Vue3 + uniCloud 开发的微信小程序，用于管理矛盾纠纷的录入、分派、回访等全流程。

## 功能特性

### 角色管理
- **派出所**：纠纷录入、推送至街道
- **街道治理办**：纠纷分派、统计管理
- **社区**：任务接收、回访反馈

### 核心功能
- ✅ 微信登录 + 角色验证
- ✅ 纠纷录入（支持地图定位）
- ✅ 纠纷分派到社区
- ✅ 回访记录（支持照片/录音）
- ✅ 实时数据同步
- ✅ 审计日志记录
- ✅ 下拉刷新 + 上拉分页
- ✅ 媒体上传
- ✅ 统计报表

## 项目结构

```
├── App.vue                 # 全局样式和配置
├── main.js                 # Vue3 初始化
├── manifest.json           # 小程序配置
├── pages.json             # 页面路由配置
├── package.json           # 依赖管理
├── store/                 # Pinia 状态管理
│   ├── user.js           # 用户信息
│   └── dispute.js        # 纠纷数据
├── unicloud/              # 云开发
│   ├── database/         # 数据库 schema
│   │   ├── disputes.schema.json
│   │   ├── feedbacks.schema.json
│   │   ├── assignments.schema.json
│   │   ├── logs.schema.json
│   │   └── users.schema.json
│   └── cloudfunctions/   # 云函数
│       ├── login/
│       ├── pushToStreet/
│       ├── assignToCommunity/
│       ├── submitFeedback/
│       ├── getDisputeList/
│       ├── getDisputeDetail/
│       └── getStatistics/
└── pages/                 # 页面
    ├── index/            # 首页（仪表盘）
    ├── input/           # 纠纷录入
    ├── street/          # 街道管理
    ├── community/       # 社区任务
    └── detail/          # 详情回访
```

## 数据库表结构

### disputes（纠纷表）
- `_id`: 纠纷ID
- `source`: 纠纷来源（接处警/社区摸排/工作发现）
- `title`: 纠纷标题
- `description`: 纠纷描述
- `location`: 位置信息（地址、经纬度）
- `parties`: 涉及人员
- `urgency`: 紧急度（一般/紧急/特急）
- `status`: 状态（待分派/待回访/处理中/已化解/已关闭）
- `occur_count`: 发生次数
- `create_time`: 创建时间
- `assign_community`: 分派社区ID
- `assign_time`: 分派时间

### feedbacks（回访记录表）
- `_id`: 回访ID
- `dispute_id`: 纠纷ID
- `type`: 回访方式（见面/电话）
- `method`: 处理措施
- `result`: 回访结果（已化解/未化解）
- `notes`: 备注
- `media`: 媒体文件数组
- `next_date`: 下次回访日期
- `feedback_time`: 回访时间

### assignments（分派记录表）
- `_id`: 分派ID
- `dispute_id`: 纠纷ID
- `community_id`: 社区ID
- `assign_time`: 分派时间
- `assign_user`: 分派人openid
- `remark`: 分派备注

### logs（操作日志表）
- `_id`: 日志ID
- `entity_id`: 实体ID
- `entity_type`: 实体类型
- `action`: 操作类型
- `user_id`: 用户openid
- `user_name`: 用户名称
- `details`: 操作详情
- `timestamp`: 操作时间

### users（用户表）
- `_id`: 用户ID
- `openid`: 微信openid
- `role`: 角色（派出所/街道/社区）
- `name`: 姓名
- `community`: 社区ID（仅社区角色）

## 使用说明

### 1. 环境准备
- 安装 HBuilderX
- 注册 uniCloud 账号
- 创建 uniCloud 服务空间

### 2. 配置项目
1. 在 `manifest.json` 中配置小程序 AppID
2. 关联 uniCloud 服务空间
3. 上传云函数到服务空间
4. 在 uniCloud web 控制台创建数据库表（使用 schema 文件）

### 3. 运行项目
- 使用 HBuilderX 打开项目
- 运行到微信开发者工具
- 配置云函数环境

### 4. 权限配置
- 在微信小程序后台配置位置权限
- 配置云存储权限
- 配置模板消息（如需要）

## 开发注意事项

1. **登录功能**：`login` 云函数中的 openid 获取需要配置微信小程序 AppID 和 AppSecret
2. **社区列表**：街道分派时需要从数据库获取社区列表，当前为模拟数据
3. **模板消息**：状态变更时的模板消息推送功能需要配置微信模板消息
4. **媒体上传**：需要配置云存储权限
5. **日期选择**：日期范围选择功能可以进一步完善

## 技术栈

- **框架**：uni-app (Vue 3)
- **状态管理**：Pinia
- **云开发**：uniCloud
- **数据库**：uniCloud DB
- **云函数**：Node.js

## 主题色

- 主色调：`#1677ff`（蓝色）

## 许可证

MIT License
