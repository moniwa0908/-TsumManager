# TsumManager 6.3.1

TsumManager 6.3を基準に、iPhoneでバックアップボタンが反応しない問題を修正したバージョンです。

## 修正内容

- 「画像込みバックアップを書き出す」がiPhoneで動作するよう修正
- 「更新前クイックバックアップ」がiPhoneで動作するよう修正
- スクロール直後のタップを妨害していた処理を削除
- iPhoneでは共有画面を開き、「ファイルに保存」を選べる方式へ変更
- PCでは従来どおりJSONファイルをダウンロード
- 作成中・成功・キャンセル・失敗を画面へ表示
- バックアップ中の二重タップを防止
- バックアップ読込前の自動保存も修正
- Ver.6.3の751体データとスキルマ必要数修正を維持
- Ver.1〜TsumManager 6.3の保存データを自動引継ぎ

## iPhoneでのバックアップ方法

1. 設定を開く
2. 「更新前クイックバックアップ」を押す
3. iPhoneの共有画面が開く
4. 「ファイルに保存」を選択
5. iCloud Driveなどへ保存

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
