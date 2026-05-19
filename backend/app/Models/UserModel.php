<?php

namespace App\Models;

use CodeIgniter\Model;

class UserModel extends Model
{
    protected $table      = 'users';
    protected $primaryKey = 'id';
    protected $allowedFields = ['email','password_hash','name','initials','role'];
    protected $useTimestamps = true;
    protected $createdField  = 'created_at';
    protected $updatedField  = '';

    public function findByEmail(string $email): ?array
    {
        return $this->where('email', $email)->first();
    }

    public function verifyPassword(string $plain, string $hash): bool
    {
        return password_verify($plain, $hash);
    }
}
