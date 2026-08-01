# TsumManager 6.1

TsumManager 6.0.2までの保存データを自動で引き継ぐ、iPhone向け表示最適化版です。

## 6.1の修正内容

- iPhone Safariで入力欄をタップした際の自動ズームを防止
- ダブルタップによる意図しない拡大を防止
- ピンチ操作による画面倍率変更を抑制
- 画面幅をiPhoneの表示領域へ固定
- 横方向へのはみ出しを防止
- ツムカードの幅とボタン位置を安定化
- iPhone 16クラスの画面幅ではカードを1列表示に最適化
- ＋／−ボタンを押した際のレイアウト移動を軽減
- 入力欄と選択欄を16px以上に統一
- ダイアログが画面外へはみ出さないよう調整
- 下部メニューを狭い画面で横スクロール可能に調整
- Ver.1〜TsumManager 6.0.2の保存データを自動引継ぎ

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
