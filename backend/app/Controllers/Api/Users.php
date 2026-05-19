<?php

namespace App\Controllers\Api;

use App\Models\UserModel;

class Users extends BaseApiController
{
    public function index()
    {
        if ($err = $this->requireAdmin()) return $err;

        $users = $this->db->query(
            "SELECT id, email, name, initials, role, created_at FROM users ORDER BY id"
        )->getResultArray();

        return $this->ok($users);
    }

    public function create()
    {
        if ($err = $this->requireAdmin()) return $err;

        $body = $this->body();

        if ($err = $this->validate2([
            'email'    => 'required|valid_email|is_unique[users.email]',
            'name'     => 'required|max_length[100]',
            'password' => 'required|min_length[8]',
            'role'     => 'required|in_list[admin,viewer]',
        ], $body)) {
            return $err;
        }

        $initials = implode('', array_map(
            fn($w) => strtoupper($w[0]),
            array_slice(explode(' ', $body['name']), 0, 2)
        ));

        $model = new UserModel();
        $model->insert([
            'email'         => strtolower(trim($body['email'])),
            'name'          => $body['name'],
            'initials'      => $initials,
            'password_hash' => password_hash($body['password'], PASSWORD_BCRYPT),
            'role'          => $body['role'],
        ]);

        $user = $model->find($this->db->insertID());
        unset($user['password_hash']);

        return $this->created($user, 'User created');
    }

    public function update($id = null)
    {
        if ($err = $this->requireAdmin()) return $err;

        $model = new UserModel();
        if (!$model->find((int) $id)) return $this->notFound("User $id not found");

        $body    = $this->body();
        $allowed = ['name', 'role', 'initials'];
        $update  = array_intersect_key($body, array_flip($allowed));

        if (!empty($body['password'])) {
            if (strlen($body['password']) < 8) return $this->bad('Password must be at least 8 characters');
            $update['password_hash'] = password_hash($body['password'], PASSWORD_BCRYPT);
        }

        if (empty($update)) return $this->bad('No updatable fields provided');

        $model->update((int) $id, $update);

        $user = $model->find((int) $id);
        unset($user['password_hash']);
        return $this->ok($user, 'User updated');
    }

    public function delete($id = null)
    {
        if ($err = $this->requireAdmin()) return $err;
        if ((int) $id === $this->userId()) return $this->bad('Cannot delete your own account');

        $model = new UserModel();
        if (!$model->find((int) $id)) return $this->notFound("User $id not found");

        $model->delete((int) $id);
        return $this->ok(null, 'User deleted');
    }
}
