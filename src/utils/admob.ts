// このファイルはTypeScriptの型解決のためのスタブ
// 実際の実装は admob.native.ts (iOS/Android) と admob.web.ts (Web) に存在する
// Metro/Expoバンドラーがプラットフォームに応じて自動選択する

export declare const preloadRewardedAd: () => void;
export declare const showRewardedAd: (
  onRewarded: () => void,
  onFailed: () => void
) => void;
