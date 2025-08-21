export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface WebSocketMessage {
  type: string;
  payload: any;
  timestamp: number;
}

export enum UserStatus {
  ONLINE = "online",
  IDLE = "idle",
  DND = "dnd",
  OFFLINE = "offline",
}

export enum MessageType {
  TEXT = "text",
  IMAGE = "image",
  VIDEO = "video",
  FILE = "file",
  EMBED = "embed",
  SYSTEM = "system",
}