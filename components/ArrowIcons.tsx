import * as React from 'react';
import Svg, { Path } from 'react-native-svg';

interface ArrowIconProps {
  color?: string;
  size?: number;
}

export const BottomLeftArrow = ({ color = '#000', size = 20 }: ArrowIconProps) => (
  <Svg width={size} height={size} viewBox="0 0 122.88 122.88">
    <Path
      d="M2.58,122.74,121.64,82.5a1.82,1.82,0,0,0,1.14-2.32A1.78,1.78,0,0,0,121.57,79h0L62,60.85,43.86,1.3h0A1.78,1.78,0,0,0,42.7.1a1.82,1.82,0,0,0-2.32,1.14L.14,120.3a1.85,1.85,0,0,0,2.44,2.44Z"
      fill={color}
    />
  </Svg>
);

export const RightArrow = ({ color = '#000', size = 20 }: ArrowIconProps) => (
  <Svg width={size} height={size} viewBox="0 0 122.86 121.64">
    <Path
      d="M121.62,59,2.78.2A1.92,1.92,0,0,0,.2,1.08a1.89,1.89,0,0,0,0,1.76h0l30.87,58L.23,118.8h0a1.89,1.89,0,0,0,0,1.76,1.92,1.92,0,0,0,2.58.88l118.84-58.8a2,2,0,0,0,0-3.64Z"
      fill={color}
    />
  </Svg>
);

export const TopRightArrow = ({ color = '#000', size = 20 }: ArrowIconProps) => (
  <Svg width={size} height={size} viewBox="0 0 122.88 122.88">
    <Path
      d="M120.3.14,1.24,40.38A1.82,1.82,0,0,0,.1,42.7a1.78,1.78,0,0,0,1.21,1.15h0L60.85,62,79,121.58h0a1.78,1.78,0,0,0,1.15,1.21,1.82,1.82,0,0,0,2.32-1.14L122.74,2.58A1.85,1.85,0,0,0,120.3.14Z"
      fill={color}
    />
  </Svg>
);
