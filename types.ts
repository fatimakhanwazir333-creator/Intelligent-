
export type Gender = 'Man' | 'Woman' | 'Child' | 'Personal';

export interface FabricData {
  id: string;
  image: string; // base64
  analysis?: string;
}

export interface ClientDetails {
  name: string;
  notes: string;
  priority: 'Standard' | 'Express';
  silhouetteMode: 'Stock' | 'Personal';
}

export interface GarmentModifications {
  sleeves: string;
  pockets: number;
  fit: string;
}

export interface RenderProfile {
  model: Gender;
  userSilhouette?: string; // base64 of client photo
  background: 'minimal_white' | 'original';
  modifications: GarmentModifications;
}

export interface GarmentConfig {
  kernel_state: 'ACTIVE' | 'IDLE';
  render_profile: RenderProfile;
}

export interface HistorySnapshot {
  config: GarmentConfig;
  previewUrl: string | null;
}

export interface SessionState {
  fabric: FabricData | null;
  previewUrl: string | null;
  history: ChatMessage[];
  isProcessing: boolean;
  designMetadata: GarmentConfig;
  clientDetails?: ClientDetails;
  userSilhouette?: string; // Persistent store for captured photo
  past: HistorySnapshot[];
  future: HistorySnapshot[];
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  data?: any;
  sources?: GroundingSource[];
}

export enum ModelType {
  GEMINI_TEXT = 'gemini-3-flash-preview',
  GEMINI_IMAGE = 'gemini-2.5-flash-image'
}
