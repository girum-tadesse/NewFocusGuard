const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },
  // Our custom colors
  primary: '#FFA500',
  background: '#FFF9F5',
  white: '#FFFFFF',
  black: '#2D2D2D',
  gray: {
    light: '#E0E0E0',
    medium: '#B6B6B6',
    dark: '#808080',
  },
  google: {
    blue: '#4285F4',
    blueLight: '#87b1f7',
  },
  shadow: {
    primary: '#FFA500',
  },
} as const;

export type ColorTheme = typeof Colors; 