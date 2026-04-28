<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

Broadcast::channel('notifications', function ($user) {
    $role = strtolower((string) $user->role);
    return in_array($role, ['admin', 'direktur', 'superadmin', 'secret_account']);
});
