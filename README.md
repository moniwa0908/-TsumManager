# TsumManager 8.3 Stable

下部メニューから「計画」を削除した安定版です。

## 変更内容

- 下部メニューの「計画」を削除
- 古い状態から計画画面を開こうとした場合はホームへ戻す
- 計画画面を非表示化

## 変更していないもの

- 所持数・スキル進捗
- 登録画像
- 画像一括登録
- IndexedDB
- 固定ユーザーデータ保存
- バックアップと復元
- ホーム、図鑑、入力、目標、攻略、設定

保存処理や画像処理には触れていません。

## GitHubへの更新方法

ZIPを展開し、次の8ファイルをGitHubへ上書きしてCommit changesを押してください。

- index.html
- style.css
- app.js
- tsums-data.js
- manifest.json
- service-worker.js
- icon.svg
- README.md
