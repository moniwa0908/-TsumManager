# TsumManager 5.2.1

TsumManager 5.2の一覧表示不具合を修正した緊急修正版です。

## 修正内容

- 一覧画面でツムが表示されなくなる不具合を修正
- 登場年・登場月フィルターの内部変数を修正
- Ver.5.1以前の保存データへ登場年月を正しく統合
- 所持数、画像、お気に入り、メモ、タグ、評価などはそのまま引継ぎ
- 図鑑画面で不要な年月フィルター処理が動かないよう修正
- Ver.1〜TsumManager 5.2の保存データを自動引継ぎ

## GitHubへの更新方法

ZIPを展開し、次の8ファイルをGitHubリポジトリ直下へアップロードして上書きします。

- index.html
- style.css
- app.js
- tsums-data.js
- manifest.json
- service-worker.js
- icon.svg
- README.md

アップロード後に `Commit changes` を押してください。
