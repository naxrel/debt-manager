import React from 'react';
import Svg, { Path } from 'react-native-svg';

type IconProps = {
  size?: number;
  color?: string;
};

export default function LogOutIcon({
  size = 27,
  color = '#000',
}: IconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
    >
      <Path
        d="M12 15L15 12
           M15 12L12 9
           M15 12H4
           M4 7.24802V7.2002
           C4 6.08009 4 5.51962 4.21799 5.0918
           C4.40973 4.71547 4.71547 4.40973 5.0918 4.21799
           C5.51962 4 6.08009 4 7.2002 4
           H16.8002
           C17.9203 4 18.4796 4 18.9074 4.21799
           C19.2837 4.40973 19.5905 4.71547 19.7822 5.0918
           C20 5.5192 20 6.07899 20 7.19691
           V16.8036
           C20 17.9215 20 18.4805 19.7822 18.9079
           C19.5905 19.2842 19.2837 19.5905 18.9074 19.7822
           C18.48 20 17.921 20 16.8031 20
           H7.19691
           C6.07899 20 5.5192 20 5.0918 19.7822
           C4.71547 19.5905 4.40973 19.2839 4.21799 18.9076
           C4 18.4798 4 17.9201 4 16.8
           V16.75"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
