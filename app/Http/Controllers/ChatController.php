<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Cache;
use App\Models\Message;
use App\Models\Conversation;
use App\Models\User;
use App\Services\MessageService;

class ChatController extends Controller
{
    protected $messageService;
    
    public function __construct(MessageService $messageService)
    {
        $this->messageService = $messageService;
    }

    /**
     * Search users for starting new conversations
     */
    public function searchUsers(Request $request)
    {
        // Accept both 'search' and 'q' parameters
        $searchTerm = $request->input('q', $request->input('search', ''));
        $currentUserId = Auth::id();
        
        if (empty($searchTerm)) {
            return response()->json([
                'success' => true,
                'users' => []
            ]);
        }
        
        // Get existing conversation IDs
        $existingConversations = Conversation::where('user_id', $currentUserId)
            ->pluck('contact_id')
            ->toArray();
        
        // Search users by username, firstname, lastname, or email (excluding current user)
        $users = User::where('id', '!=', $currentUserId)
            ->where(function ($query) use ($searchTerm) {
                $query->where('username', 'LIKE', "%{$searchTerm}%")
                      ->orWhere('firstname', 'LIKE', "%{$searchTerm}%")
                      ->orWhere('lastname', 'LIKE', "%{$searchTerm}%")
                      ->orWhere('email', 'LIKE', "%{$searchTerm}%");
            })
            ->select('id', 'username', 'firstname', 'lastname', 'email', 'image')
            ->limit(10)
            ->get();
        
        return response()->json([
            'success' => true,
            'users' => $users->map(function ($user) use ($existingConversations) {
                return [
                    'id' => $user->id,
                    'username' => $user->username,
                    'firstname' => $user->firstname,
                    'lastname' => $user->lastname,
                    'email' => $user->email,
                    'image' => $user->image,
                    'has_conversation' => in_array($user->id, $existingConversations),
                ];
            })
        ]);
    }
    
    /**
     * Add a user to conversations
     */
    public function addConversation(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'contact_id' => 'required|exists:users,id',
        ]);
        
        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => $validator->errors()->first()
            ], 422);
        }
        
        $currentUserId = Auth::id();
        $contactId = $request->contact_id;
        
        // Create conversation for both users (bidirectional)
        Conversation::firstOrCreate([
            'user_id' => $currentUserId,
            'contact_id' => $contactId,
        ]);
        
        Conversation::firstOrCreate([
            'user_id' => $contactId,
            'contact_id' => $currentUserId,
        ]);
        
        // Get the user details
        $user = User::find($contactId);
        
        return response()->json([
            'success' => true,
            'message' => 'Contact added successfully',
            'user' => [
                'id' => $user->id,
                'username' => $user->username,
                'firstname' => $user->firstname,
                'lastname' => $user->lastname,
                'image' => $user->image,
            ]
        ]);
    }
    
    /**
     * Get conversations list with caching
     */
    public function getConversations()
    {
        $currentUserId = Auth::id();
        
        // Cache conversations for 30 seconds to reduce database load
        $cacheKey = "user:{$currentUserId}:conversations";
        
        $conversations = Cache::remember($cacheKey, 30, function () use ($currentUserId) {
            return Conversation::where('user_id', $currentUserId)
                ->with(['contact:id,username,firstname,lastname,image'])
                ->get()
                ->map(function ($conversation) use ($currentUserId) {
                    $lastMessage = Message::betweenUsers($currentUserId, $conversation->contact_id)
                        ->latest()
                        ->first();
                    
                    $unreadCount = Message::where('sender_id', $conversation->contact_id)
                        ->where('receiver_id', $currentUserId)
                        ->whereNull('read_at')
                        ->count();
                    
                    return [
                        'id' => $conversation->contact->id,
                        'username' => $conversation->contact->username,
                        'firstname' => $conversation->contact->firstname,
                        'lastname' => $conversation->contact->lastname,
                        'image' => $conversation->contact->image,
                        'last_message' => $lastMessage ? $lastMessage->message : null,
                        'last_message_time' => $lastMessage ? $lastMessage->created_at->diffForHumans() : null,
                        'unread_count' => $unreadCount,
                    ];
                });
        });
        
        return response()->json([
            'success' => true,
            'conversations' => $conversations
        ]);
    }
    
    /**
     * Get messages between two users
     */
    public function getMessages(Request $request, $userId)
    {
        $currentUserId = Auth::id();
        
        $messages = Message::betweenUsers($currentUserId, $userId)
            ->with(['sender:id,username,firstname,lastname,image'])
            ->orderBy('created_at', 'asc')
            ->get();
        
        // Mark messages as read
        Message::where('sender_id', $userId)
            ->where('receiver_id', $currentUserId)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);
        
        return response()->json([
            'success' => true,
            'messages' => $messages->map(function ($message) use ($currentUserId) {
                return [
                    'id' => $message->id,
                    'message' => $message->message,
                    'sender_id' => $message->sender_id,
                    'receiver_id' => $message->receiver_id,
                    'is_outgoing' => $message->sender_id == $currentUserId,
                    'created_at' => $message->created_at->toIso8601String(),
                ];
            })
        ]);
    }
    
    /**
     * Fetch new messages since a specific message ID (optimized for polling)
     */
    public function fetchMessagesSince(Request $request)
    {
        $lastMessageId = $request->input('last_message_id', 0);
        $currentUserId = Auth::id();
        
        // Optimized query using composite index (receiver_id, id)
        $newMessages = Message::where('receiver_id', $currentUserId)
            ->where('id', '>', $lastMessageId)
            ->with(['sender:id,username,firstname,lastname,image'])
            ->orderBy('id', 'asc')
            ->limit(50) // Limit to prevent memory issues
            ->get();
        
        // Mark new messages as read (batch update)
        if ($newMessages->isNotEmpty()) {
            Message::whereIn('id', $newMessages->pluck('id'))
                ->whereNull('read_at')
                ->update(['read_at' => now()]);
            
            // Clear conversation cache when new messages arrive
            Cache::forget("user:{$currentUserId}:conversations");
        }
        
        $latestId = $newMessages->isNotEmpty() ? $newMessages->last()->id : $lastMessageId;
        
        return response()->json([
            'success' => true,
            'messages' => $newMessages->map(function ($message) {
                return [
                    'id' => $message->id,
                    'message' => $message->message,
                    'sender_id' => $message->sender_id,
                    'receiver_id' => $message->receiver_id,
                    'created_at' => $message->created_at->toIso8601String(),
                    'sender' => [
                        'id' => $message->sender->id,
                        'username' => $message->sender->username,
                        'firstname' => $message->sender->firstname,
                        'lastname' => $message->sender->lastname,
                        'image' => $message->sender->image,
                    ]
                ];
            }),
            'latest_id' => $latestId
        ]);
    }
    
    /**
     * Send a message using MessageService with WebSocket broadcast + Redis notification
     */
    public function sendMessage(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'receiver_id' => 'required|exists:users,id',
            'message' => 'required|string|max:5000',
        ]);
        
        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => $validator->errors()->first()
            ], 422);
        }
        
        $currentUserId = Auth::id();
        
        // Use MessageService to send message with WebSocket broadcast
        $message = $this->messageService->sendMessage(
            $currentUserId,
            $request->receiver_id,
            $request->message
        );
        
        // Clear conversation cache for both sender and receiver
        Cache::forget("user:{$currentUserId}:conversations");
        Cache::forget("user:{$request->receiver_id}:conversations");
        
        return response()->json([
            'success' => true,
            'message' => [
                'id' => $message->id,
                'message' => $message->message,
                'sender_id' => $message->sender_id,
                'receiver_id' => $message->receiver_id,
                'created_at' => $message->created_at->toIso8601String(),
            ]
        ]);
    }
}
