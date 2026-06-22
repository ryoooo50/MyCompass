# Architecture Decision Records

このディレクトリには、My Compassの重要な技術・設計上の意思決定を保存する。

## 状態

- `Proposed`: 提案中
- `Accepted`: 採用済み
- `Deprecated`: 現在は推奨しないが、置換先が確定していない
- `Superseded`: 新しいADRにより置き換えられた
- `Rejected`: 検討したが採用しなかった

## 運用

1. `template.md` を複製する
2. `NNNN-short-title.md` の形式で保存する
3. 背景、決定、選定理由、代替案、影響を記録する
4. 決定変更時は既存ADRを書き換えず、新しいADRから置き換える

## 一覧

| ADR | タイトル | 状態 |
| --- | --- | --- |
| [0001](0001-static-local-first-prototype.md) | 静的・ローカルファースト構成でプロトタイプを開始する | Accepted |

