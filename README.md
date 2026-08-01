# TsumManager Ver.2

iPhoneのSafari／GitHub Pagesで動く、ツムツムのスキルマ進捗管理Webアプリです。

## Ver.2の主な機能

- Ver.1のSafari保存データを自動移行
- 所持数の＋／−管理
- 未所持・所持済み・スキルマ・お気に入り絞り込み
- カテゴリ絞り込み、検索、並べ替え
- スキルマ率、残り必要数、必要コイン概算
- ツムの追加・編集・削除
- 画像URL、登場年、メモの登録
- JSONバックアップ出力／読込
- 一覧の一括追加
- オフライン対応（PWA）

## GitHubへの更新方法

リポジトリの「Add file / ＋」→「Upload files」を開き、次の4ファイルをアップロードして上書きします。

- index.html
- manifest.json
- service-worker.js
- icon.svg

README.mdも必要に応じて上書きしてください。

アップロード後に「Commit changes」を押します。GitHub Pagesへの反映には通常数分かかります。

## 注意

画像ファイル自体は同梱していません。各ツムの編集画面に、自分で用意した画像URLを設定できます。
