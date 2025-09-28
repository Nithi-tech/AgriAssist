'use client';

let messageIdCounter = 0;

export function generateMessageId(): string {
  return `msg-${++messageIdCounter}-${Math.random().toString(36).slice(2)}`;
}
