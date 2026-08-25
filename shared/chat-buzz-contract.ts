/**
 * عقد API المقترح للسيرفر الذاتي. لا يحمل هذا الملف أسراراً أو تنفيذاً للخادم.
 * يجب أن يتحقق السيرفر من جلسة المستخدم قبل إصدار أي رمز صوت.
 */
export type JoinRoomRequest = {
  roomId: string;
};

export type JoinRoomResponse = {
  roomId: string;
  liveKitUrl: string;
  participantToken: string;
  expiresAt: string;
};

export type ApiHealthResponse = {
  status: "ok";
  service: "chat-buzz-api";
};

export const chatBuzzApiContract = {
  health: "GET /health",
  rooms: "GET /v1/rooms",
  roomMessages: "GET /v1/rooms/:roomId/messages",
  sendRoomMessage: "POST /v1/rooms/:roomId/messages",
  joinVoiceRoom: "POST /v1/voice/join",
  conversations: "GET /v1/conversations",
  sendDirectMessage: "POST /v1/conversations/:conversationId/messages",
  sendGift: "POST /v1/gifts/send",
} as const;
