#!/bin/bash
set -euo pipefail
profile=${1:-desktop}
desktop_cli='/Applications/DeepSeek Harness.app/Contents/Resources/runtime/cli/bin/dsh'
if [[ ! "$profile" =~ ^[a-zA-Z0-9._-]+$ ]]; then
  echo '无效的 profile 名称。' >&2
  exit 1
fi
if [[ -x "$desktop_cli" ]]; then
  dsh_cli="$desktop_cli"
else
  dsh_cli=$(command -v dsh) || { echo '找不到 dsh。' >&2; exit 1; }
fi
"$dsh_cli" plugin --profile "$profile" remove dsh-claude-code-refined
echo '增强插件已移除。重新打开 DeepSeek Harness 后恢复原主题。'
