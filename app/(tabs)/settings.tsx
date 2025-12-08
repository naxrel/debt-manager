import { Font } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import React from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

export default function SettingsScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.replace('/auth/login');
  };

  const menuItems = [
    {
      section: 'Account',
      items: [
        {
          icon: 'profile',
          label: 'Profile',
          onPress: () => router.push('/profile'),
        },
        {
          icon: 'savings',
          label: 'Account Savings',
          onPress: () => {}, // Nanti
        },
        {
          icon: 'security',
          label: 'Security',
          onPress: () => router.push('/security'),
        },
        {
          icon: 'history',
          label: 'History',
          onPress: () => router.push('/history'),
        },
      ],
    },
    {
      section: 'Support',
      items: [
        {
          icon: 'help',
          label: 'Help Centre',
          onPress: () => {},
        },
        {
          icon: 'about',
          label: 'About',
          onPress: () => {},
        },
      ],
    },
  ];

  const renderIcon = (iconName: string, color: string = '#1f2937') => {
    switch (iconName) {
      case 'profile':
        return (
          <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
            <Circle cx="12" cy="7" r="4" stroke={color} strokeWidth="2" />
            <Path
              d="M5.33788 18.3206C5.99897 15.5269 8.77173 14 11.6426 14H12.3574C15.2283 14 18.001 15.5269 18.6621 18.3206C18.79 18.8611 18.8917 19.4268 18.9489 20.0016C19.0036 20.5512 18.5523 21 18 21H6C5.44772 21 4.99642 20.5512 5.0511 20.0016C5.1083 19.4268 5.20997 18.8611 5.33788 18.3206Z"
              stroke={color}
              strokeWidth="2"
            />
          </Svg>
        );
      case 'savings':
        return (
          <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
            <Path
              d="M5 6C3.89543 6 3 6.89543 3 8V17C3 18.1046 3.89543 19 5 19H19C20.1046 19 21 18.1046 21 17V8C21 6.89543 20.1046 6 19 6H5Z"
              stroke={color}
              strokeWidth="2"
            />
            <Path d="M7 15H7.01" stroke={color} strokeWidth="2" strokeLinecap="round" />
            <Path d="M4 11H21" stroke={color} strokeWidth="2" strokeLinecap="round" />
          </Svg>
        );
      case 'security':
        return (
          <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
            <Path
              d="M7 10V8C7 5.23858 9.23858 3 12 3C14.7614 3 17 5.23858 17 8V10M6 10H18C19.1046 10 20 10.8954 20 12V20C20 21.1046 19.1046 22 18 22H6C4.89543 22 4 21.1046 4 20V12C4 10.8954 4.89543 10 6 10Z"
              stroke={color}
              strokeWidth="2"
            />
          </Svg>
        );
      case 'history':
        return (
          <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
            <Path
              d="M5 4C5 2.89543 5.89543 2 7 2H17C18.1046 2 19 2.89543 19 4V21C19 22.1046 18.1046 23 17 23H7C5.89543 23 5 22.1046 5 21V4Z"
              stroke={color}
              strokeWidth="2"
            />
            <Path d="M9 9H15" stroke={color} strokeWidth="2" strokeLinecap="round" />
            <Path d="M9 13H15" stroke={color} strokeWidth="2" strokeLinecap="round" />
            <Path d="M9 17H13" stroke={color} strokeWidth="2" strokeLinecap="round" />
          </Svg>
        );
      case 'help':
        return (
          <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
            <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
            <Path
              d="M12 17V17.01M12 14C12 13 13 12.5 13.5 11.5C14 10.5 14 9.5 14 9C14 7.89543 13.1046 7 12 7C10.8954 7 10 7.89543 10 9"
              stroke={color}
              strokeWidth="2"
              strokeLinecap="round"
            />
          </Svg>
        );
      case 'about':
        return (
          <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
            <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
            <Path d="M12 8V8.01" stroke={color} strokeWidth="2" strokeLinecap="round" />
            <Path d="M12 12V16" stroke={color} strokeWidth="2" strokeLinecap="round" />
          </Svg>
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {menuItems.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            {section.items.map((item, itemIndex) => (
              <TouchableOpacity
                key={itemIndex}
                style={[
                  styles.menuItem,
                  itemIndex === 0 && styles.menuItemFirst,
                  itemIndex === section.items.length - 1 && styles.menuItemLast,
                ]}
                onPress={item.onPress}
                activeOpacity={0.7}
              >
                <View style={styles.menuItemLeft}>
                  <View style={styles.iconContainer}>{renderIcon(item.icon)}</View>
                  <Text style={styles.menuItemLabel}>{item.label}</Text>
                </View>
                <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
                  <Path
                    d="M7.5 15L12.5 10L7.5 5"
                    stroke="#9ca3af"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              </TouchableOpacity>
            ))}
          </View>
        ))}

        {/* Logout Button */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <View style={styles.menuItemLeft}>
            <View style={styles.iconContainer}>
              <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M9.28062 6.46494V5.72152C9.28062 4.10317 9.28062 3.294 9.75458 2.73451C10.2285 2.17502 11.0267 2.04199 12.623 1.77594L14.2942 1.49741C17.5373 0.956891 19.1589 0.686633 20.2197 1.58533C21.2806 2.48403 21.2806 4.12794 21.2806 7.41577V13.2502C21.2806 16.5381 21.2806 18.182 20.2197 19.0807C19.1589 19.9794 17.5373 19.7091 14.2942 19.1686L12.623 18.8901C11.0267 18.624 10.2285 18.491 9.75458 17.9315C9.28062 17.372 9.28062 16.5628 9.28062 14.9445V14.399"
                  stroke="#dc2626"
                  strokeWidth="2"
                />
                <Path
                  d="M1.28062 10.333L0.499756 9.70831L-4.57838e-07 10.333L0.499756 10.9577L1.28062 10.333ZM10.2806 11.333C10.8329 11.333 11.2806 10.8853 11.2806 10.333C11.2806 9.78072 10.8329 9.33301 10.2806 9.33301V10.333V11.333ZM5.28062 5.33301L4.49976 4.70831L0.499756 9.70831L1.28062 10.333L2.06149 10.9577L6.06149 5.9577L5.28062 5.33301ZM1.28062 10.333L0.499756 10.9577L4.49976 15.9577L5.28062 15.333L6.06149 14.7083L2.06149 9.70831L1.28062 10.333ZM1.28062 10.333V11.333H10.2806V10.333V9.33301H1.28062V10.333Z"
                  fill="#dc2626"
                />
              </Svg>
            </View>
            <Text style={styles.logoutText}>Logout</Text>
          </View>
          <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
            <Path
              d="M7.5 15L12.5 10L7.5 5"
              stroke="#9ca3af"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    backgroundColor: '#ffffff',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: Font.bold,
    color: '#1f2937',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginTop: 20,
    marginHorizontal: 20,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  menuItemFirst: {
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  menuItemLast: {
    borderBottomWidth: 0,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuItemLabel: {
    fontSize: 16,
    fontFamily: Font.semiBold,
    color: '#1f2937',
  },
  logoutButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 20,
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
  },
  logoutText: {
    fontSize: 16,
    fontFamily: Font.semiBold,
    color: '#dc2626',
  },
});
