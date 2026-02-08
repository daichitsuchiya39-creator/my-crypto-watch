# Crypto Relative Strength Tracker（推しコイン相対強度トラッカー）

## 開発仕様書 — Claude Code 用

---

## 1. プロジェクト概要

### コンセプト
「推しコイン」が主要暗号資産に対して相対的にどの程度強い／弱いかを一目で把握できるWebアプリケーション。CoinMarketCap API（無料プラン）を使用し、リアルタイムの市場データから相対強度を算出・可視化する。

### 解決する課題
- 個別コインの価格だけでは市場全体の中での強弱がわからない
- 複数の時間軸（1h / 24h / 7d / 30d / 90d）で相対パフォーマンスを比較したい
- 「自分の推しコインは市場平均と比べてどうか？」を直感的に知りたい

---

## 2. 技術スタック

| レイヤー | 技術 |
|---------|------|
| フレームワーク | Next.js 14+ (App Router) |
| 言語 | TypeScript |
| スタイリング | Tailwind CSS |
| チャート | Recharts |
| データソース | CoinMarketCap API (Free Basic Plan) |
| デプロイ | Vercel |
| 状態管理 | React useState / useReducer（軽量なので外部ライブラリ不要） |

---

## 3. CoinMarketCap API 設計

### 3.1 使用するエンドポイント

#### ① `/v1/cryptocurrency/listings/latest`
- **用途**: トップN銘柄の最新データ取得（比較対象＋推しコイン候補一覧）
- **無料プラン**: ✅ 利用可能
- **レスポンスに含まれる主要フィールド**:
  - `name`, `symbol`, `cmc_rank`
  - `quote.JPY.price` （JPY変換）
  - `quote.JPY.percent_change_1h`
  - `quote.JPY.percent_change_24h`
  - `quote.JPY.percent_change_7d`
  - `quote.JPY.percent_change_30d`
  - `quote.JPY.percent_change_60d`
  - `quote.JPY.percent_change_90d`
  - `quote.JPY.market_cap`
  - `quote.JPY.volume_24h`

#### ② `/v1/cryptocurrency/quotes/latest`
- **用途**: 特定銘柄の詳細データ取得
- **無料プラン**: ✅ 利用可能
- **パラメータ**: `symbol=BTC,ETH,SOL,...`（カンマ区切りで複数指定可）

#### ③ `/v1/cryptocurrency/info`
- **用途**: ロゴURL、説明文などのメタデータ取得
- **無料プラン**: ✅ 利用可能

### 3.2 API利用上の注意

```
⚠️ 重要な制約:
- 無料プランは月10,000クレジット
- ヒストリカルデータ（OHLCV）は有料プラン以上
- CORS制限あり → 必ずサーバーサイド（API Route）経由でリクエスト
- APIキーは環境変数で管理（クライアントに露出させない）
```

### 3.3 クレジット節約戦略

- `listings/latest` を1回呼ぶだけでトップ100の全データが取得可能（1クレジット消費）
- キャッシュ戦略: サーバーサイドで5分間キャッシュ（`revalidate: 300`）
- 不要なAPI呼び出しを避け、1日あたり最大288回（5分間隔）≒ 月8,640クレジット以内に収める

---

## 4. アプリケーション構成

### 4.1 ディレクトリ構成

```
crypto-relative-strength/
├── .env.local                    # CMC_API_KEY=xxxx
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
├── public/
│   └── favicon.ico
└── src/
    ├── app/
    │   ├── layout.tsx            # ルートレイアウト
    │   ├── page.tsx              # メインページ
    │   ├── globals.css           # Tailwind ベーススタイル
    │   └── api/
    │       └── crypto/
    │           ├── listings/
    │           │   └── route.ts  # listings/latest プロキシ
    │           └── quotes/
    │               └── route.ts  # quotes/latest プロキシ
    ├── components/
    │   ├── CoinSelector.tsx      # 推しコイン選択UI
    │   ├── BenchmarkSelector.tsx # 比較対象選択UI
    │   ├── RelativeStrengthChart.tsx  # メインチャート
    │   ├── RelativeStrengthTable.tsx  # 比較テーブル
    │   ├── StrengthGauge.tsx     # 総合強度ゲージ
    │   ├── CoinCard.tsx          # コインカード（ロゴ＋基本情報）
    │   ├── TimeframeToggle.tsx   # 時間軸切替トグル
    │   └── Header.tsx            # ヘッダー
    ├── lib/
    │   ├── cmc-client.ts         # CMC APIクライアント
    │   ├── calculations.ts       # 相対強度計算ロジック
    │   └── types.ts              # TypeScript型定義
    └── hooks/
        └── useCryptoData.ts      # データフェッチカスタムフック
```

### 4.2 ページ構成

シングルページアプリケーション（SPA）。全機能を1ページに集約。

---

## 5. 画面設計

### 5.1 全体レイアウト

```
┌─────────────────────────────────────────────────────┐
│  🔥 Crypto Relative Strength Tracker                │
│  推しコインの相対強度を可視化                          │
├─────────────────────────────────────────────────────┤
│                                                     │
│  [推しコイン選択 ▼]     vs    [比較対象グループ ▼]     │
│                                                     │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌──────────────────────────────────────────────┐   │
│  │          総合相対強度ゲージ                     │   │
│  │     ◀ 弱い ────── 中立 ────── 強い ▶         │   │
│  │              推しコインスコア: +12.5            │   │
│  └──────────────────────────────────────────────┘   │
│                                                     │
│  [1H] [24H] [7D] [30D] [90D]  ← 時間軸トグル       │
│                                                     │
│  ┌──────────────────────────────────────────────┐   │
│  │    相対強度バーチャート（横棒グラフ）              │   │
│  │                                              │   │
│  │  推しコイン ████████████████████▶ +15.2%      │   │
│  │  BTC       ████████████▶ +8.3%               │   │
│  │  ETH       ███████▶ +4.1%                    │   │
│  │  SOL       █████████████▶ +9.7%              │   │
│  │  XRP       ██▶ +1.2%                         │   │
│  │  ...                                         │   │
│  └──────────────────────────────────────────────┘   │
│                                                     │
│  ┌──────────────────────────────────────────────┐   │
│  │    相対パフォーマンス レーダーチャート             │   │
│  │    （時間軸ごとの推しコイン vs 各比較対象）        │   │
│  └──────────────────────────────────────────────┘   │
│                                                     │
│  ┌──────────────────────────────────────────────┐   │
│  │    詳細比較テーブル                             │   │
│  │    銘柄 | 価格 | 1H | 24H | 7D | 30D | 相対 │   │
│  │    ─────┼──────┼────┼─────┼────┼─────┼──────│   │
│  │    推し  | ¥xxx | .. | ..  | .. | ..  | 基準 │   │
│  │    BTC  | ¥xxx | .. | ..  | .. | ..  | +5%  │   │
│  │    ETH  | ¥xxx | .. | ..  | .. | ..  | -3%  │   │
│  └──────────────────────────────────────────────┘   │
│                                                     │
│  最終更新: 2026-02-08 15:30 JST   [🔄 更新]        │
└─────────────────────────────────────────────────────┘
```

### 5.2 推しコイン選択 UI

- サーチ可能なドロップダウン（コイン名 or シンボルで検索）
- CMC の listings/latest からトップ200を候補として表示
- 選択時にロゴ＋シンボル＋現在価格を表示
- LocalStorage に選択を保存（次回訪問時に復元）

### 5.3 比較対象グループ

プリセット＋カスタム選択の両方を提供:

| プリセット名 | 含まれる銘柄 |
|-------------|-------------|
| Top 10 | BTC, ETH, XRP, SOL, BNB, DOGE, ADA, TRX, AVAX, LINK |
| レイヤー1 | BTC, ETH, SOL, ADA, AVAX, DOT, NEAR, ATOM |
| DeFi | UNI, AAVE, MKR, CRV, COMP, SNX, SUSHI |
| ミームコイン | DOGE, SHIB, PEPE, FLOKI, BONK, WIF |
| カスタム | ユーザーが自由に選択（最大15銘柄） |

---

## 6. コアロジック — 相対強度の計算

### 6.1 基本指標: Relative Performance Differential (RPD)

```typescript
/**
 * 相対パフォーマンス差分
 * 推しコインの変動率 − 比較対象コインの変動率
 *
 * 例: 推しコイン 24h +10%, BTC 24h +3% → RPD = +7%
 *     推しコインはBTCに対して7%アウトパフォーム
 */
function calcRPD(
  oshiPercentChange: number,
  targetPercentChange: number
): number {
  return oshiPercentChange - targetPercentChange;
}
```

### 6.2 総合相対強度スコア (Composite Relative Strength Score)

```typescript
/**
 * 比較対象グループ全体に対する総合スコア
 * 全銘柄とのRPDの平均値
 */
function calcCompositeScore(
  oshiChange: number,
  targetChanges: number[]
): number {
  const rpds = targetChanges.map(tc => oshiChange - tc);
  return rpds.reduce((sum, rpd) => sum + rpd, 0) / rpds.length;
}
```

### 6.3 マルチタイムフレーム強度

```typescript
interface MultiTimeframeStrength {
  "1h": number;
  "24h": number;
  "7d": number;
  "30d": number;
  "90d": number;
  composite: number; // 全時間軸の加重平均
}

/**
 * 加重平均による総合スコア
 * 短期に低い重み、長期に高い重みを設定
 */
const WEIGHTS = {
  "1h": 0.05,
  "24h": 0.15,
  "7d": 0.25,
  "30d": 0.30,
  "90d": 0.25,
};
```

### 6.4 強度ランク判定

| スコア範囲 | ランク | 表示色 | 説明 |
|-----------|--------|--------|------|
| +20% 以上 | 🔥 極めて強い | 赤 | 大幅アウトパフォーム |
| +10% 〜 +20% | 💪 強い | オレンジ | 明確なアウトパフォーム |
| +3% 〜 +10% | 📈 やや強い | 緑 | 小幅アウトパフォーム |
| -3% 〜 +3% | ➡️ 中立 | グレー | ほぼ市場並み |
| -10% 〜 -3% | 📉 やや弱い | 水色 | 小幅アンダーパフォーム |
| -20% 〜 -10% | 😰 弱い | 青 | 明確なアンダーパフォーム |
| -20% 以下 | 💀 極めて弱い | 紫 | 大幅アンダーパフォーム |

---

## 7. API Route 実装仕様

### 7.1 `/api/crypto/listings/route.ts`

```typescript
// GET /api/crypto/listings?limit=100&convert=JPY
//
// CMC API をプロキシし、レスポンスをキャッシュ
// - サーバーサイドで5分キャッシュ（next: { revalidate: 300 }）
// - エラーハンドリング: 429 (Rate Limit) → クライアントにリトライ指示
// - レスポンス形状を必要最小限にトリムしてクライアントに返す

interface CryptoListingResponse {
  data: CryptoAsset[];
  lastUpdated: string;
}

interface CryptoAsset {
  id: number;
  name: string;
  symbol: string;
  slug: string;
  cmc_rank: number;
  quote: {
    JPY: {
      price: number;
      percent_change_1h: number;
      percent_change_24h: number;
      percent_change_7d: number;
      percent_change_30d: number;
      percent_change_60d: number;
      percent_change_90d: number;
      market_cap: number;
      volume_24h: number;
    };
  };
}
```

### 7.2 `/api/crypto/quotes/route.ts`

```typescript
// GET /api/crypto/quotes?symbols=BTC,ETH,SOL&convert=JPY
//
// 特定銘柄の最新見積もり取得
// listings で全データ取得済みの場合はこちらは不要だが、
// 個別更新用のエンドポイントとして用意
```

---

## 8. コンポーネント詳細仕様

### 8.1 `CoinSelector`
- **Props**: `coins: CryptoAsset[]`, `selected: CryptoAsset | null`, `onSelect: (coin) => void`
- **機能**: インクリメンタルサーチ付きドロップダウン
- **UI**: 入力フィールド → フィルタされたリスト → 選択でロゴ＋名前＋シンボル表示

### 8.2 `RelativeStrengthChart`
- **Props**: `oshiCoin: CryptoAsset`, `benchmarks: CryptoAsset[]`, `timeframe: Timeframe`
- **チャートタイプ**: 横棒グラフ（Bar Chart）
- **X軸**: パーセント変動率
- **Y軸**: 銘柄名
- **推しコインはハイライト色で表示**
- **ゼロラインを基準に正負で色分け**

### 8.3 `RelativeStrengthTable`
- **Props**: `oshiCoin: CryptoAsset`, `benchmarks: CryptoAsset[]`
- **カラム**: ランク, ロゴ, 銘柄名, 価格, 1H, 24H, 7D, 30D, 90D, 相対強度(RPD)
- **ソート**: 各カラムでソート可能
- **相対強度カラム**: 推しコインとのRPDを表示、正は緑/負は赤

### 8.4 `StrengthGauge`
- **Props**: `score: number`, `rank: StrengthRank`
- **UI**: 横型のゲージバー（-50% 〜 +50% レンジ）
- **現在スコア位置をインジケーターで表示**
- **背景グラデーション: 青 → グレー → 赤**

### 8.5 `TimeframeToggle`
- **Props**: `selected: Timeframe`, `onChange: (tf: Timeframe) => void`
- **UI**: ボタングループ `[1H] [24H] [7D] [30D] [90D]`

---

## 9. 状態管理

```typescript
interface AppState {
  // データ
  listings: CryptoAsset[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;

  // ユーザー選択
  oshiCoin: CryptoAsset | null;       // 推しコイン
  benchmarkPreset: PresetType;         // プリセット選択
  customBenchmarks: string[];          // カスタム選択のシンボル配列
  selectedTimeframe: Timeframe;        // 選択中の時間軸

  // 算出値（derived state）
  benchmarkCoins: CryptoAsset[];       // 実際の比較対象コインリスト
  relativeStrengths: RelativeStrength[]; // 相対強度計算結果
  compositeScore: number;              // 総合スコア
}
```

---

## 10. デザイン要件

### カラーパレット

| 用途 | 色 | Hex |
|------|-----|-----|
| 背景（メイン） | ダークネイビー | `#0f172a` |
| 背景（カード） | スレートダーク | `#1e293b` |
| テキスト（メイン） | ホワイト | `#f8fafc` |
| テキスト（サブ） | スレートライト | `#94a3b8` |
| アクセント（強い） | エメラルド | `#10b981` |
| アクセント（弱い） | ローズ | `#f43f5e` |
| 推しコイン ハイライト | アンバー | `#f59e0b` |
| 中立 | スレート | `#64748b` |

### レスポンシブ対応
- **モバイル**: テーブルは横スクロール、チャートはスタック表示
- **タブレット**: 2カラムレイアウト
- **デスクトップ**: フルレイアウト

---

## 11. 環境変数

```env
# .env.local
CMC_API_KEY=your_coinmarketcap_api_key_here

# オプション
NEXT_PUBLIC_APP_URL=http://localhost:3000
CACHE_REVALIDATE_SECONDS=300
```

---

## 12. 実装手順（Claude Code 向け）

以下の順番で実装する:

### Phase 1: 基盤構築
1. `npx create-next-app@latest crypto-relative-strength --typescript --tailwind --app --src-dir`
2. 必要パッケージ追加: `npm install recharts`
3. 型定義ファイル `src/lib/types.ts` 作成
4. CMC APIクライアント `src/lib/cmc-client.ts` 作成
5. 計算ロジック `src/lib/calculations.ts` 作成

### Phase 2: API Route
6. `/api/crypto/listings/route.ts` 実装
7. `/api/crypto/quotes/route.ts` 実装
8. APIレスポンスの動作確認

### Phase 3: UIコンポーネント
9. `Header.tsx` 実装
10. `CoinSelector.tsx` 実装
11. `BenchmarkSelector.tsx` 実装
12. `TimeframeToggle.tsx` 実装
13. `StrengthGauge.tsx` 実装
14. `RelativeStrengthChart.tsx` 実装（Recharts）
15. `RelativeStrengthTable.tsx` 実装

### Phase 4: 統合・仕上げ
16. `page.tsx` で全コンポーネント統合
17. カスタムフック `useCryptoData.ts` で状態管理まとめ
18. エラーハンドリング・ローディング表示
19. レスポンシブ調整
20. LocalStorage による選択の永続化

---

## 13. 追加開発アイデア（将来版）

### v2: ヒストリカル相対強度
- 有料プラン移行後、OHLCVデータで時系列の相対強度チャートを作成
- 「推しコインが過去30日間、BTCに対してどう推移したか」の折れ線グラフ

### v3: アラート機能
- 相対強度が閾値を超えたらブラウザ通知 / Webhook / LINE通知
- 「推しコインがBTC比で+20%超えたら通知」

### v4: ポートフォリオ統合
- 保有量を入力して、ポートフォリオ全体の相対パフォーマンスを算出

### v5: SNSシェア
- 現在の相対強度をOGP画像として生成し、X（Twitter）にシェア

---

## 14. 注意事項

- **APIキーの管理**: 絶対にクライアントサイドに露出させない。API Routeを必ず経由する
- **レート制限**: 無料プランは月10,000クレジット。キャッシュを活用してクレジット消費を最小化する
- **免責表示**: 「本アプリは投資助言を目的としたものではありません」の表示を必ず入れる
- **CMC利用規約**: 無料プランは個人利用のみ。商用利用には有料プランが必要
- **CoinGecko代替案**: CMCが合わない場合、CoinGecko API（無料枠あり、ヒストリカルデータ含む）も検討可能
