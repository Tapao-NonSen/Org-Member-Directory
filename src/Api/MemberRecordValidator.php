<?php

declare(strict_types=1);

/*
 * This file is part of tapao/org-member-directory.
 */

namespace Tapao\OrgMemberDirectory\Api;

use Carbon\Carbon;
use Flarum\Foundation\ValidationException;
use Flarum\User\User;
use Illuminate\Support\Arr;
use Tapao\OrgMemberDirectory\Model\Position;

/**
 * Shared validation for member-record create/update payloads.
 * Used by both CreateMemberRecordController and UpdateMemberRecordController.
 */
final class MemberRecordValidator
{
    /**
     * @param array<string, mixed> $body
     * @return array{user_id?: int, name?: string|null, position_id?: int|null, cohort?: string|null, started_at?: string|null, ended_at?: string|null, sort_order?: int}
     */
    public static function validate(array $body, bool $isCreate): array
    {
        $errors = [];
        $data = [];

        if ($isCreate || Arr::has($body, 'userId')) {
            $userId = Arr::get($body, 'userId');

            if (! is_numeric($userId) || ! User::whereKey((int) $userId)->exists()) {
                $errors['userId'] = 'The userId field must reference an existing user.';
            } else {
                $data['user_id'] = (int) $userId;
            }
        }

        if (Arr::has($body, 'name')) {
            $name = Arr::get($body, 'name');

            if ($name === null || $name === '') {
                $data['name'] = null;
            } elseif (! is_string($name) || mb_strlen($name) > 255) {
                $errors['name'] = 'The name field must not exceed 255 characters.';
            } else {
                $data['name'] = $name;
            }
        }

        if (Arr::has($body, 'positionId')) {
            $positionId = Arr::get($body, 'positionId');

            if ($positionId === null || $positionId === '') {
                $data['position_id'] = null;
            } elseif (! is_numeric($positionId) || ! Position::whereKey((int) $positionId)->exists()) {
                $errors['positionId'] = 'The positionId field must reference an existing position.';
            } else {
                $data['position_id'] = (int) $positionId;
            }
        }

        if (Arr::has($body, 'cohort')) {
            $cohort = Arr::get($body, 'cohort');

            if ($cohort === null || $cohort === '') {
                $data['cohort'] = null;
            } elseif (! is_string($cohort) || mb_strlen($cohort) > 50) {
                $errors['cohort'] = 'The cohort field must not exceed 50 characters.';
            } else {
                $data['cohort'] = $cohort;
            }
        }

        $startedAt = null;
        $endedAt = null;

        foreach (['startedAt' => 'started_at', 'endedAt' => 'ended_at'] as $inputKey => $column) {
            if (! Arr::has($body, $inputKey)) {
                continue;
            }

            $value = Arr::get($body, $inputKey);

            if ($value === null || $value === '') {
                $data[$column] = null;

                continue;
            }

            if (! is_string($value) || ! preg_match('/^\d{4}-\d{2}-\d{2}$/', $value)) {
                $errors[$inputKey] = "The {$inputKey} field must be a date in Y-m-d format.";

                continue;
            }

            try {
                $parsed = Carbon::createFromFormat('Y-m-d', $value)->startOfDay();
            } catch (\Throwable) {
                $errors[$inputKey] = "The {$inputKey} field must be a valid date.";

                continue;
            }

            $data[$column] = $value;

            if ($column === 'started_at') {
                $startedAt = $parsed;
            } else {
                $endedAt = $parsed;
            }
        }

        if ($startedAt !== null && $endedAt !== null && $endedAt->lt($startedAt)) {
            $errors['endedAt'] = 'The endedAt field must not be before startedAt.';
        }

        if (Arr::has($body, 'sortOrder')) {
            $sortOrder = Arr::get($body, 'sortOrder');

            if (! is_numeric($sortOrder)) {
                $errors['sortOrder'] = 'The sortOrder field must be an integer.';
            } else {
                $data['sort_order'] = (int) $sortOrder;
            }
        }

        if (! empty($errors)) {
            throw new ValidationException($errors);
        }

        return $data;
    }
}
