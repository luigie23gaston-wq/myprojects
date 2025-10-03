<?php

namespace App\Services;

use App\Models\Message;
use Illuminate\Support\Facades\Cache;

class MessageService
{
    /**
     * Send a message and set cache notification for receiver
     * Using Laravel Cache (can use Redis when available)
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
        
        // Set cache notification flag for the receiver
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
