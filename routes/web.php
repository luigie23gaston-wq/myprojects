<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ChatController;
use App\Http\Controllers\LongPollController;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "web" middleware group. Make something great!
|
*/

// Guest routes (only accessible when not authenticated)
Route::middleware(['guest', 'prevent.back'])->group(function () {
    Route::get('/', [AuthController::class, 'showLogin'])->name('login');
    Route::post('/register', [AuthController::class, 'register'])->name('register');
    Route::post('/login', [AuthController::class, 'login'])->name('login.submit');
});

// Authenticated routes (only accessible when authenticated)
Route::middleware(['auth', 'prevent.back'])->group(function () {
    Route::get('/landing', [AuthController::class, 'showLanding'])->name('landing');
    Route::post('/logout', [AuthController::class, 'logout'])->name('logout');
    
    // Profile routes
    Route::get('/profile', [ProfileController::class, 'show'])->name('profile');
    Route::post('/profile/upload-image', [ProfileController::class, 'uploadImage'])->name('profile.upload.image');
    Route::get('/profile/image-history', [ProfileController::class, 'getImageHistory'])->name('profile.image.history');
    Route::post('/profile/set-history-image', [ProfileController::class, 'setHistoryImage'])->name('profile.set.history.image');
    Route::post('/profile/update-info', [ProfileController::class, 'updateInfo'])->name('profile.update.info');
    
    // Chat routes
    Route::get('/api/chat/search', [ChatController::class, 'searchUsers'])->name('chat.search');
    Route::post('/api/chat/add-conversation', [ChatController::class, 'addConversation'])->name('chat.add');
    Route::get('/api/chat/conversations', [ChatController::class, 'getConversations'])->name('chat.conversations');
    Route::get('/api/chat/messages/{userId}', [ChatController::class, 'getMessages'])->name('chat.messages');
    Route::post('/api/chat/send', [ChatController::class, 'sendMessage'])->name('chat.send');
    Route::get('/api/chat/fetch-since', [ChatController::class, 'fetchMessagesSince'])->name('chat.fetch.since');
    
    // Long Polling route (Redis-based)
    Route::get('/api/chat/poll', [LongPollController::class, 'fetchNewMessages'])->name('chat.poll');
});

