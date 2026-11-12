// The app's line icons, drawn on a 24px grid with round caps (from the approved design).
import React from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

export type GlyphName =
  | 'today' | 'habits' | 'qibla' | 'library' | 'pin' | 'user' | 'check' | 'redo' | 'dash'
  | 'clock' | 'beads' | 'hands' | 'mosque' | 'search' | 'arrow' | 'moon' | 'book' | 'star'
  | 'wallet' | 'pen' | 'leaf' | 'kaaba' | 'brain' | 'calendar' | 'sunrise' | 'left' | 'right'
  | 'plus' | 'close' | 'bell' | 'settings' | 'sun' | 'quran' | 'scroll' | 'compass' | 'heart';

function shapes(name: GlyphName): React.ReactNode {
  switch (name) {
    case 'today':
      return <><Circle cx="12" cy="12" r="4" /><Path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>;
    case 'sun':
      return <><Circle cx="12" cy="12" r="4" /><Path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>;
    case 'habits':
      return <><Rect x="3" y="3" width="7" height="7" rx="2" /><Rect x="14" y="3" width="7" height="7" rx="2" /><Rect x="3" y="14" width="7" height="7" rx="2" /><Rect x="14" y="14" width="7" height="7" rx="2" /></>;
    case 'qibla':
    case 'compass':
      return <><Circle cx="12" cy="12" r="9" /><Path d="M15.5 8.5l-2 5-5 2 2-5z" /></>;
    case 'library':
      return <><Path d="M4 5a2 2 0 012-2h13v16H6a2 2 0 00-2 2z" /><Path d="M4 19V5M9 7h6" /></>;
    case 'pin':
      return <><Path d="M12 21s-7-6.3-7-12a7 7 0 0114 0c0 5.7-7 12-7 12z" /><Circle cx="12" cy="9" r="2.5" /></>;
    case 'user':
      return <><Circle cx="12" cy="8" r="4" /><Path d="M4 21a8 8 0 0116 0" /></>;
    case 'check':
      return <Path d="M5 12.5l4.5 4.5L19 7.5" />;
    case 'redo':
      return <><Path d="M20 7v5h-5" /><Path d="M20 12a8 8 0 10-2.3 5.7" /></>;
    case 'dash':
      return <Path d="M7 12h10" />;
    case 'clock':
      return <><Circle cx="12" cy="12" r="8" /><Path d="M12 8v4l3 2" /></>;
    case 'beads':
      return <><Circle cx="12" cy="5" r="2" /><Circle cx="6.5" cy="8.5" r="2" /><Circle cx="17.5" cy="8.5" r="2" /><Circle cx="6.5" cy="15" r="2" /><Circle cx="17.5" cy="15" r="2" /><Path d="M12 18v4" /><Circle cx="12" cy="18" r="1.4" /></>;
    case 'hands':
      return <Path d="M8 21v-5l-3-4V6a1.5 1.5 0 013 0v4M16 21v-5l3-4V6a1.5 1.5 0 00-3 0v4M8 10l2 3M16 10l-2 3" />;
    case 'mosque':
      return <Path d="M4 21V12a8 5 0 0116 0v9zM12 3v3M2 21h20M10 21v-4a2 2 0 014 0v4" />;
    case 'search':
      return <><Circle cx="11" cy="11" r="7" /><Path d="M20 20l-3.5-3.5" /></>;
    case 'arrow':
      return <Path d="M5 12h14M13 6l6 6-6 6" />;
    case 'moon':
      return <Path d="M20 14.5A8 8 0 019.5 4a8 8 0 1010.5 10.5z" />;
    case 'book':
    case 'quran':
      return <><Path d="M3 5c3-1 6-1 9 1 3-2 6-2 9-1v14c-3-1-6-1-9 1-3-2-6-2-9-1z" /><Path d="M12 6v14" /></>;
    case 'scroll':
      return <><Path d="M6 3h11a2 2 0 012 2v14a2 2 0 01-2 2H7a2 2 0 01-2-2V4" /><Path d="M9 8h7M9 12h7M9 16h4" /></>;
    case 'star':
      return <Path d="M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.5 6.7 19.4l1.2-6L3.4 9.3l6-.7z" />;
    case 'wallet':
      return <><Rect x="3" y="6" width="18" height="14" rx="3" /><Path d="M3 10h18M16 15h2" /></>;
    case 'pen':
      return <Path d="M4 20h4L19 9l-4-4L4 16z" />;
    case 'leaf':
      return <Path d="M5 19c0-9 6-14 15-14 0 9-5 15-14 15zM5 19l8-8" />;
    case 'kaaba':
      return <><Path d="M4 8l8-4 8 4v10l-8 3-8-3z" /><Path d="M4 11l8 3 8-3" /></>;
    case 'brain':
      return <Path d="M9 4a3 3 0 00-3 3 3 3 0 00-1 5.5A3 3 0 008 18a3 3 0 004 1V5a3 3 0 00-3-1zM15 4a3 3 0 013 3 3 3 0 011 5.5A3 3 0 0116 18a3 3 0 01-4 1" />;
    case 'calendar':
      return <><Rect x="3" y="4" width="18" height="17" rx="3" /><Path d="M3 9h18M8 2v4M16 2v4" /></>;
    case 'sunrise':
      return <Path d="M5 18a7 7 0 0114 0M2 18h20M12 3v5M9 6l3-3 3 3" />;
    case 'left':
      return <Path d="M15 6l-6 6 6 6" />;
    case 'right':
      return <Path d="M9 6l6 6-6 6" />;
    case 'plus':
      return <Path d="M12 5v14M5 12h14" />;
    case 'close':
      return <Path d="M6 6l12 12M18 6L6 18" />;
    case 'bell':
      return <><Path d="M6 16V11a6 6 0 0112 0v5l1.5 2h-15z" /><Path d="M10 21h4" /></>;
    case 'settings':
      return <><Circle cx="12" cy="12" r="3" /><Path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" /></>;
    case 'heart':
      return <Path d="M12 20s-7-4.4-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.6-7 10-7 10z" />;
  }
}

interface GlyphProps {
  name: GlyphName;
  size?: number;
  color: string;
  strokeWidth?: number;
}

export function Glyph({ name, size = 20, color, strokeWidth = 1.75 }: GlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
      strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      {shapes(name)}
    </Svg>
  );
}
