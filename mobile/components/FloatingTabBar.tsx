import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type TabVisual = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
};

const TAB_VISUALS: Record<string, TabVisual> = {
  index: { label: 'Home', icon: 'home-outline' },
  wallet: { label: 'Wallet', icon: 'wallet-outline' },
  'my-tickets': { label: 'Tickets', icon: 'ticket-outline' },
  account: { label: 'Account', icon: 'person-outline' },
};

type FloatingTabBarProps = {
  state: {
    index: number;
    routes: Array<{ key: string; name: string; params?: object }>;
  };
  descriptors: Record<
    string,
    {
      options: {
        tabBarAccessibilityLabel?: string;
        tabBarButtonTestID?: string;
      };
    }
  >;
  navigation: {
    emit: (options: {
      type: 'tabPress' | 'tabLongPress';
      target: string;
      canPreventDefault?: boolean;
    }) => any;
    navigate: (...args: any[]) => void;
  };
};

export function FloatingTabBar({ state, descriptors, navigation }: FloatingTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.host, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      <View style={styles.shell}>
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const visual = TAB_VISUALS[route.name];
          if (!visual) return null;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (isFocused || event.defaultPrevented) {
              return;
            }

            navigation.navigate(route.name, route.params);
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole='button'
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={descriptors[route.key]?.options.tabBarAccessibilityLabel}
              testID={descriptors[route.key]?.options.tabBarButtonTestID}
              onPress={onPress}
              onLongPress={onLongPress}
              style={[styles.tabButton, isFocused && styles.tabButtonActive]}
              activeOpacity={0.9}
            >
              <View style={[styles.iconWrap, isFocused && styles.iconWrapActive]}>
                <Ionicons
                  name={visual.icon}
                  size={18}
                  color={isFocused ? '#ffffff' : '#5a5653'}
                />
              </View>
              <Text style={[styles.tabLabel, isFocused && styles.tabLabelActive]}>{visual.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    zIndex: 20,
  },
  shell: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    borderWidth: 2,
    borderColor: '#171310',
    backgroundColor: '#fffaf6',
    borderRadius: 22,
    paddingHorizontal: 10,
    paddingVertical: 8,
    shadowColor: '#171310',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 10,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  tabButtonActive: {
    backgroundColor: '#ffe7f1',
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0ece8',
  },
  iconWrapActive: {
    backgroundColor: '#ff3d8c',
  },
  tabLabel: {
    marginTop: 5,
    fontSize: 10,
    fontWeight: '800',
    color: '#5a5653',
    letterSpacing: 0.2,
  },
  tabLabelActive: {
    color: '#171310',
    fontWeight: '900',
  },
});
