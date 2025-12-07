import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';

interface TabIconProps {
  name: 'home' | 'hutang' | 'history' | 'profile';
  color: string;
  size?: number;
}

export function TabIcon({ name, color, size = 24 }: TabIconProps) {
  switch (name) {
    case 'home':
      return (
        <Svg width={size} height={size} viewBox="0 0 22 22" fill="none">
          <Path
            d="M11 12.222V15.889"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M2.75 8.25L11 1.833L19.25 8.25V18.333C19.25 18.7754 19.0744 19.1993 18.7618 19.5118C18.4493 19.8244 18.0254 20 17.583 20H4.417C3.9746 20 3.5507 19.8244 3.2382 19.5118C2.9256 19.1993 2.75 18.7754 2.75 18.333V8.25Z"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );

    case 'hutang':
      return (
        <Svg width={size} height={size} viewBox="0 0 28 28" fill="none">
          <Path
            d="M7 4.66699H21C22.1046 4.66699 23 5.56242 23 6.66699V21.0003C23 22.1049 22.1046 23.0003 21 23.0003H7C5.89543 23.0003 5 22.1049 5 21.0003V6.66699C5 5.56242 5.89543 4.66699 7 4.66699Z"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M10.5 11.667L17.5 11.667"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M10.5 16.333H14"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );

    case 'history':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M5 4C5 2.89543 5.89543 2 7 2H17C18.1046 2 19 2.89543 19 4V21C19 22.1046 18.1046 23 17 23H7C5.89543 23 5 22.1046 5 21V4Z"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M9 9H15"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M9 13H15"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M9 17H13"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );

    case 'profile':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Circle
            cx="12"
            cy="7"
            r="4"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
          />
          <Path
            d="M5.33788 18.3206C5.99897 15.5269 8.77173 14 11.6426 14H12.3574C15.2283 14 18.001 15.5269 18.6621 18.3206C18.79 18.8611 18.8917 19.4268 18.9489 20.0016C19.0036 20.5512 18.5523 21 18 21H6C5.44772 21 4.99642 20.5512 5.0511 20.0016C5.1083 19.4268 5.20997 18.8611 5.33788 18.3206Z"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
          />
        </Svg>
      );

    default:
      return null;
  }
}
