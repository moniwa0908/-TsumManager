# TsumManager 8.2 Stable

Ver.8.0.1 Safe Storageを土台に戻し、一覧表示と保存の安定性を優先したバージョンです。

## 方針

- Ver.8.1系のUI変更を引き継がない
- 所持数・スキル進捗・メモの固定保存設計を維持
- 画像のIndexedDB保存設計を維持
- 一覧表示を止める可能性がある存在しない画面部品への参照を防止
- 起動時エラーを画面上に表示
- 設定から一覧と画像を手動で再読み込み可能

## 追加機能

### 安定版ステータス

- 収録ツム数
- 入力済みツム数
- 表示中画像数
- 一覧表示状態

### 一覧を再表示

JavaScriptの一時的な表示不具合が起きた場合に、一覧を再描画します。

### 保存済み画像を再読み込み

IndexedDBに保存された画像を読み直し、一覧へ反映します。

## 保存設計

- マスターデータ：GitHub更新対象
- ユーザーデータ：固定キー `tm-user-data-stable-v1`
- 画像：IndexedDB `TsumManagerUserStorage`

今後のアップデートでも、この保存場所を変更しません。

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
