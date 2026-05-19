<?php

namespace App\Controllers\Api;

use CodeIgniter\RESTful\ResourceController;
use CodeIgniter\HTTP\RequestInterface;
use CodeIgniter\HTTP\ResponseInterface;
use Psr\Log\LoggerInterface;

class BaseApiController extends ResourceController
{
    protected $format = 'json';

    /** @var \CodeIgniter\Database\BaseConnection */
    protected $db;

    public function initController(
        RequestInterface  $request,
        ResponseInterface $response,
        LoggerInterface   $logger
    ): void {
        parent::initController($request, $response, $logger);
        try {
            $this->db = \Config\Database::connect();
            $this->db->connect();
        } catch (\Throwable $e) {
            $this->db = null;
            log_message('critical', 'DB connection failed: ' . $e->getMessage());
        }
    }

    // ── Helpers ────────────────────────────────────────────

    protected function ok(mixed $data, string $message = 'OK'): ResponseInterface
    {
        return $this->respond([
            'status'  => 'success',
            'message' => $message,
            'data'    => $data,
        ]);
    }

    protected function created(mixed $data, string $message = 'Created'): ResponseInterface
    {
        return $this->respondCreated([
            'status'  => 'success',
            'message' => $message,
            'data'    => $data,
        ]);
    }

    protected function bad(string $message, array $errors = []): ResponseInterface
    {
        return $this->respond([
            'status'  => 'error',
            'message' => $message,
            'errors'  => $errors,
        ], 422);
    }

    protected function notFound(string $message = 'Resource not found'): ResponseInterface
    {
        return $this->respond(['status' => 'error', 'message' => $message], 404);
    }

    protected function forbidden(string $message = 'Forbidden'): ResponseInterface
    {
        return $this->respond(['status' => 'error', 'message' => $message], 403);
    }

    /** Run CI4 Validation; returns null on pass, bad() response on fail. */
    protected function validate2(array $rules, array $data): ?ResponseInterface
    {
        $v = \Config\Services::validation();
        $v->setRules($rules);
        if (!$v->run($data)) {
            return $this->bad('Validation failed', $v->getErrors());
        }
        return null;
    }

    protected function userId(): int
    {
        return (int) ($this->request->user->sub ?? 0);
    }

    protected function userRole(): string
    {
        return $this->request->user->role ?? 'viewer';
    }

    protected function requireAdmin(): ?ResponseInterface
    {
        if ($this->userRole() !== 'admin') {
            return $this->forbidden('Admin access required');
        }
        return null;
    }

    protected function body(): array
    {
        return (array) ($this->request->getJSON(true) ?? []);
    }

    /** Wrap a paginated query result into a standard envelope */
    protected function paginateResult(array $result, int $page, int $perPage): array
    {
        return [
            'data'      => $result['data'],
            'total'     => $result['total'],
            'page'      => $page,
            'per_page'  => $perPage,
            'last_page' => (int) ceil($result['total'] / $perPage),
        ];
    }
}
