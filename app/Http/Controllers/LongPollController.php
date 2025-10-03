<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Services\MessageService;

class LongPollController extends Controller
{
    protected $messageService;
    
    public function __construct(MessageService $messageService)
    {
        $this->messageService = $messageService;
    }
    
    /**
     * Redis-based Long Polling implementation
     * Only checks Redis for notifications, does NOT query database
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function fetchNewMessages(Request $request)
    {
        $lastMessageId = $request->input('last_message_id', 0);
        $currentUserId = Auth::id();
        
        // Define timeout: 10 seconds for fast polling
        $timeout = 10;
        $startTime = time();
        
        // Fast Redis Polling Loop - NO DATABASE QUERIES
        while ((time() - $startTime) < $timeout) {
            // Check Redis for new message notification
            $latestId = $this->messageService->checkNotification($currentUserId);
            
            // Success Condition: If notification exists in Redis
            if ($latestId !== null) {
                // Clear the Redis notification flag
                $this->messageService->clearNotification($currentUserId);
                
                // Return notification to client to fetch messages
                return response()->json([
                    'success' => true,
                    'has_new_messages' => true,
                    'new_messages_since_id' => $lastMessageId
                ]);
            }
            
            // Sleep for 1 second before next check
            sleep(1);
        }
        
        // Timeout: No new messages found
        return response()->json([
            'success' => true,
            'has_new_messages' => false,
            'latest_id' => $lastMessageId
        ]);
    }
}
