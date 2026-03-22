// Web環境用モック: react-native-google-mobile-adsは非対応のため
// 広告視聴をシミュレートして即座に報酬付与する

export const preloadRewardedAd = (): void => {
  // Web環境では何もしない
};

export const showRewardedAd = (
  onRewarded: () => void,
  _onFailed: () => void
): void => {
  // Web環境では1.5秒後に報酬付与（UIフィードバックのため）
  setTimeout(() => {
    onRewarded();
  }, 1500);
};
