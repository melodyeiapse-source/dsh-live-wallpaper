#!/usr/bin/env bash
# 一步发布：推代码 + 打 tag + 提示上传 release 附件
# 用法： bash publish.sh [tag]
set -e
TAG="${1:-v0.2.0}"
REPO="https://github.com/melodyeiapse-source/dsh-live-wallpaper.git"

cd "$(dirname "$0")"

echo "==> 1/4 检查工作区"
if [ -n "$(git status --porcelain)" ]; then
  echo "有未提交的改动，先 git add -A && git commit"
  exit 1
fi

echo "==> 2/4 设置远端并推送"
git remote remove origin 2>/dev/null || true
git remote add origin "$REPO"
git push -u origin main

echo "==> 3/4 打 tag"
git tag -a "$TAG" -m "dsh-live-wallpaper $TAG" 2>/dev/null || true
git push origin "$TAG"

echo "==> 4/4 完成，接下来手动上传 release 附件"
ls -la dist/*.tgz 2>/dev/null || echo "（先跑 npm pack --pack-destination dist）"
cat <<TIP

打开下面地址，把 dist/ 里的 tgz 拖进去发布：
  $REPO/releases/new?tag=$TAG

安装命令（发布后）：
  dsh plugin --profile web add https://github.com/melodyeiapse-source/dsh-live-wallpaper/releases/download/$TAG/dsh-live-wallpaper-0.2.0.tgz
TIP
