#!/usr/bin/env bash
# =========================================================
# 一键部署个人主页到 GitHub 用户站 yxcwl.github.io
#
# 用法（在 Git Bash 里执行）：
#   GITHUB_TOKEN=ghp_xxxxxxxxxxxx ./deploy.sh
#
# Token 申请：github.com → Settings → Developer settings
#             → Personal access tokens → Tokens (classic)
#             → Generate new token → 勾选 repo（含 public_repo）
#
# 说明：本机 git 全局代理指向了已失效的 1081 端口，
#       这里用 -c 临时覆盖为当前可用的 7890，不改动你的全局配置。
# =========================================================
set -euo pipefail

OWNER="yxcwl"
REPO="yxcwl.github.io"
BRANCH="main"
PROXY="socks5://127.0.0.1:7890"

: "${GITHUB_TOKEN:?请先设置环境变量 GITHUB_TOKEN，例如： GITHUB_TOKEN=ghp_xxx ./deploy.sh}"

API="https://api.github.com"
AUTH_HEADER="Authorization: Bearer ${GITHUB_TOKEN}"
CURL="curl -s --max-time 30 -x http://127.0.0.1:7890"

echo "==> 1/4 检查仓库 ${OWNER}/${REPO} 是否存在"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 30 -x http://127.0.0.1:7890 \
  -H "${AUTH_HEADER}" "${API}/repos/${OWNER}/${REPO}")

if [ "${STATUS}" = "404" ]; then
  echo "    仓库不存在，正在创建（public）..."
  ${CURL} -X POST "${API}/user/repos" \
    -H "${AUTH_HEADER}" \
    -H "Accept: application/vnd.github+json" \
    -d "{\"name\":\"${REPO}\",\"description\":\"Personal homepage\",\"homepage\":\"https://${OWNER}.github.io\",\"private\":false,\"auto_init\":false}" \
    > /dev/null
  echo "    已创建"
elif [ "${STATUS}" = "200" ]; then
  echo "    仓库已存在"
else
  echo "    !! 查询仓库失败（HTTP ${STATUS}），请检查 Token 是否有 repo 权限"
  exit 1
fi

echo "==> 2/4 推送代码到 ${BRANCH}"
git -c "http.https://github.com.proxy=${PROXY}" \
    push "https://${OWNER}:${GITHUB_TOKEN}@github.com/${OWNER}/${REPO}.git" \
    HEAD:refs/heads/${BRANCH} --force-with-lease

echo "==> 3/4 开启 GitHub Pages（分支 ${BRANCH} 根目录）"
PAGES_CODE=$(curl -s -o /tmp/pages.json -w "%{http_code}" --max-time 30 -x http://127.0.0.1:7890 \
  -X POST "${API}/repos/${OWNER}/${REPO}/pages" \
  -H "${AUTH_HEADER}" \
  -H "Accept: application/vnd.github+json" \
  -d "{\"source\":{\"branch\":\"${BRANCH}\",\"path\":\"/\"}}")

if [ "${PAGES_CODE}" = "201" ] || [ "${PAGES_CODE}" = "204" ] || [ "${PAGES_CODE}" = "409" ]; then
  echo "    Pages 已配置"
else
  echo "    !! Pages 配置返回 HTTP ${PAGES_CODE}，请到 Settings → Pages 手动选择分支"
  cat /tmp/pages.json 2>/dev/null | head -c 400
fi

echo "==> 4/4 等待构建（约 30 秒后查询状态）"
sleep 25
BUILD=$(${CURL} -H "${AUTH_HEADER}" "${API}/repos/${OWNER}/${REPO}/pages/builds/latest" \
  | grep -o '"status":"[a-z]*"' | head -1)
echo "    构建状态: ${BUILD:-unknown}"

echo
echo "完成。访问： https://${OWNER}.github.io   （首次生效最长约 10 分钟）"
echo "别忘了去 github.com/settings/tokens 吊销这个 Token。"
