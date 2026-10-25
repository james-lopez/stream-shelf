import { Exo2_600SemiBold, useFonts } from '@expo-google-fonts/exo-2';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { ClipPath, Defs, LinearGradient, Path, Stop } from 'react-native-svg';

import mark from '../../assets/brand/mark.json';
import { brandGradient, colors, fonts } from '../theme';

const [vx, vy, vw, vh] = mark.viewBox;

/** The "SS" ribbon. Geometry lives in assets/brand/mark.json so app icons stay in sync. */
export function LogoMark({ size }: { size: number }) {
  return (
    <Svg width={(size * vw) / vh} height={size} viewBox={`${vx} ${vy} ${vw} ${vh}`}>
      <Defs>
        <LinearGradient
          id="brand"
          gradientUnits="userSpaceOnUse"
          x1={mark.gradient.from[0]}
          y1={mark.gradient.from[1]}
          x2={mark.gradient.to[0]}
          y2={mark.gradient.to[1]}
        >
          {brandGradient.map((color, i) => (
            <Stop key={color} offset={i / (brandGradient.length - 1)} stopColor={color} />
          ))}
        </LinearGradient>
        <ClipPath id="ends">
          <Path d={mark.clip} clipRule="evenodd" />
        </ClipPath>
      </Defs>
      <Path d={mark.ribbon} stroke="url(#brand)" strokeWidth={mark.strokeWidth} fill="none" clipPath="url(#ends)" />
    </Svg>
  );
}

export function Brand({ size }: { size: number }) {
  // Falls back to the system font until Exo 2 loads rather than blocking first paint.
  const [loaded] = useFonts({ Exo2_600SemiBold });

  return (
    <View style={styles.row} accessibilityRole="header" accessibilityLabel="StreamShelf">
      <LogoMark size={size * 0.9} />
      <Text style={[styles.word, { fontSize: size, fontFamily: loaded ? fonts.brand : undefined }]}>
        StreamShelf
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  word: { color: colors.text, letterSpacing: 0.5 },
});
