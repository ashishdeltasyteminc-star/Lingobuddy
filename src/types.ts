export interface UserProfile {
  uid: string;
  displayName: string | null;
  photoURL: string | null;
  targetLanguages: string[];
  nativeLanguage: string;
  createdAt: any;
}

export interface Conversation {
  id: string;
  userId: string;
  language: string;
  topic: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  startedAt: any;
  lastMessage?: string;
}

export interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  translation?: string;
  correction?: string;
  timestamp: any;
}
