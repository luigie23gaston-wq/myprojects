<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use App\Models\ImageHistory;

class ProfileController extends Controller
{
    public function show()
    {
        return view('profile');
    }

    public function uploadImage(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'image' => 'required|image|mimes:jpeg,png,jpg,gif|max:10240', // 10MB max
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => $validator->errors()->first()
            ], 422);
        }

        try {
            $user = Auth::user();
            
            // Store the image
            $image = $request->file('image');
            $imageName = time() . '_' . uniqid() . '.' . $image->getClientOriginalExtension();
            $imagePath = $image->storeAs('profile_images', $imageName, 'public');

            // Save to image history
            ImageHistory::create([
                'user_id' => $user->id,
                'image_path' => $imagePath,
            ]);

            // Update user's current profile image
            $user->image = $imagePath;
            $user->save();

            return response()->json([
                'success' => true,
                'message' => 'Profile image uploaded successfully',
                'imageUrl' => asset('storage/' . $imagePath)
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to upload image: ' . $e->getMessage()
            ], 500);
        }
    }

    public function getImageHistory()
    {
        try {
            $user = Auth::user();
            $history = ImageHistory::where('user_id', $user->id)
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function ($item) {
                    return [
                        'id' => $item->id,
                        'image_url' => asset('storage/' . $item->image_path),
                        'date' => $item->created_at->format('F d, Y'),
                        'time' => $item->created_at->format('h:i A'),
                    ];
                });

            return response()->json([
                'success' => true,
                'history' => $history
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to load history: ' . $e->getMessage()
            ], 500);
        }
    }

    public function setHistoryImage(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'history_id' => 'required|exists:image_histories,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => $validator->errors()->first()
            ], 422);
        }

        try {
            $user = Auth::user();
            $history = ImageHistory::where('id', $request->history_id)
                ->where('user_id', $user->id)
                ->firstOrFail();

            // Update user's current profile image
            $user->image = $history->image_path;
            $user->save();

            return response()->json([
                'success' => true,
                'message' => 'Profile image updated successfully',
                'imageUrl' => asset('storage/' . $history->image_path)
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to set image: ' . $e->getMessage()
            ], 500);
        }
    }

    public function updateInfo(Request $request)
    {
        $rules = [
            'firstname' => 'required|string|min:3|max:255',
            'lastname' => 'required|string|min:3|max:255',
            'email' => 'required|email|unique:users,email,' . Auth::id(),
        ];

        // If password fields are provided, add password validation
        if ($request->filled('current_password')) {
            $rules['current_password'] = 'required';
            $rules['new_password'] = 'required|min:8';
        }

        $validator = Validator::make($request->all(), $rules);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => $validator->errors()->first()
            ], 422);
        }

        try {
            $user = Auth::user();

            // Update basic info
            $user->firstname = $request->firstname;
            $user->lastname = $request->lastname;
            $user->name = $request->firstname . ' ' . $request->lastname;
            $user->email = $request->email;

            // Update password if provided
            if ($request->filled('current_password')) {
                // Verify current password
                if (!Hash::check($request->current_password, $user->password)) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Current password is incorrect'
                    ], 422);
                }

                $user->password = Hash::make($request->new_password);
            }

            $user->save();

            return response()->json([
                'success' => true,
                'message' => 'Profile updated successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update profile: ' . $e->getMessage()
            ], 500);
        }
    }
}

