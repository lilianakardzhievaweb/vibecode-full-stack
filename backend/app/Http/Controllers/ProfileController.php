<?php

namespace App\Http\Controllers;

use App\Services\ActivityLogger;
use Illuminate\Http\Request;
use Illuminate\Validation\Rules\Password;

class ProfileController extends Controller
{
    // PUT /api/profile - смяна на име и (по желание) парола
    public function update(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'current_password' => ['nullable', 'required_with:password', 'current_password'],
            'password' => ['nullable', 'confirmed', Password::min(8)],
        ], [
            'name.required' => 'Въведете име.',
            'current_password.required_with' => 'Въведете текущата си парола.',
            'current_password.current_password' => 'Текущата парола е грешна.',
            'password.confirmed' => 'Новата парола и повторението не съвпадат.',
            'password.min' => 'Новата парола трябва да е поне 8 символа.',
        ]);

        $user = $request->user();
        $user->name = $data['name'];
        if (! empty($data['password'])) {
            $user->password = $data['password']; // криптира се автоматично (cast "hashed")
        }
        $user->save();

        ActivityLogger::log('profile.updated', $user, ! empty($data['password']) ? 'Смени името/паролата си' : 'Обнови профила си');

        return $user;
    }
}
