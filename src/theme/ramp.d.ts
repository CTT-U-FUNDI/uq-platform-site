export interface UqColorScale {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
  950: string;
  [step: string]: string;
}

export declare const UQ_HEX: {
  red: UqColorScale;
  green: UqColorScale;
  blue: UqColorScale;
  amber: UqColorScale;
  ink: UqColorScale;
};

export declare const UQ_RAMP: {
  red: UqColorScale;
  green: UqColorScale;
  blue: UqColorScale;
  amber: UqColorScale;
  ink: UqColorScale;
};

export declare function hexToChannels(hex: string): string;
