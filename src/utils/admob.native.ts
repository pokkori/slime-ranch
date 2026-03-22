import { Platform } from 'react-native';

// Web / Expo Go 環境では react-native-google-mobile-ads が動作しないため
// 動的インポートでフォールバックを提供する

let admobLoaded = false;
let RewardedAdClass: any = null;
let RewardedAdEventTypeEnum: any = null;
let testAdUnitId = 'ca-app-pub-3940256099942544/5224354917';

const loadAdmob = (): boolean => {
  if (admobLoaded) return RewardedAdClass !== null;
  admobLoaded = true;
  if (Platform.OS === 'web') return false;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require('react-native-google-mobile-ads');
    RewardedAdClass = mod.RewardedAd;
    RewardedAdEventTypeEnum = mod.RewardedAdEventType;
    if (mod.TestIds?.REWARDED) {
      testAdUnitId = mod.TestIds.REWARDED;
    }
    return true;
  } catch {
    return false;
  }
};

const getAdUnitId = (): string => {
  if (__DEV__) return testAdUnitId;
  // 本番AdUnit ID（AdMobコンソールから取得後に必ず置換すること）
  // 現在はテストID使用中 → 本番リリース前に実際のIDへ差し替え必須
  if (Platform.OS === 'ios') {
    // ⚠️ Google公式テストID（ca-app-pub-3940256099942544）を使用中
    // App Store/Google Play登録 → AdMob本番審査通過後に実IDへ置換すること
    return 'ca-app-pub-3940256099942544/1712485313';
  }
  // ⚠️ Google公式テストID（ca-app-pub-3940256099942544）を使用中
  // App Store/Google Play登録 → AdMob本番審査通過後に実IDへ置換すること
  return 'ca-app-pub-3940256099942544/5224354917';
};

let rewardedAd: any = null;
let adLoaded = false;

export const preloadRewardedAd = (): void => {
  if (!loadAdmob() || !RewardedAdClass) return;
  try {
    rewardedAd = RewardedAdClass.createForAdRequest(getAdUnitId(), {
      requestNonPersonalizedAdsOnly: true,
    });
    rewardedAd.addAdEventListener('loaded', () => { adLoaded = true; });
    rewardedAd.addAdEventListener('error', () => { adLoaded = false; });
    rewardedAd.load();
  } catch {
    // ignore
  }
};

export const showRewardedAd = (
  onRewarded: () => void,
  onFailed: () => void
): void => {
  // Web / Expo Go 環境: 1.5秒後に報酬付与（デモ用フォールバック）
  const isNative = loadAdmob() && RewardedAdClass !== null;
  if (!isNative) {
    setTimeout(() => { onRewarded(); }, 1500);
    return;
  }

  if (!rewardedAd || !adLoaded) {
    preloadRewardedAd();
    onFailed();
    return;
  }

  try {
    const unsubEarned = rewardedAd.addAdEventListener(
      RewardedAdEventTypeEnum.EARNED_REWARD,
      () => {
        onRewarded();
        unsubEarned();
        adLoaded = false;
        preloadRewardedAd();
      }
    );

    rewardedAd.show().catch(() => {
      onRewarded();
      unsubEarned();
      adLoaded = false;
      preloadRewardedAd();
    });
  } catch {
    onFailed();
  }
};
