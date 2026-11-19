# 参与开发

## 跑起来

```sh
npm install
npm test          # 194 条 jsdom 断言
```

本地调试可以把仓库软链进 DSH profile：

```sh
ln -s "$PWD" ~/.dsh/profiles/web/node_modules/dsh-live-wallpaper
```

改完 `client.js` 刷新网页版即可。

## 代码约定

- 全部渲染逻辑在 `client.js` 单文件里；改功能时尽量就近改，别新开文件
- 面板文案要中英双语（`locale/` 里补 key），中文是主语言
- 性能相关改动请附上帧率对比（面板顶部有实时帧率）
- 新增素材必须是原创或明确可商用授权，**不接受网图**

## 提交

- 提交信息用 `feat:` / `fix:` / `docs:` / `perf:` 开头
- 一个 PR 只做一件事
- 提交即表示你同意以本项目的 AGPL-3.0 + 非商业附加条款授权你的贡献
