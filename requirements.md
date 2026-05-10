# STACKS 要件定義書 (Svelte 5 + MasterCSS + PWA対応版)

## 1. アプリ概要

- **プロダクト名**: STACKS
- **キャッチコピー**: 忙しさを、美しく
- **目的**: 溜まったタスクの解消をより楽しく、より簡単にするインテリア型タスク管理ソリューション
- **ターゲット**: 日常タスク管理を楽しくしたい個人ユーザー（学生/ビジネスパーソン）
- **フレームワーク**: Svelte 5 + MasterCSS
- **PWA対応**: ホーム画面追加、オフライン動作
- **認証**: Google OAuth 2.0（SvelteKitサーバーサイド実装）
- **バックエンド**: SvelteKit API エンドポイント（adapter-node）
- **デプロイ**: Node.js サーバー（Kiosk モード想定）
- **動作モード**: Kiosk モード (Webアプリをフルスクリーン起動)

## 2. 主要機能

### 2.1 Google Tasks 連携

- Google Tasks API（OAuth 2.0）を使ってタスクを同期
- タスクリストの内容を本体ディスプレイに表示
- 本体からタスクの確認・完了操作が可能
- ローカルキャッシュ + Google Tasks API への直接同期

### 2.2 一般タスク管理機能

- タスクリスト: フィルタ (未完了/カテゴリ/優先度)、ソート (期限/優先度)
- サブタスク
- オフライン対応（ローカルキャッシュ）

### 2.3 UI/UX (MasterCSS)

- ホーム: ダッシュボード (今日のタスク、完了率)
- テーマ: ダーク/ライト、色分け (優先度: 緑/黄/赤)
- インテリアとしての外観にマッチした見た目
- 固定解像度: 720x720px（物理ディスプレイ向け）

## 3. データモデル

### 3.1 LocalTask（ローカルキャッシュ）

```typescript
interface LocalTask {
  id: string;              // Google Tasks の id と対応
  title: string;           // Google Tasks: title
  description: string;     // Google Tasks: notes
  dueDate: Date | null;    // Google Tasks: due (RFC 3339)
  priority: 'low' | 'medium' | 'high';  // 独自フィールド
  category: string;        // 独自フィールド
  status: 'pending' | 'completed' | 'archived';  // Google Tasks: needsAction / completed
  subtasks: { text: string; checked: boolean }[]; // 独自フィールド
  createdAt: Date;
  updatedAt: Date;
}
```

### 3.2 Google Tasks API フィールドマッピング

| LocalTask | Google Tasks API |
|---|---|
| `id` | `id` |
| `title` | `title` |
| `description` | `notes` |
| `dueDate` | `due` (RFC 3339 date-only) |
| `status: 'pending'` | `status: 'needsAction'` |
| `status: 'completed'` | `status: 'completed'` |
| `priority`, `category`, `subtasks` | Google Tasks に対応なし（ローカルのみ） |

## 4. 技術スタック詳細

### 4.1 Frontend

```
Svelte 5 + Vite
├── MasterCSS (@mastercss/vite)
├── GSAP (アニメーション)
├── State: Svelte Stores
└── PWA対応
```

### 4.2 Backend（SvelteKit API Routes）

```
SvelteKit (adapter-node)
├── /api/auth/          - Google OAuth 2.0 フロー
│   ├── login           - OAuth認証開始（リダイレクト）
│   ├── callback        - コールバック処理・トークン保存
│   └── logout          - セッション削除
├── /api/tasks/         - Google Tasks API プロキシ
│   ├── GET             - タスク一覧取得
│   ├── POST            - タスク作成
│   ├── PATCH           - タスク更新・完了
│   └── DELETE          - タスク削除
└── /api/rotation/      - Raspberry Pi 物理入力（既存）
```

### 4.3 認証フロー

```
1. ユーザーが /api/auth/login にアクセス
2. Google OAuth 2.0 認証ページへリダイレクト
   - スコープ: https://www.googleapis.com/auth/tasks
3. コールバック（/api/auth/callback）でトークン取得
4. access_token / refresh_token をサーバーセッションまたは
   HttpOnly Cookie に保存
5. 以降は /api/tasks/* 経由でGoogle Tasks APIを呼び出す
```

### 4.4 必要な環境変数

```
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:5173/api/auth/callback
```

### 4.5 プロジェクト構造

```
src/
├── lib/
│   ├── localTasks.ts       (ローカルキャッシュ、Svelteストア)
│   ├── googleTasksStore.ts (Google Tasks 同期ストア) ← 追加予定
│   ├── physicsController.ts
│   ├── pomodoroStore.ts
│   ├── languageStore.ts
│   └── server/
│       ├── rotationEvents.ts
│       └── googleTasks.ts  (Google Tasks APIクライアント) ← 追加予定
├── routes/
│   ├── api/
│   │   ├── auth/           (OAuth フロー) ← 追加予定
│   │   ├── tasks/          (Tasks API プロキシ) ← 追加予定
│   │   └── rotation/       (既存)
│   ├── +layout.svelte
│   ├── clock/
│   ├── stack/
│   ├── pomodoro/
│   ├── table/
│   └── settings/
└── app.html
```

## 5. ユーザーストーリー

1. 初回起動 → Google ログインで認証
2. Google Tasks と自動同期 → タスクがディスプレイに表示
3. 本体操作でタスク確認・完了 → Google Tasks にも反映
4. オフライン時はローカルキャッシュで動作、再接続時に同期

## 6. 制約&ブラウザ対応

- **オフライン**: ローカルキャッシュで表示継続（更新は要接続）
- **Kiosk モード**: Chrome をフルスクリーンで起動
- **固定解像度**: 720x720px

## 7. 開発フェーズ

```
Phase 1 (完了): ローカルタスク管理 + UIフレームワーク + 物理入力
Phase 2 (現在): Google OAuth 2.0 + Google Tasks API 連携
Phase 3: PWA対応強化 + オフライン同期
Phase 4: 本体設計 (3Dプリンター) + ディスプレイ組み込み + デプロイ
```
