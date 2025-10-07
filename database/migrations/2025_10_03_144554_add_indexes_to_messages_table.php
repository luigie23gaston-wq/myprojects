<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            // Add indexes for optimized query performance
            $table->index('sender_id', 'messages_sender_id_index');
            $table->index('receiver_id', 'messages_receiver_id_index');
            $table->index('created_at', 'messages_created_at_index');
            $table->index(['receiver_id', 'id'], 'messages_receiver_id_id_index'); // Composite index for polling
            $table->index(['sender_id', 'receiver_id'], 'messages_sender_receiver_index'); // For conversation queries
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            // Drop indexes in reverse order
            $table->dropIndex('messages_sender_receiver_index');
            $table->dropIndex('messages_receiver_id_id_index');
            $table->dropIndex('messages_created_at_index');
            $table->dropIndex('messages_receiver_id_index');
            $table->dropIndex('messages_sender_id_index');
        });
    }
};
