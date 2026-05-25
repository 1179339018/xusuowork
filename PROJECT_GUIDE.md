# 矛盾纠纷管理系统项目说明

本文档用于说明当前小程序的整体业务逻辑、角色分工、页面流转、云函数职责、数据结构和后续优化方向。它偏向“看懂项目”和“讲清项目”，不是接口文档或开发规范；开发规范请看根目录 `AGENTS.md`。

## 1. 项目定位

本项目是一个基于 `uni-app + Vue 3 + Pinia + uniCloud` 的微信小程序，用于基层矛盾纠纷的录入、分派、回访、跟踪和管理。

系统围绕一个核心业务目标展开：让纠纷从发现到处理形成闭环，并且让每一步都有角色负责、有数据记录、有状态可追踪。

核心流程可以概括为：

```text
发现纠纷 -> 派出所/工作人员录入 -> 街道分派 -> 社区回访处理 -> 状态更新 -> 日志留痕
```

## 2. 技术架构总览

```mermaid
flowchart TB
    subgraph Client["微信小程序前端"]
        Splash["启动页 pages/splash"]
        Login["登录页 pages/login"]
        Home["首页 pages/index"]
        Input["录入页 pages/input"]
        Street["街道页 pages/street"]
        Task["我的任务 pages/community"]
        Detail["详情页 pages/detail"]
        Mine["我的页 pages/mine"]
        UserAdmin["用户管理 pages/admin/user-list"]
        Share["分享页 pages/share"]
        Store["Pinia 用户状态 store/user.js"]
        Utils["公共工具 utils/*"]
    end

    subgraph Cloud["uniCloud 云函数"]
        CFLogin["login / checkBind"]
        CFList["getDisputeList"]
        CFDetail["getDisputeDetail"]
        CFStats["getStatistics"]
        CFPush["pushToStreet"]
        CFAssign["assignToCommunity"]
        CFFeedback["submitFeedback"]
        CFAdmin["adminManager"]
        CFUser["updateUserInfo"]
    end

    subgraph DB["uniCloud DB"]
        Users["users 用户表"]
        Disputes["disputes 纠纷表"]
        Feedbacks["feedbacks 回访表"]
        Logs["logs 日志表"]
        Assignments["assignments 分派表"]
    end

    Splash --> Login
    Splash --> Home
    Login --> CFLogin
    Home --> CFStats
    Home --> CFList
    Input --> CFPush
    Street --> CFList
    Street --> CFAssign
    Task --> CFList
    Detail --> CFDetail
    Detail --> CFFeedback
    Mine --> CFUser
    UserAdmin --> CFAdmin

    CFLogin --> Users
    CFList --> Disputes
    CFDetail --> Disputes
    CFDetail --> Feedbacks
    CFDetail --> Logs
    CFStats --> Users
    CFStats --> Disputes
    CFPush --> Disputes
    CFPush --> Logs
    CFAssign --> Disputes
    CFAssign --> Assignments
    CFAssign --> Logs
    CFFeedback --> Feedbacks
    CFFeedback --> Disputes
    CFFeedback --> Logs
    CFAdmin --> Users
    CFUser --> Users

    Store --> Home
    Store --> Street
    Store --> Task
    Store --> Detail
    Utils --> Home
    Utils --> Street
    Utils --> Task
```

## 3. 角色与权限

系统目前主要有四类角色：派出所、街道、社区、管理员。用户可以拥有多个授权角色，并在“我的”页面切换当前角色。

```mermaid
flowchart LR
    User["用户"] --> Role{"当前角色"}

    Role --> Police["派出所"]
    Role --> Street["街道"]
    Role --> Community["社区"]
    Role --> Admin["管理员"]

    Police --> P1["录入纠纷"]
    Police --> P2["查看自己录入的任务"]

    Street --> S1["查看待分派纠纷"]
    Street --> S2["分派到社区"]
    Street --> S3["跟踪处理进度"]

    Community --> C1["查看本社区任务"]
    Community --> C2["提交回访记录"]
    Community --> C3["更新处理结果"]

    Admin --> A1["查看全局数据"]
    Admin --> A2["管理用户与角色"]
    Admin --> A3["查看/管理纠纷流转"]
```

角色职责说明：

| 角色 | 主要页面 | 核心职责 |
| --- | --- | --- |
| 派出所 | 首页、录入、我的任务 | 录入纠纷，查看后续流转进度 |
| 街道 | 街道页、我的任务、录入 | 接收待分派纠纷，分派给社区 |
| 社区 | 我的任务、详情页 | 处理本社区任务，提交回访 |
| 管理员 | 首页、街道、用户管理、我的任务、录入 | 管理用户、角色、全局任务 |

## 4. 登录与启动逻辑

小程序打开后先进入启动页，启动页判断本地是否有用户缓存。如果本地缓存可用，就直接进入对应角色首页；如果没有缓存，就调用微信登录和 `checkBind` 云函数判断是否已经绑定手机号。

```mermaid
sequenceDiagram
    participant U as 用户
    participant S as 启动页 splash
    participant Store as user store
    participant WX as 微信登录
    participant Check as checkBind 云函数
    participant Login as 登录页
    participant Home as 角色首页

    U->>S: 打开小程序
    S->>Store: 读取本地用户缓存
    alt 缓存有效且未手动退出
        Store-->>S: 恢复用户信息
        S->>Home: 按角色跳转
    else 无缓存或缓存无效
        S->>WX: wx.login 获取 code
        WX-->>S: 返回 code
        S->>Check: 校验 openid 是否已绑定
        alt 已绑定
            Check-->>S: 返回用户信息
            S->>Store: 写入用户状态
            S->>Home: 按角色跳转
        else 未绑定
            S->>Login: 跳转登录页
        end
    end
```

首次登录绑定流程：

```mermaid
sequenceDiagram
    participant U as 用户
    participant Login as 登录页
    participant WX as 微信登录
    participant CF as login 云函数
    participant DB as users 表
    participant Store as user store

    U->>Login: 输入手机号
    Login->>WX: wx.login 获取 code
    WX-->>Login: 返回 code
    Login->>CF: code + phone
    CF->>DB: 查询手机号是否已授权
    alt 手机号存在且可绑定
        CF->>DB: 写入 openid
        CF-->>Login: 返回用户信息
        Login->>Store: 保存用户状态
        Login->>Login: 按角色跳转首页
    else 手机号未注册或已被绑定
        CF-->>Login: 返回错误提示
    end
```

## 5. 纠纷流转主流程

纠纷的生命周期是系统最核心的业务逻辑。

```mermaid
stateDiagram-v2
    [*] --> 待分派: 录入纠纷
    待分派 --> 待回访: 街道分派社区
    待回访 --> 处理中: 社区提交未完成回访
    待回访 --> 已化解: 社区提交已化解结果
    处理中 --> 待回访: 需要下次跟进
    处理中 --> 已化解: 后续处理完成
    已化解 --> 已关闭: 归档关闭
    已关闭 --> [*]
```

业务步骤说明：

1. 工作人员在录入页填写纠纷来源、社区、标题、描述、位置、涉及人员、风险等级等信息。
2. 前端调用 `pushToStreet` 云函数，将记录写入 `disputes` 表。
3. 新增纠纷默认状态为 `待分派`。
4. 街道角色进入街道页，查看待分派列表。
5. 街道选择社区并调用 `assignToCommunity`。
6. 系统更新纠纷的 `assign_community`，状态变为 `待回访`。
7. 社区角色进入我的任务页，只查看分派给本社区的任务。
8. 社区在详情页提交回访，调用 `submitFeedback`。
9. 系统写入 `feedbacks`，并根据结果更新纠纷状态。

## 6. 页面地图

```mermaid
flowchart TB
    Splash["启动页 splash"] --> Login["登录页 login"]
    Splash --> Home["首页 index"]

    Home --> Input["录入页 input"]
    Home --> Street["街道页 street"]
    Home --> Task["我的任务 community"]
    Home --> UserAdmin["用户管理 admin/user-list"]

    Mine["我的页 mine"] --> Task
    Mine --> UserAdmin
    Mine --> Login

    Input --> Street
    Street --> Detail["详情页 detail"]
    Task --> Detail
    Detail --> Task
    Detail --> Street

    Share["分享页 share"] --> Home
```

页面职责表：

| 页面 | 路径 | 职责 |
| --- | --- | --- |
| 启动页 | `pages/splash/index` | 初始化登录态，自动识别已绑定用户 |
| 登录页 | `pages/login/index` | 手机号绑定与登录 |
| 首页 | `pages/index/index` | 按角色展示统计、入口和最近任务 |
| 录入页 | `pages/input/index` | 新增纠纷并推送街道 |
| 街道页 | `pages/street/index` | 查询、筛选、分派纠纷 |
| 我的任务 | `pages/community/index` | 按角色展示可见任务 |
| 详情页 | `pages/detail/index` | 查看详情、回访记录、提交回访 |
| 我的页 | `pages/mine/index` | 头像、姓名、角色切换、账号状态 |
| 用户管理 | `pages/admin/user-list` | 管理用户、角色、社区归属 |
| 分享页 | `pages/share/index` | 统一分享落地页 |

## 7. 数据表关系

```mermaid
erDiagram
    users {
        string _id
        string openid
        string phone
        string name
        string role
        array authorized_roles
        string community
        string avatar
    }

    disputes {
        string _id
        string source
        string title
        string description
        string community
        object location
        string parties
        string urgency
        string status
        number occur_count
        string create_user
        date create_time
        string assign_community
        date assign_time
    }

    feedbacks {
        string _id
        string dispute_id
        string type
        string method
        string result
        string notes
        array media
        date next_date
        string feedback_user
        date feedback_time
    }

    logs {
        string _id
        string entity_id
        string entity_type
        string action
        string user_id
        string user_name
        object details
        date timestamp
    }

    assignments {
        string _id
        string dispute_id
        string community_id
        string assign_user
        string remark
        date assign_time
    }

    users ||--o{ disputes : "create_user"
    disputes ||--o{ feedbacks : "dispute_id"
    disputes ||--o{ logs : "entity_id"
    disputes ||--o{ assignments : "dispute_id"
```

主要数据说明：

| 表 | 作用 |
| --- | --- |
| `users` | 保存授权用户、openid、手机号、角色、社区归属 |
| `disputes` | 保存纠纷主记录，是系统最核心的数据表 |
| `feedbacks` | 保存社区回访和处理记录 |
| `logs` | 保存创建、分派、回访等操作留痕 |
| `assignments` | 保存纠纷分派记录 |

## 8. 云函数职责

```mermaid
flowchart LR
    subgraph Auth["登录与身份"]
        login["login"]
        checkBind["checkBind"]
        getPhoneNumber["getPhoneNumber"]
    end

    subgraph Dispute["纠纷业务"]
        pushToStreet["pushToStreet"]
        getDisputeList["getDisputeList"]
        getDisputeDetail["getDisputeDetail"]
        assignToCommunity["assignToCommunity"]
        transferDispute["transferDispute"]
        submitFeedback["submitFeedback"]
    end

    subgraph Admin["管理与统计"]
        adminManager["adminManager"]
        getStatistics["getStatistics"]
        updateUserInfo["updateUserInfo"]
        getCommunities["getCommunities"]
        getCommunityUsers["getCommunityUsers"]
    end

    login --> users[(users)]
    checkBind --> users
    adminManager --> users
    updateUserInfo --> users
    pushToStreet --> disputes[(disputes)]
    getDisputeList --> disputes
    getDisputeDetail --> disputes
    assignToCommunity --> disputes
    submitFeedback --> feedbacks[(feedbacks)]
    submitFeedback --> disputes
    getStatistics --> disputes
    getStatistics --> users
```

云函数说明：

| 云函数 | 主要职责 |
| --- | --- |
| `login` | 微信 code 换 openid，手机号绑定，返回用户信息 |
| `checkBind` | 启动时检查当前微信是否已绑定账号 |
| `getDisputeList` | 按角色、状态、关键词、日期查询纠纷列表 |
| `getDisputeDetail` | 查询纠纷详情、回访、日志 |
| `pushToStreet` | 新增纠纷，写入待分派记录 |
| `assignToCommunity` | 街道将纠纷分派到社区 |
| `submitFeedback` | 社区提交回访，更新纠纷状态 |
| `getStatistics` | 首页、街道页、任务页统计数据 |
| `adminManager` | 管理员新增、编辑、删除、解绑用户 |
| `updateUserInfo` | 用户修改头像和姓名 |

## 9. 缓存与加载逻辑

当前前端已经使用了短时间页面缓存，主要目标是让页面二次进入更快。

```mermaid
flowchart TD
    A["进入页面"] --> B["读取 page-cache"]
    B --> C{"缓存是否可用？"}
    C -->|可用| D["先展示缓存数据"]
    C -->|不可用| E["展示加载状态"]
    D --> F["后台请求最新数据"]
    E --> F
    F --> G{"请求成功？"}
    G -->|成功| H["更新页面数据"]
    H --> I["写入新缓存"]
    G -->|失败| J["保留已有数据并提示错误"]

    K["返回页面 onShow"] --> L{"缓存是否过期或被标记脏？"}
    L -->|是| F
    L -->|否| M["不重复全量刷新"]
```

典型缓存页面：

| 页面 | 缓存内容 |
| --- | --- |
| 首页 | 统计数据、最近纠纷 |
| 街道页 | 统计数据、筛选后的纠纷列表 |
| 我的任务 | 任务统计、当前状态列表 |
| 用户管理 | 用户列表 |

## 10. 分享逻辑

项目目标是所有页面分享出去都落到统一分享页，而不是分享当前页面。

```mermaid
flowchart LR
    AnyPage["任意页面"] --> ShareConfig["utils/share.js 全局分享配置"]
    ShareConfig --> SharePage["pages/share/index"]
    SharePage --> Home["进入小程序首页"]
```

这样做的好处是：

1. 分享内容统一，避免不同页面暴露业务细节。
2. 分享封面和标题更稳定。
3. 用户从分享进入时路径更可控。

## 11. 当前项目优点

项目已经具备比较完整的业务闭环：

1. 登录、绑定、角色识别已经跑通。
2. 纠纷录入、分派、回访、状态更新形成了主流程。
3. 管理员可以维护用户和角色。
4. 主要列表已经有分页、缓存和轻量查询思路。
5. `pages.json` 中页面结构清晰，tabBar 已经回到统一配置。
6. 云函数按业务拆分，整体边界比较容易理解。
7. 已经有 `AGENTS.md` 作为后续 AI 编程规范。

## 12. 当前主要问题

这些问题不影响理解项目，但会影响后续稳定性和企业级程度。

### 12.1 权限边界还需要继续加强

部分云函数仍然较依赖前端传入的 `openid`、`role`、`community`。企业级做法应该是：

```text
前端只发业务参数 -> 云函数从上下文获取 openid -> 查询 users 表 -> 服务端判断角色和数据归属
```

特别需要优先关注：

1. `getDisputeDetail` 应按角色和社区归属限制详情可见范围。
2. `getDisputeList` 应减少对前端传入角色的信任。
3. `pushToStreet` 应校验当前用户是否有录入权限。
4. `submitFeedback` 已有社区校验，但还能继续统一成公共鉴权方法。

### 12.2 登录逻辑有重复

`login` 和 `checkBind` 都包含微信 `jscode2session` 逻辑。后续建议抽成公共方法，避免一个地方修了另一个地方忘记修。

### 12.3 查询性能还可以继续优化

列表页已经做了 `lite` 和 `needTotal: false`，这是正确方向。后续还可以继续做：

1. 用户管理分页。
2. 详情页回访和日志懒加载。
3. 搜索关键词转义和长度限制。
4. 确认数据库索引是否覆盖常用查询字段。

### 12.4 页面逻辑仍偏重

部分页面承担了较多 API 调用、缓存 key、格式化和权限判断逻辑。后续可以逐步拆到：

```text
utils/api.js
utils/format.js
utils/auth.js
utils/page-cache.js
```

不要一次性大重构，适合每次改页面时顺手拆一小块。

## 13. 后续优化路线图

```mermaid
gantt
    title 后续优化路线图
    dateFormat  YYYY-MM-DD
    axisFormat  %m-%d

    section P0 安全稳定
    详情权限校验           :a1, 2026-04-24, 2d
    列表服务端身份校验     :a2, after a1, 2d
    登录公共方法收口       :a3, after a2, 1d

    section P1 性能
    用户管理分页           :b1, after a3, 1d
    详情回访日志懒加载     :b2, after b1, 2d
    数据库索引复查         :b3, after b2, 1d

    section P2 体验
    详情页信息层级优化     :c1, after b3, 2d
    录入页交互压缩         :c2, after c1, 1d
    分享页与登录页统一     :c3, after c2, 1d
```

建议优先级：

| 优先级 | 事项 | 原因 |
| --- | --- | --- |
| P0 | `getDisputeDetail` 权限校验 | 防止敏感纠纷详情越权访问 |
| P0 | `getDisputeList` 服务端身份校验 | 防止前端伪造角色或社区参数 |
| P0 | 登录公共方法收口 | 减少认证逻辑重复 |
| P1 | 用户管理分页 | 用户多时明显提升加载速度 |
| P1 | 详情页懒加载 | 降低首屏请求压力 |
| P2 | 页面视觉统一 | 提升专业感和长期可维护性 |

## 14. 一句话总结

这个项目现在已经具备完整业务骨架，适合作为基层纠纷流转小程序继续打磨。下一阶段最重要的不是继续堆功能，而是把服务端权限、数据查询性能和页面结构再收紧，让它从“能跑”逐步变成“稳定、可维护、可信任”。
