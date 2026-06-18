export type AppStatus = 'draft' | 'published';

export type WidgetType = 'static_text' | 'input' | 'llm' | 'image' | 'chat';

export interface App {
  id: string;
  name: string;
  description: string;
  status: AppStatus;
  thumbnail: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  widgets: Widget[];
}

export interface Template {
  id: string;
  name: string;
  description: string;
  author: string;
  authorAvatar: string;
  thumbnail: string;
  accentColor: string;
  category: string;
  rating: number;
  cloneCount: number;
  publishedAt: string;
  featured: boolean;
}

export interface MockUser {
  id: string;
  name: string;
  email: string;
  avatarIndex: number;
}

export interface Widget {
  id: string;
  type: WidgetType;
  x: number;
  y: number;
  w: number;
  h: number;
  title: string;
  // Optional props — used by specific widget types
  content?: string;       // static_text: body text
  placeholder?: string;   // input | llm | chat
  prompt?: string;        // llm | chat: system / initial prompt
  model?: string;         // llm
  temperature?: number;   // llm: 0–1
  imagePrompt?: string;   // image
  imageStyle?: string;    // image
}
