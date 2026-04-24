# NFCタスク管理アプリ 要件定義書 (Svelte 5 + MasterCSS + PWA対応版)

## 1. アプリ概要

- **アプリ名**: NFC Task Coin (仮)
- **目的**: NFCタグ（コイン状デバイス）を利用した物理×デジタル連動タスク管理アプリ。タグをかざすだけでタスク登録/完了ができ、遊び心のある操作を実現。
- **ターゲット**: 日常タスク管理を楽しくしたい個人ユーザー（学生/ビジネスパーソン）。
- **フレームワーク**: Svelte 5 + MasterCSS
- **PWA対応**: ホーム画面追加、オフライン動作、プッシュ通知
- **バックエンド**: Firebase (Authentication, Firestore, FCM)
- **認証**: Google Sign-In (Gmail前提)
- **デプロイ**: Vercel/Netlify (PWA最適化)

## 2. 主要機能

### 2.1 コア機能 (NFC連動 ※Web NFCブラウザAPI使用)

- **タスク作成&NFC登録**:
  - 入力: タイトル、説明、期限、優先度 (low/medium/high)、カテゴリ、繰り返し設定
  - 操作: NFCタグをかざす → FirebaseでtaskId (UUID) 生成 → NDEF形式でタグに書き込み
  - フィードバック: 成功音/振動/アニメーション (Web Vibration API)
- **タスク読み取り&表示**:
  - NFCタグをかざす → taskId取得 → Firestoreからデータフェッチ → 詳細画面表示
- **タスク完了**:
  - NFCタグをかざす → statusを'completed'に更新 → アーカイブ&通知
- **タグ管理**: 登録済みタグ一覧、書き換え/削除

### 2.2 一般タスク管理機能

- タスクリスト: フィルタ (未完了/カテゴリ/優先度)、ソート (期限/優先度)
- 検索、リマインダー (FCMプッシュ通知)
- サブタスク、添付ファイル (写真/メモ、IndexedDB)
- オフライン同期 (Firestore offline + Service Worker)

### 2.3 UI/UX (MasterCSS)

- ホーム: ダッシュボード (今日のタスク、完了率グラフ)
- タグ検知: 即時モーダルポップアップ (アニメーション)
- テーマ: ダーク/ライト、色分け (優先度: 緑/黄/赤)
- レスポンシブ: モバイルファースト

## 3. データモデル (Firestore)

```
tasks/{taskId}
├── userId: string (Google UID)
├── title: string
├── description: string
├── priority: string ('low'|'medium'|'high')
├── category: string
├── dueDate: timestamp
├── status: string ('pending'|'in_progress'|'completed'|'archived')
├── subtasks: array<{text: string, checked: bool}>
├── createdAt: timestamp
└── updatedAt: timestamp
```

- ローカルキャッシュ: IndexedDB (オフライン用)

## 4. 技術スタック詳細

### 4.1 Frontend

```
Svelte 5 + Vite
├── MasterCSS (@mastercss/vite)
├── Firebase SDK (modular v9+)
├── Web NFC API (Chrome 89+/Android Chrome)
├── PWA: vite-plugin-pwa
├── State: Svelte Stores + Firebase Realtime
└── UI: Skeleton + Heroicons
```

### 4.2 PWA要件

```
manifest.json:
- name: "NFC Task Coin"
- icons: 192x192, 512x512
- theme_color: #3B82F6
- display: standalone

Service Worker:
- キャッシュ: 静的アセット、APIレスポンス
- バックグラウンド同期: FCM + Firestore更新
- プッシュ通知: タスク期限リマインダー
```

### 4.3 プロジェクト構造

```
src/
├── lib/
│ ├── firebase.js (初期化、認証)
│ ├── stores.js (タスクストア)
│ └── nfc.js (Web NFCラッパー)
├── routes/
│ ├── +layout.svelte (認証ガード)
│ ├── +page.svelte (ダッシュボード)
│ ├── task/[id]/+page.svelte
│ └── nfc/+page.svelte (NFC専用)
└── app.html (PWA meta)
```

## 5. ユーザーストーリー (PWA重視)

1. PWAインストール → オフラインでもタスクリスト閲覧
2. NFCタブでタグかざす → 即タスク表示/更新
3. バックグラウンドで通知 → 期限到来時にプッシュ

## 6. 制約&ブラウザ対応

- **Web NFC**: Chrome 89+ (Android実用的、iOS Safari未対応 → PWA+WebNFC)
- **オフライン**: Service Worker + Firestore offline persistence
- **フォールバック**: NFC不可時はQRコード代替

## 7. 開発フェーズ

```
Phase 1 (MVP): 認証 + Firestore CRUD + MasterCSSレイアウト
Phase 2: Web NFC統合 + PWA (Service Worker)
Phase 3: FCM通知 + オフライン同期 + アニメーション
Phase 4: デプロイ (Vercel) + テスト
```

この仕様でSvelte 5 + MasterCSS + PWA実装を進めてください。
