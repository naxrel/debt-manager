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
case 'people': // icon group / people
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
    >
      <Path
        d="M17 20C17 18.3431 14.7614 17 12 17C9.23858 17 7 18.3431 7 20
           M21 17.0004C21 15.7702 19.7659 14.7129 18 14.25
           M3 17.0004C3 15.7702 4.2341 14.7129 6 14.25
           M18 10.2361C18.6137 9.68679 19 8.8885 19 8
           C19 6.34315 17.6569 5 16 5
           C15.2316 5 14.5308 5.28885 14 5.76389
           M6 10.2361C5.38625 9.68679 5 8.8885 5 8
           C5 6.34315 6.34315 5 8 5
           C8.76835 5 9.46924 5.28885 10 5.76389
           M12 14C10.3431 14 9 12.6569 9 11
           C9 9.34315 10.3431 8 12 8
           C13.6569 8 15 9.34315 15 11
           C15 12.6569 13.6569 14 12 14"
        stroke={color}
        strokeWidth={2}
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
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
    >
      <Path
        d="M20.3499 8.92293L19.9837 8.7192
           C19.5983 8.49165 19.3682 8.26564 19.2002 7.99523
           C19.1833 7.96802 19.1348 7.8831 19.1348 7.8831
           C18.92 7.48866 18.8385 7.17515 18.8336 6.85606
           L18.8415 6.30078
           C18.8529 5.62025 18.8587 5.27894 18.763 4.97262
           C18.6781 4.70053 18.536 4.44993 18.3462 4.23725
           C18.1317 3.99685 17.8347 3.82534 17.2402 3.48276
           L16.7464 3.1982
           C16.1536 2.85658 15.8571 2.68571 15.5423 2.62057
           C15.2639 2.56294 14.9765 2.56561 14.6991 2.62789
           C14.3859 2.69819 14.0931 2.87351 13.5079 3.22396
           L13.1507 3.43741
           C12.7601 3.6581 12.4495 3.74365 12.1312 3.75387
           C11.5515 3.74361 11.2402 3.65759 10.9615 3.50224
           L10.4935 3.22213
           C9.90422 2.86836 9.60915 2.69121 9.29427 2.62057
           C9.0157 2.55807 8.72737 2.55634 8.44791 2.61471
           C8.13236 2.68062 7.83577 2.85276 7.24258 3.19703
           L6.74688 3.48454
           C6.15904 3.82572 5.86441 3.99672 5.6517 4.23614
           C5.46294 4.4486 5.32185 4.69881 5.2374 4.97018
           C5.14194 5.27691 5.14703 5.61896 5.15853 6.3027
           L5.16568 6.72736
           C5.16343 7.17499 5.08086 7.48914 4.92974 7.77096
           C4.63336 8.26452 4.40214 8.49186 4.12733 8.65572
           L3.65365 8.91908
           C3.05208 9.25245 2.75137 9.41928 2.53256 9.65669
           C2.33898 9.86672 2.19275 10.1158 2.10349 10.3872
           C2.00259 10.6939 2.00267 11.0378 2.00424 11.7255
           L2.00551 12.2877
           C2.00919 13.3122 2.19979 13.8863 2.53744 14.3427
           C2.75502 14.5787 3.05274 14.7445 3.64974 15.0766
           L4.12917 15.3444
           C4.63089 15.735 4.79818 16.0053 4.93594 16.2452
           C5.16114 16.8315 5.16649 17.1455 5.16541 17.2827
           L5.15853 17.6902
           C5.1419 18.7197 5.32287 19.2994 5.65463 19.7627
           C5.86915 20.0031 6.16655 20.1745 6.76107 20.5171
           L7.25478 20.8015
           C7.84763 21.1432 8.14395 21.3138 8.45869 21.379
           C8.73714 21.4366 9.02464 21.4344 9.30209 21.3721
           C9.61567 21.3017 9.90948 21.1258 10.4964 20.7743
           L10.8502 20.5625
           C11.2409 20.3418 11.5512 20.2558 11.8695 20.2456
           C12.7607 20.3422 13.0394 20.4975 13.5078 20.7777
           L14.7065 21.3788
           C15.5531 21.3855 16.1657 21.1471 16.7586 20.803
           L17.2536 20.5157
           C17.8418 20.1743 18.1367 20.0031 18.3495 19.7636
           C18.6796 19.3011 18.8588 18.7252 18.8417 17.7119
           L18.8343 17.2724
           C18.9195 16.5104 19.1994 16.0068 19.8744 15.3435
           L20.3472 15.0805
           C20.9488 14.7472 21.2501 14.5801 21.4689 14.3427
           C21.8085 13.8839 21.9981 13.3077 21.9945 11.7119
           C21.9921 10.6874 21.8015 10.1133 21.463 9.65685
           C21.2457 9.42111 20.9475 9.25526 20.3517 8.92378Z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <Path
        d="M8.00033 12
           C8.00033 14.2091 9.79119 16 12.0003 16
           C14.2095 16 16.0003 14.2091 16.0003 12
           C16.0003 9.79082 14.2095 7.99996 12.0003 7.99996
           C9.79119 7.99996 8.00033 9.79082 8.00033 12Z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );


    default:
      return null;
  }
}