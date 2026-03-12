import React from "react";
import Svg, { Circle, Ellipse, Path, Rect, Text as SvgText } from "react-native-svg";

export const MTNLogo = ({ size = 40 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Circle cx="50" cy="50" r="50" fill="#FFCC00" />
    <SvgText
      x="50" y="62" textAnchor="middle"
      fontSize="28" fontWeight="bold" fill="#000"
    >
      MTN
    </SvgText>
  </Svg>
);

export const GloLogo = ({ size = 40 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Circle cx="50" cy="50" r="50" fill="#00A859" />
    <SvgText
      x="50" y="62" textAnchor="middle"
      fontSize="30" fontWeight="bold" fill="#fff"
    >
      glo
    </SvgText>
  </Svg>
);

export const AirtelLogo = ({ size = 40 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Circle cx="50" cy="50" r="50" fill="#ED1C24" />
    <SvgText
      x="50" y="62" textAnchor="middle"
      fontSize="22" fontWeight="bold" fill="#fff"
    >
      airtel
    </SvgText>
  </Svg>
);

export const NineMobileLogo = ({ size = 40 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Circle cx="50" cy="50" r="50" fill="#00A65E" />
    <SvgText
      x="50" y="55" textAnchor="middle"
      fontSize="22" fontWeight="bold" fill="#fff"
    >
      9mobile
    </SvgText>
  </Svg>
);
