# カフェマップ

## アプリの概要

カフェの場所を地図上に登録して、みんなで共有できるWebアプリです。
地図をクリックすると緯度・経度が入力され、カフェ名、住所、営業時間、Wifi、電源、駐車場、コメントを登録できます。

## 主な機能

1. Leaflet.jsを使った地図表示
2. カフェ情報の新規登録・表示・編集・削除
3. Supabaseを使ったデータ共有
4. メールアドレスとパスワードでのユーザー登録・ログイン
5. コメント投稿
6. いいね機能
7. スマートフォンでも見やすいレスポンシブデザイン

## Supabaseの設定

1. Supabaseでプロジェクトを作成する
2. SQL Editorで `supabase_setup.sql` の内容を実行する
3. AuthenticationのEmail設定で、授業用の場合は Confirm email をOFFにする
4. Project URL と Publishable key を `config.js` に貼り付ける

```js
window.CAFE_MAP_CONFIG = {
  SUPABASE_URL: "https://xxxx.supabase.co",
  SUPABASE_KEY: "sb_publishable_xxxx"
};
```

## 使用した技術

- HTML
- CSS
- JavaScript
- Leaflet.js
- Supabase
- GitHub Pages

## 工夫した点

授業で扱ったlocalStorage版のカフェマップを発展させ、Supabaseに保存する形にしました。
これにより、自分のブラウザだけでなく、他の人のブラウザからも同じカフェ情報を見られるようになります。
また、ログインしている人だけがカフェ登録やコメントをできるようにしました。
