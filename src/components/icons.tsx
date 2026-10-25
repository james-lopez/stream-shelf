import Svg, { Path } from 'react-native-svg';

type IconProps = { size: number; color: string };

export function HomeIcon({ size, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round">
      <Path d="M3 10.5 12 3l9 7.5V21h-6v-6H9v6H3z" />
    </Svg>
  );
}

export function MyListIcon({ size, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round">
      <Path d="M6 3h12v18l-6-4-6 4z" />
    </Svg>
  );
}
