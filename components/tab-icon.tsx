import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';

// Definisi nama icon yang valid agar Autocomplete bekerja saat dipanggil
export type IconName = 'home' | 'hutang' | 'history' | 'profile' | 'settings' | 'people'; // Tambahkan 'people' jika perlu untuk group

interface TabIconProps {
  name: IconName;
  color: string;
  size?: number;
  focused?: boolean; // Opsional: Siapkan props ini jika nanti butuh state aktif/nonaktif
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

    case 'hutang': // Bisa juga dipakai untuk 'Groups'
    case 'people': // Alias agar kode lain yang panggil 'people' tetap jalan
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
          <Path d="M9 9H15" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M9 13H15" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M9 17H13" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );

    case 'profile':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Circle cx="12" cy="7" r="4" stroke={color} strokeWidth="2" strokeLinecap="round" />
          <Path
            d="M5.33788 18.3206C5.99897 15.5269 8.77173 14 11.6426 14H12.3574C15.2283 14 18.001 15.5269 18.6621 18.3206C18.79 18.8611 18.8917 19.4268 18.9489 20.0016C19.0036 20.5512 18.5523 21 18 21H6C5.44772 21 4.99642 20.5512 5.0511 20.0016C5.1083 19.4268 5.20997 18.8611 5.33788 18.3206Z"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
          />
        </Svg>
      );

    case 'settings':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M3.08168 13.9445C2.55298 12.9941 2.28862 12.5188 2.28862 12C2.28862 11.4812 2.55298 11.0059 3.08169 10.0555L4.43094 7.63L5.85685 5.24876C6.4156 4.31567 6.69498 3.84912 7.14431 3.5897C7.59364 3.33028 8.13737 3.3216 9.22483 3.30426L12 3.26L14.7752 3.30426C15.8626 3.3216 16.4064 3.33028 16.8557 3.5897C17.305 3.84912 17.5844 4.31567 18.1431 5.24876L19.5691 7.63L20.9183 10.0555C21.447 11.0059 21.7114 11.4812 21.7114 12C21.7114 12.5188 21.447 12.9941 20.9183 13.9445L19.5691 16.37L18.1431 18.7512C17.5844 19.6843 17.305 20.1509 16.8557 20.4103C16.4064 20.6697 15.8626 20.6784 14.7752 20.6957L12 20.74L9.22483 20.6957C8.13737 20.6784 7.59364 20.6697 7.14431 20.4103C6.69498 20.1509 6.4156 19.6843 5.85685 18.7512L4.43094 16.37L3.08168 13.9445Z"
            stroke={color}
            strokeWidth="2"
          />
          <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth="2" />
        </Svg>
      );

    default:
      return null;
  }
}