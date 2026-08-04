# TsumManager 8.4.3 Lovely Stitch & Angel Rename Edition

## 修正内容
- ホームの「直前の操作」を削除
- 設定の「操作取り消し履歴」を削除
- 削除済みundoButtonをJavaScriptが直接参照して起動エラーになる問題を修正
- 8.3.7のCSV、MAXボタン、画像登録、バックアップ、名称修正を維持

## 注意
アップロードされたapp(2).jsは8.3 Stableの古い内容だったため、
機能を巻き戻さないよう8.3.7の完全版を基準に再構築しています。


## 8.4.0 changes
- IDs are sequential collection IDs starting with Mickey = 1.
- Legacy IDs are retained and automatically migrated by ID/name.
- CSV export/import includes id and legacyId columns.
- Collection order source: https://xn--bdka7fb.jp/17472.html (checked 2026-08-03).


## 8.4.1 changes
- ツム管理一覧のデフォルト表示をID昇順に変更
- 並び替えメニューに「ID順」を追加
- マスターデータCSVをID昇順で出力


## 8.4.3 changes
- 「スティッチ＆エンジェル」を「ラブリースティッチ＆エンジェル」に変更
- ID 535・旧IDは維持
- 旧名称（半角/全角＆）から保存データ、画像、CSVを自動引継ぎ
