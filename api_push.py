#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
通过 GitHub REST API 提交本地文件到仓库（不依赖 git 网络通道）。

用法:
  python api_push.py <token> [owner/repo] [branch]

说明: 本机 git 无法穿透代理，改用 HTTPS + API 提交。
"""
import base64
import json
import os
import subprocess
import sys
import urllib.error
import urllib.request

PROXY = os.environ.get("HTTPS_PROXY") or os.environ.get("https_proxy") or "http://127.0.0.1:7890"
API = "https://api.github.com"


def request(method, path, token, payload=None):
    url = API + path
    data = json.dumps(payload).encode("utf-8") if payload is not None else None
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header("Authorization", "Bearer " + token)
    req.add_header("Accept", "application/vnd.github+json")
    req.add_header("User-Agent", "api-push-script")
    if data:
        req.add_header("Content-Type", "application/json")
    opener = urllib.request.build_opener(urllib.request.ProxyHandler({"https": PROXY, "http": PROXY}))
    try:
        with opener.open(req, timeout=60) as resp:
            body = resp.read().decode("utf-8")
            return resp.status, (json.loads(body) if body else {})
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", "replace")
        try:
            return e.code, json.loads(body)
        except Exception:
            return e.code, {"raw": body[:400]}


def main():
    token = sys.argv[1]
    repo = sys.argv[2] if len(sys.argv) > 2 else "yxcwl/yxcwl.github.io"
    branch = sys.argv[3] if len(sys.argv) > 3 else "main"

    root = os.path.dirname(os.path.abspath(__file__))
    os.chdir(root)

    out = subprocess.run(["git", "ls-files"], capture_output=True, text=True)
    files = [f.strip() for f in out.stdout.splitlines() if f.strip()]
    print("待提交文件 (%d):" % len(files))
    for f in files:
        print("  ", f)

    # 空仓库无法直接用 Git Data API，先用 Contents API 提交第一个文件来初始化
    with open(files[0], "rb") as fh:
        first_b64 = base64.b64encode(fh.read()).decode("ascii")
    code, res = request("PUT", "/repos/%s/contents/%s" % (repo, files[0].replace("\\", "/")), token,
                        {"message": "chore: init repository", "content": first_b64,
                         "branch": branch})
    print("初始化提交:", code, res.get("commit", {}).get("sha", "")[:8] if code in (200, 201) else str(res)[:200])

    tree = []
    for path in files:
        with open(path, "rb") as fh:
            raw = fh.read()
        b64 = base64.b64encode(raw).decode("ascii")
        mode = "100755" if path.endswith(".sh") else "100644"
        code, res = request("POST", "/repos/%s/git/blobs" % repo, token,
                            {"content": b64, "encoding": "base64"})
        if code not in (200, 201):
            print("!! blob 失败", path, code, res)
            sys.exit(1)
        tree.append({"path": path.replace("\\", "/"), "mode": mode,
                     "type": "blob", "sha": res["sha"]})
        print("   blob OK  %-38s %6d B" % (path, len(raw)))

    code, res = request("POST", "/repos/%s/git/trees" % repo, token, {"tree": tree})
    if code not in (200, 201):
        print("!! tree 失败", code, res)
        sys.exit(1)
    tree_sha = res["sha"]
    print("tree  OK", tree_sha)

    # 已存在分支则以当前 HEAD 为父提交，保留历史
    parents = []
    code, res = request("GET", "/repos/%s/git/refs/heads/%s" % (repo, branch), token)
    if code == 200 and res.get("object", {}).get("sha"):
        parents = [res["object"]["sha"]]

    payload = {
        "message": "feat: personal homepage (EN default + ZH version)",
        "tree": tree_sha,
    }
    if parents:
        payload["parents"] = parents
    code, res = request("POST", "/repos/%s/git/commits" % repo, token, payload)
    if code not in (200, 201):
        print("!! commit 失败", code, res)
        sys.exit(1)
    commit_sha = res["sha"]
    print("commit OK", commit_sha, "(parent: %s)" % (parents[0][:8] if parents else "none"))

    code, res = request("POST", "/repos/%s/git/refs" % repo, token,
                        {"ref": "refs/heads/%s" % branch, "sha": commit_sha})
    if code not in (200, 201):
        # 引导提交已创建该分支，改为强制更新
        code, res = request("PATCH", "/repos/%s/git/refs/heads/%s" % (repo, branch), token,
                            {"sha": commit_sha, "force": True})
        if code not in (200, 201):
            print("!! ref 失败", code, res)
            sys.exit(1)
        print("ref 已更新")
    print("ref OK  refs/heads/%s -> %s" % (branch, commit_sha))

    code, res = request("PATCH", "/repos/%s" % repo, token, {"default_branch": branch})
    print("默认分支设置:", code)

    # 开启 GitHub Pages
    code, res = request("POST", "/repos/%s/pages" % repo, token,
                        {"source": {"branch": branch, "path": "/"}})
    print("Pages 配置:", code, res.get("status") or res.get("html_url") or str(res)[:200])


if __name__ == "__main__":
    main()
