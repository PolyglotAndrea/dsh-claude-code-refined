#!/bin/bash
set -euo pipefail

release_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
profile=${1:-desktop}
desktop_cli='/Applications/DeepSeek Harness.app/Contents/Resources/runtime/cli/bin/dsh'
desktop_executable='/Applications/DeepSeek Harness.app/Contents/MacOS/DeepSeek Harness'
package_file="$release_dir/dsh-claude-code-refined-0.3.0.tgz"

if [[ ! "$profile" =~ ^[a-zA-Z0-9._-]+$ ]]; then
  echo '无效的 profile 名称。' >&2
  exit 1
fi
if [[ ! -f "$package_file" ]]; then
  echo '请先解压完整安装包，并将此脚本与 .tgz 插件放在同一目录。' >&2
  exit 1
fi
if [[ -x "$desktop_cli" ]]; then
  dsh_cli="$desktop_cli"
  node_cmd=(env ELECTRON_RUN_AS_NODE=1 "$desktop_executable")
else
  dsh_cli=$(command -v dsh) || { echo '找不到 dsh，请先安装 DeepSeek Harness。' >&2; exit 1; }
  node_cli=$(command -v node) || { echo '找不到 Node.js。' >&2; exit 1; }
  node_cmd=("$node_cli")
fi

base_package="${DSH_HOME:-$HOME/.dsh}/profiles/$profile/node_modules/dsh-claude-style/package.json"
if [[ ! -f "$base_package" ]]; then
  echo "请先在 $profile 中安装并启用 dsh-claude-style 0.19.7。" >&2
  exit 1
fi
base_version=$("${node_cmd[@]}" -e 'console.log(JSON.parse(require("node:fs").readFileSync(process.argv[1], "utf8")).version)' "$base_package")
if [[ "$base_version" != '0.19.7' ]]; then
  echo "此版本已验证的基础主题为 0.19.7，检测到 $base_version。请先核对兼容性。" >&2
  exit 1
fi

"$dsh_cli" plugin --profile "$profile" add "$package_file"
echo
echo 'Claude Code Refined 已安装。请完成当前任务后，退出并重新打开 DeepSeek Harness。'
echo '请保持原 dsh-claude-style 插件启用；移除本插件即可恢复原来的界面。'
