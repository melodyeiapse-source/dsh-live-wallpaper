#!/usr/bin/env bash
# 一步发布：建仓库（可选）+ 推代码 + 打 tag
#
# 用法：
#   GITHUB_TOKEN=ghp_xxx bash publish.sh          # 全自动：没有仓库会先建一个公开仓库
#   bash publish.sh                               # 仓库已存在且已登录时直接推
#   GITHUB_TOKEN=xxx bash publish.sh v0.4.1       # 指定 tag
#
# 注意：token 至少要有 repo（经典）或 Contents: Read and write（fine-grained）权限。
set -e

TAG="${1:-v0.4.0}"
OWNER="melodyeiapse-source"
NAME="dsh-live-wallpaper"
PKG="dsh-live-wallpaper-0.4.0.tgz"

cd "$(dirname "$0")"

echo "==> 1/4 检查工作区"
if [ -n "$(git status --porcelain)" ]; then
  echo "有未提交的改动，先 git add -A && git commit"
  exit 1
fi

if [ -n "${GITHUB_TOKEN:-}" ]; then
  echo "==> 2/4 确认仓库存在（没有就用 API 建一个公开仓库）"
  node - "${GITHUB_TOKEN}" "${OWNER}" "${NAME}" <<'EOF'
const [token, owner, name] = process.argv.slice(2)
const api = 'https://api.github.com'
const h = { authorization: 'Bearer ' + token, 'user-agent': 'dsh-live-wallpaper', 'content-type': 'application/json' }
const main = async () => {
  const r = await fetch(api + '/repos/' + owner + '/' + name, { headers: h })
  if (r.status === 200) { console.log('   仓库已存在'); return }
  if (r.status !== 404) throw new Error('查询仓库失败 ' + r.status + ' ' + (await r.text()))
  const c = await fetch(api + '/user/repos', {
    method: 'POST', headers: h,
    body: JSON.stringify({ name, description: 'DSH 网页版动态壁纸插件 · 四季粒子 / 3D 视差 / 内置预设', private: false, has_issues: true }),
  })
  if (!c.ok) throw new Error('建仓库失败 ' + c.status + ' ' + (await c.text()))
  console.log('   已创建公开仓库 http://github.com/' + owner + '/' + name)
}
main().catch((e) => { console.error(e.message); process.exit(1) })
EOF
  PUSH_URL="https://x-access-token:${GITHUB_TOKEN}@github.com/${OWNER}/${NAME}.git"
else
  echo "==> 2/4 未提供 GITHUB_TOKEN，使用已有的 git 凭据"
  PUSH_URL="https://github.com/${OWNER}/${NAME}.git"
fi

echo "==> 3/4 推送 main 与 tag ${TAG}"
git remote remove origin 2>/dev/null || true
git remote add origin "https://github.com/${OWNER}/${NAME}.git"
git push -u "$PUSH_URL" main
if git rev-parse "$TAG" >/dev/null 2>&1; then
  echo "   tag ${TAG} 已存在，跳过创建"
else
  git tag -a "$TAG" -m "dsh-live-wallpaper ${TAG}"
fi
git push "$PUSH_URL" "$TAG"

echo "==> 4/4 完成。接下来把 dist/${PKG} 作为 release 附件传上去"
ls -la "dist/${PKG}" 2>/dev/null || echo "（先跑 npm pack，放到 dist/）"
cat <<TIP

发布页（拖入 dist/${PKG}）：
  https://github.com/${OWNER}/${NAME}/releases/new?tag=${TAG}

装到别的机器：
  dsh plugin --profile web add https://github.com/${OWNER}/${NAME}/releases/download/${TAG}/${PKG}
TIP
