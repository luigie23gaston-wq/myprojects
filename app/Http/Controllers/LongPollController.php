<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Services\MessageService;
use App\Models\Message;

class LongPollController extends Controller
{
    protected $messageService;
    
    public function __construct(MessageService $messageService)
    {
        $this->messageService = $messageService;
    }
    
    /**
     * Optimized Redis-based Long Polling implementation
     * Uses shorter intervals (200ms) for faster response
     * Falls back to database query with proper indexing
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function fetchNewMessages(Request $request)
    {
        $lastMessageId = $request->input('last_message_id', 0);
        $currentUserId = Auth::id();
        
        // Define optimized timeout: 20 seconds max wait
        $maxWait = 20; // seconds
        $checkInterval = 0.2; // 200ms for faster response
        $maxChecks = (int) ($maxWait / $checkInterval);
        
        // Optimized Polling Loop with exponential backoff
        for ($i = 0; $i < $maxChecks; $i++) {
            // Priority 1: Check Redis for instant notification
            $latestId = $this->messageService->checkNotification($currentUserId);
            
            if ($latestId !== null) {
                // Clear the Redis notification flag
                $this->messageService->clearNotification($currentUserId);
                
                return response()->json([
                    'success' => true,
                    'has_new_messages' => true,
                    'new_messages_since_id' => $lastMessageId
                ]);
            }
            
            // Priority 2: Fallback to optimized database query (uses indexes)
            // Check every 5 iterations (1 second) to reduce load
            if ($i % 5 === 0) {
                $newMessages = Message::where('receiver_id', $currentUserId)
                    ->where('id', '>', $lastMessageId)
                    ->select('id')
                    ->orderBy('id', 'desc')
                    ->limit(1)
                    ->first();
                
                if ($newMessages) {
                    return response()->json([
                        'success' => true,
                        'has_new_messages' => true,
                        'new_messages_since_id' => $lastMessageId
                    ]);
                }
            }
            
            // Micro-sleep for 200ms (faster than 1 second)
            usleep($checkInterval * 1000000);
        }
        
        // Timeout: No new messages found
        return response()->json([
            'success' => true,
            'has_new_messages' => false,
            'latest_id' => $lastMessageId
        ]);
    }
}
