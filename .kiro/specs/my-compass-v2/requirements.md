# 要件定義書

## はじめに

My Compass v2 は、現行の HTML/CSS/Vanilla JS 静的プロトタイプを、インターネット経由でスマホ・PC どちらからでもアクセス可能な Web アプリとして再構築するプロジェクトである。

技術基盤を Next.js + Supabase + Vercel に移行し、以下の価値を提供する。

- **どの端末からでもアクセスできる**: URL を開くだけでログインでき、データが端末をまたいで同期される
- **常に最新の情報が見られる**: Google Calendar の予定を自動取得し、手動で転記する手間をなくす
- **安全にデータを管理できる**: 外部 API トークンはサーバー側のみに保持し、ブラウザに露出しない
- **将来の拡張に耐える**: Notion 連携・財務・研究・アルバイトの実データ化を段階的に進められる基盤を整える

対象ユーザーはシステムを所有する単一ユーザー（Ryoma Kojima）であり、認証は Google OAuth によるシングルユーザーログインとする。

---

## 要件

### 要件 1: 認証・アクセス制御

**目的:** システム所有者として、Google アカウントでログインできるようにしたい。そうすることで、パスワード管理が不要になり、どの端末からでも安全にアクセスできる。

#### 受入条件

1. WHEN ユーザーが My Compass の URL にアクセスし、未認証の状態である THEN My Compass はログイン画面を表示し、ダッシュボードへのアクセスを拒否する
2. WHEN ユーザーが「Google でログイン」ボタンを押す THEN My Compass は Google OAuth 認証フローを開始する
3. WHEN Google OAuth 認証が成功する THEN My Compass はセッションを確立し、ダッシュボードにリダイレクトする
4. IF 認証済みの Google アカウントが許可リストに登録されていない THEN My Compass はアクセスを拒否し、エラーメッセージを表示する
5. WHEN ユーザーがログアウト操作を行う THEN My Compass はセッションを破棄し、ログイン画面にリダイレクトする
6. WHILE セッションが有効である THEN My Compass は認証状態を維持し、再ログインを求めない
7. WHEN セッションが期限切れになる THEN My Compass はユーザーを自動的にログイン画面へリダイレクトする

---

### 要件 2: マルチデバイスアクセス

**目的:** システム所有者として、スマホ・PC・タブレットのどこからでも同じ URL で My Compass にアクセスしたい。そうすることで、外出中でも手元の情報を確認・更新できる。

#### 受入条件

1. WHEN ユーザーが任意のブラウザで My Compass の URL を開く THEN My Compass は HTTPS 経由でダッシュボードを配信する
2. WHERE 画面幅が 1024px 以上である THEN My Compass はサイドバーを常時表示したデスクトップレイアウトを適用する
3. WHERE 画面幅が 768px 以上 1024px 未満である THEN My Compass はサイドバーを縮小したタブレットレイアウトを適用する
4. WHERE 画面幅が 768px 未満である THEN My Compass はハンバーガーメニューを使ったモバイルレイアウトを適用する
5. WHEN ユーザーがスマートフォンのホーム画面に My Compass を追加する THEN My Compass は PWA として起動し、ブラウザの UI を非表示にして全画面表示する
6. IF ネットワーク接続が切れている THEN My Compass は最後に取得したキャッシュデータを表示し、オフライン状態を明示する

---

### 要件 3: データ永続化・クロスデバイス同期

**目的:** システム所有者として、タスクや財務などのデータを端末を問わず最新の状態で参照・更新したい。そうすることで、スマホで更新した内容が PC でもすぐに反映される。

#### 受入条件

1. WHEN ユーザーがいずれかの端末でデータを追加・更新・削除する THEN My Compass はその変更を Supabase PostgreSQL に保存する
2. WHEN 別の端末で My Compass を開く THEN My Compass は Supabase から最新データを取得して表示する
3. IF Supabase への保存が失敗する THEN My Compass はエラーをユーザーに通知し、データを失わない
4. WHEN ユーザーがページを再読み込みする THEN My Compass は Supabase から最新データを再取得して表示する
5. WHILE ユーザーが My Compass を操作している THEN My Compass はログイン済みユーザー自身のデータのみを読み書きする（行レベルセキュリティ）
6. IF データ構造（スキーマ）に変更が生じる THEN My Compass はマイグレーションを通じて既存データを失わずに移行する

---

### 要件 4: ホームダッシュボード

**目的:** システム所有者として、ホーム画面を開いた瞬間に生活・研究・仕事の現在地を把握したい。そうすることで、今日やることをすぐ判断できる。

#### 受入条件

1. WHEN ユーザーがホーム画面を開く THEN My Compass は今月の残額・今日の未完了タスク数・研究進捗・今月の勤務時間を指標カードに表示する
2. WHEN ユーザーがホーム画面を開く THEN My Compass は今日のタスクを優先度順に最大 6 件表示する
3. WHEN ユーザーがホーム画面を開く THEN My Compass は今週（当日を含む 7 日間）の Google Calendar 予定を曜日別に表示する
4. WHEN ユーザーが指標カードをタップ・クリックする THEN My Compass は対応する詳細ビューに遷移する
5. WHEN Google Calendar の取得が完了する THEN My Compass は予定データを更新し、前の表示から差し替える
6. IF Google Calendar の取得に失敗する THEN My Compass はエラー状態を表示し、最後に取得できたデータがあればそれを表示する

---

### 要件 5: タスク管理

**目的:** システム所有者として、タスクを追加・編集・完了・削除できるようにしたい。そうすることで、今日やることを My Compass だけで管理できる。

#### 受入条件

1. WHEN ユーザーが新しいタスクを作成する THEN My Compass はタイトル・期限・優先度（高・中・低）・カテゴリを Supabase に保存する
2. WHEN ユーザーがタスクの完了チェックを切り替える THEN My Compass は完了状態を即座に更新し、Supabase に保存する
3. WHEN ユーザーが既存のタスクを編集する THEN My Compass は変更内容を Supabase に保存し、一覧表示を更新する
4. WHEN ユーザーがタスクを削除する THEN My Compass は確認ダイアログを表示し、承認後に Supabase から削除する
5. WHEN タスク一覧を表示する THEN My Compass は優先度・期限・カテゴリでフィルタおよびソートできる
6. IF タスクの期限が今日以前で未完了である THEN My Compass はそのタスクを期限切れとして視覚的に区別する

---

### 要件 6: 財務管理

**目的:** システム所有者として、収支を記録・参照し、今月の財務状況を把握したい。そうすることで、予算管理と貯蓄計画を立てやすくなる。

#### 受入条件

1. WHEN ユーザーが収支レコードを追加する THEN My Compass は金額・カテゴリ・日付・メモを Supabase に保存する
2. WHEN ユーザーが財務ビューを開く THEN My Compass は当月の収入合計・支出合計・残額・貯蓄率を表示する
3. WHEN ユーザーが財務ビューを開く THEN My Compass は直近 6 ヶ月の収入・支出推移を棒グラフで表示する
4. WHEN ユーザーが既存の収支レコードを編集・削除する THEN My Compass は変更を Supabase に反映し、集計値を再計算する
5. WHEN ユーザーが CSV エクスポートを要求する THEN My Compass は指定期間の収支データを CSV ファイルとしてダウンロードする
6. IF 月の予算が設定されており、支出が予算を超える THEN My Compass はホームの指標カードに警告を表示する

---

### 要件 7: 研究管理

**目的:** システム所有者として、研究の進捗とマイルストーンを記録・参照したい。そうすることで、論文提出に向けた進捗を可視化できる。

#### 受入条件

1. WHEN ユーザーが研究ビューを開く THEN My Compass は研究全体の進捗率と、フェーズ別（文献レビュー・データ収集・分析・論文執筆）の進捗を表示する
2. WHEN ユーザーがフェーズの進捗を更新する THEN My Compass は入力値を Supabase に保存し、全体進捗率を再計算する
3. WHEN ユーザーがマイルストーンを追加する THEN My Compass はタイトル・期日・達成状態を Supabase に保存する
4. WHEN ユーザーが Obsidian 連携設定を行っている THEN My Compass は該当する Vault・ノートへの URI リンクを表示する
5. IF マイルストーンの期日が今日以前で未達成である THEN My Compass はそのマイルストーンを期限切れとして視覚的に区別する

---

### 要件 8: アルバイト管理

**目的:** システム所有者として、シフトと勤務時間を記録し、今月の給与見込みを把握したい。そうすることで、収入の見通しを立てやすくなる。

#### 受入条件

1. WHEN ユーザーがシフトを登録する THEN My Compass は日付・開始時刻・終了時刻・時給・交通費を Supabase に保存する
2. WHEN ユーザーがアルバイトビューを開く THEN My Compass は当月の累計勤務時間と給与見込み（時給 × 勤務時間 + 交通費）を表示する
3. WHEN ユーザーが勤務済みシフトを確定する THEN My Compass は確定済み勤務時間として記録し、財務の収入に連動させる
4. WHEN ユーザーがシフトを編集・削除する THEN My Compass は変更を Supabase に反映し、集計値を再計算する

---

### 要件 9: Google Calendar 連携

**目的:** システム所有者として、Google Calendar の予定を My Compass に自動表示したい。そうすることで、スケジュール確認のために別アプリを開く手間をなくせる。

#### 受入条件

1. WHEN ユーザーが初めて Google Calendar 連携を設定する THEN My Compass は Google OAuth スコープ（calendar.readonly）の追加同意を求める
2. WHEN Google Calendar 連携が有効な状態でホームを開く THEN My Compass はサーバーサイドで Google Calendar API を呼び出し、今後 7 日間の予定を取得する
3. WHEN Google Calendar から予定を取得する THEN My Compass は予定のタイトル・開始時刻・終了時刻・カレンダー名を表示する
4. IF Google Calendar の取得に失敗する THEN My Compass はフロントエンドに API トークンを露出せず、サーバーサイドのエラーとして処理する
5. WHEN ユーザーが手動更新を要求する THEN My Compass は Google Calendar API を再度呼び出して予定を更新する
6. WHILE Google Calendar データを取得中である THEN My Compass はローディングインジケータを表示する
7. WHEN ユーザーが連携するカレンダーを選択する THEN My Compass は選択したカレンダーの予定のみを表示する
8. IF Google Calendar の API トークンが期限切れになる THEN My Compass はサーバーサイドでトークンを自動更新し、ユーザーに再ログインを求めない

---

### 要件 10: Notion 連携（第二フェーズ）

**目的:** システム所有者として、Notion のタスクデータベースと My Compass のタスクを同期したい。そうすることで、Notion と My Compass の二重管理を解消できる。

#### 受入条件

1. WHEN ユーザーが Notion 連携設定を行う THEN My Compass は Notion Integration Token の入力を受け付け、サーバー側の環境変数として保存する（フロントエンドには保存しない）
2. WHEN Notion 連携が有効な状態でタスクビューを開く THEN My Compass はサーバーサイドで Notion API を呼び出し、指定したデータベースのタスクを取得する
3. WHEN ユーザーが My Compass でタスクを完了にする THEN My Compass はサーバーサイド経由で Notion のレコードにも完了状態を書き戻す
4. IF Notion API の呼び出しが失敗する THEN My Compass は Supabase に保存された最後の同期データを表示し、エラーを通知する
5. WHEN ユーザーが同期を実行する THEN My Compass は Notion と Supabase の差分を解決し、どちらの変更が優先されるかをユーザーが選択できる

---

### 要件 11: アプリランチャー・外部リンク

**目的:** システム所有者として、よく使う外部アプリへのリンクを My Compass から素早く開きたい。そうすることで、アプリ切り替えのコストを下げられる。

#### 受入条件

1. WHEN ユーザーがアプリビューを開く THEN My Compass は Obsidian・Notion・Google Calendar・Google Drive・GitHub のリンクを表示する
2. WHEN ユーザーが Obsidian の Vault 名を設定する THEN My Compass は `obsidian://open?vault=[Vault名]` 形式の URI を生成してリンクに反映する
3. WHEN ユーザーが任意の URL または URL スキームを登録する THEN My Compass はそれをランチャーに追加表示する
4. WHEN ユーザーが外部リンクをクリックする THEN My Compass は `rel="noreferrer noopener"` を付与した新しいタブでリンクを開く
5. IF ユーザーが入力した URL が不正な形式である THEN My Compass は保存を拒否し、エラーメッセージを表示する

---

### 要件 12: 日報

**目的:** システム所有者として、毎日の作業記録と振り返りを My Compass に残したい。そうすることで、何をやったかを後から確認でき、習慣の継続を促せる。

#### 受入条件

1. WHEN ユーザーが日報ビューを開く THEN My Compass は当日の日付で日報フォームを表示する
2. WHEN ユーザーが日報を保存する THEN My Compass は「今日やったこと」「気づき・メモ」「明日やること」のフィールドを Supabase に保存する
3. WHEN 当日の日報がすでに存在する THEN My Compass は既存の内容を表示し、追記・編集できる状態にする
4. WHEN ユーザーが過去の日付を選択する THEN My Compass は該当日の日報を Supabase から取得して表示する
5. WHEN ユーザーがホームを開く THEN My Compass は当日の日報記入状況（未記入・記入済み）を指標カードに表示する
6. WHEN ユーザーが日報一覧を開く THEN My Compass は過去の日報を新しい順に一覧表示する
7. IF 当日の日報が未記入である THEN My Compass はホーム画面に日報の記入を促す通知を表示する

---

### 要件 13: セキュリティ・プライバシー

**目的:** システム所有者として、個人データと外部サービスの認証情報を安全に管理したい。そうすることで、情報漏洩やなりすましのリスクを最小化できる。

#### 受入条件

1. WHEN My Compass が外部 API（Google Calendar・Notion）を呼び出す THEN My Compass はサーバーサイドの API ルート経由でのみ呼び出し、トークンをフロントエンドに一切送信しない
2. IF 認証されていないリクエストが API ルートに届く THEN My Compass は 401 を返しデータを返却しない
3. WHEN Supabase のデータにアクセスする THEN My Compass は行レベルセキュリティ（RLS）ポリシーにより、ログイン済みユーザー自身のデータのみを読み書き可能とする
4. WHEN ユーザーが URL やテキストを入力する THEN My Compass はそのまま HTML に展開せず、XSS を防ぐエスケープ処理を行う
5. WHEN My Compass をデプロイする THEN 環境変数（API キー・DB 接続文字列・OAuth クライアントシークレット）はリポジトリに含めず、Vercel の環境変数設定で管理する
6. WHEN 外部リンクを新しいタブで開く THEN My Compass は `rel="noreferrer noopener"` を必ず付与する

---

## 非機能要件

個人用途のため要件は緩く設定する。将来的に要件が厳しくなる場合はその時点で改訂する。

### NFR-1: パフォーマンス

| 指標 | 目標値 | 備考 |
|------|--------|------|
| 初期ページ表示 | 3 秒以内（通常回線） | Vercel Edge + Supabase の無料枠範囲内 |
| API レスポンス（内部） | 5 秒以内 | Google Calendar・Notion 取得を含む |
| ページ遷移 | 体感的に即時 | Next.js のクライアントサイドルーティング |

### NFR-2: 可用性

- Vercel・Supabase の無料枠 SLA に依存する（ベストエフォート）
- 計画外ダウンタイムは許容する（個人用途のため影響は本人のみ）
- Supabase が一時停止した場合はキャッシュデータを表示する（要件 2-6 に準拠）

### NFR-3: セキュリティ

- HTTPS 必須（Vercel がデフォルトで提供）
- 認証なしアクセスはすべてログイン画面にリダイレクト
- API トークン・DB 接続文字列はリポジトリに含めない
- 行レベルセキュリティ（RLS）で自分のデータのみ読み書き可能
- XSS・オープンリダイレクト・不正 URL スキームの基本的な対策を実施

### NFR-4: ブラウザ・端末サポート

- **必須**: Chrome 最新版、Safari 最新版（iOS 含む）
- **任意**: Firefox 最新版
- 古いブラウザ（IE・旧 Edge 等）は対象外

### NFR-5: アクセシビリティ

- 主要操作はキーボードで到達・実行できること
- アイコンのみのボタンには `aria-label` を付与すること
- 色だけに依存しない状態表現（テキストまたはアイコンを併用）
- 厳密な WCAG 準拠は求めないが、明らかな障壁は作らない

### NFR-6: プッシュ通知

- My Compass は Web Push API を使って OS ネイティブ通知を送信できる
- 対応端末: Android Chrome・iOS 16.4 以降（ホーム画面追加時）・Mac / Windows（Chrome・Safari）
- クラウドエージェントなど外部トリガーから Supabase 経由で通知を送れる
- ユーザーが通知許可を付与した場合のみ動作し、許可なしでは通知しない

### NFR-7: データ保全

- Supabase の自動バックアップ（無料枠の範囲）を活用する
- ユーザーが手動で JSON または CSV 形式でデータをエクスポートできる（財務・タスク）
- スキーマ変更時はマイグレーションを通じて既存データを失わない
