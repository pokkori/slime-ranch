import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, Text } from 'react-native';
import { useGameStore } from '../../src/store/gameStore';
import { THEME_COLORS } from '../../src/constants/colors';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: THEME_COLORS.tabBarActive,
        tabBarInactiveTintColor: THEME_COLORS.tabBarInactive,
        tabBarStyle: {
          backgroundColor: THEME_COLORS.tabBar,
          borderTopColor: THEME_COLORS.cardBorder,
        },
        headerStyle: {
          backgroundColor: THEME_COLORS.headerBg,
        },
        headerTintColor: THEME_COLORS.headerText,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Tabs.Screen
        name="ranch"
        options={{
          title: '牧場',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="encyclopedia"
        options={{
          title: '図鑑',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="book" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="shop"
        options={{
          title: 'ショップ',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cart" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="missions"
        options={{
          title: 'ミッション',
          tabBarIcon: ({ color, size }) => {
            const dailyMissions = useGameStore(s => s.dailyMissions);
            const unclaimedCount = dailyMissions?.filter(m => m.completed && !m.claimed).length ?? 0;
            return (
              <View>
                <Ionicons name="list" size={size} color={color} />
                {unclaimedCount > 0 && (
                  <View style={{
                    position: 'absolute',
                    top: -4,
                    right: -8,
                    backgroundColor: '#FF3B30',
                    borderRadius: 8,
                    minWidth: 16,
                    height: 16,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}>
                    <Text style={{ color: '#fff', fontSize: 10, fontWeight: 'bold' }}>{unclaimedCount}</Text>
                  </View>
                )}
              </View>
            );
          },
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: '設定',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
