<?php

namespace App\Services;

use App\Models\Message;
use App\Events\MessageSent;
use Illuminate\Support\Facades\Cache;

class MessageService
{
    /**
     * Send a message and set cache notification for receiver
     * Broadcasting via WebSocket + Cache notification for long polling fallback
     * 
     * @param int $senderId
     * @param int $receiverId
     * @param string $messageText
     * @return Message
     */
    public function sendMessage(int $senderId, int $receiverId, string $messageText): Message
    {
        // Save message to database
        $message = Message::create([
            'sender_id' => $senderId,
            'receiver_id' => $receiverId,
            'message' => $messageText,
        ]);
        
        // Load sender relationship for broadcasting
        $message->load('sender:id,username,firstname,lastname,image');
        
        // Broadcast via WebSocket (Soketi/Pusher)
        broadcast(new MessageSent($message))->toOthers();
        
        // Set cache notification flag for the receiver (fallback for long polling)
        $this->notifyUser($receiverId, $message->id);
        
        return $message;
    }
    
    /**
     * Set cache notification flag for a user
     * 
     * @param int $userId
     * @param int $latestMessageId
     * @return void
     */
    public function notifyUser(int $userId, int $latestMessageId): void
    {
        $cacheKey = "chat:user:{$userId}:new_messages";
        
        // Set the notification with the latest message ID
        // Expire after 60 seconds to prevent stale notifications
        Cache::put($cacheKey, $latestMessageId, 60);
    }
    
    /**
     * Check if user has new message notification in cache
     * 
     * @param int $userId
     * @return int|null Returns the latest message ID if exists, null otherwise
     */
    public function checkNotification(int $userId): ?int
    {
        $cacheKey = "chat:user:{$userId}:new_messages";
        $latestId = Cache::get($cacheKey);
        
        return $latestId ? (int) $latestId : null;
    }
    
    /**
     * Clear notification flag for a user
     * 
     * @param int $userId
     * @return void
     */
    public function clearNotification(int $userId): void
    {
        $cacheKey = "chat:user:{$userId}:new_messages";
        Cache::forget($cacheKey);
    }
}
