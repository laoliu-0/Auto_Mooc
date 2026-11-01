# Auto_Mooc

中国大学MOOC（ICOURSE163）自动答题油猴脚本，支持单元测试、课后小测试、SPOC 测验自动抓取与填答。

> 仅供学习自动化与前端逆向研究，勿用于违规刷分。

## 功能

- 单元测试自动取题（接口：`ginnnnnn.top/api/mooc/test/:id`）
- 课后小测试一键答题
- SPOC 课后小测试
  - Hook XHR `responseText`
  - Hook `dwr.engine._remoteHandleCallback` 抓取 `paper` 数据
- 浮层面板（毛玻璃）
  - 📝 单元测试
  - 📚 MOOC 课后小测试
  - 📚 SPOC 课后小测试
- 支持章节自动翻页、讨论题自动回复

## 环境

- 浏览器：Chrome / Edge
- 插件：Tampermonkey 或 Violentmonkey
- 页面：
  - `https://www.icourse163.org/learn/*`
  - `https://www.icourse163.org/spoc/learn/*`

## 安装

1. 安装 Tampermonkey
2. 新建用户脚本，清空默认代码
3. 把 `mooc_auto.js` 内容完整粘贴进去
4. 保存（Ctrl+S）
5. 打开 MOOC 课程章节页，右侧出现面板即生效

## 使用

1. 进入有测验的章节
2. 点对应按钮：
   - 单元测试
   - 课后小测试
   - SPOC 课后小测试
3. 脚本自动：
   - 抓题 → 匹配答案 → 勾选选项 → 提交
4. 视频内答题开关：面板勾选“是否视频内答题”

## 目录
