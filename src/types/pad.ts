export interface PadData {
  content: string;
  password?: string;
  lastUpdated: string;
}

export interface PadResponse {
  path: string;
  padData: PadData;
}

