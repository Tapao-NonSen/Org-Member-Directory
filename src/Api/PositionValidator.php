<?php

declare(strict_types=1);

/*
 * This file is part of tapao/org-member-directory.
 */

namespace Tapao\OrgMemberDirectory\Api;

use Flarum\Foundation\ValidationException;
use Illuminate\Support\Arr;

/**
 * Shared validation for position create/update payloads.
 * Used by both CreatePositionController and UpdatePositionController.
 */
final class PositionValidator
{
    /**
     * @param array<string, mixed> $body
     * @return array{name?: string, color?: string|null, sort_order?: int, is_visible?: bool}
     */
    public static function validate(array $body, bool $isCreate): array
    {
        $errors = [];
        $data = [];

        $hasName = Arr::has($body, 'name');
        if ($isCreate || $hasName) {
            $name = trim((string) Arr::get($body, 'name', ''));

            if ($name === '') {
                $errors['name'] = 'The name field is required.';
            } elseif (mb_strlen($name) > 100) {
                $errors['name'] = 'The name field must not exceed 100 characters.';
            } else {
                $data['name'] = $name;
            }
        }

        if (Arr::has($body, 'color')) {
            $color = Arr::get($body, 'color');

            if ($color === null || $color === '') {
                $data['color'] = null;
            } elseif (! is_string($color) || ! preg_match('/^#[0-9a-fA-F]{6}$/', $color)) {
                $errors['color'] = 'The color field must be a hex color in the form #rrggbb.';
            } else {
                $data['color'] = $color;
            }
        }

        if (Arr::has($body, 'sortOrder')) {
            $sortOrder = Arr::get($body, 'sortOrder');

            if (! is_numeric($sortOrder)) {
                $errors['sortOrder'] = 'The sortOrder field must be an integer.';
            } else {
                $data['sort_order'] = (int) $sortOrder;
            }
        }

        if (Arr::has($body, 'isVisible')) {
            $data['is_visible'] = (bool) Arr::get($body, 'isVisible');
        }

        if (Arr::has($body, 'isArchived')) {
            $data['is_archived'] = (bool) Arr::get($body, 'isArchived');
        }

        if (! empty($errors)) {
            throw new ValidationException($errors);
        }

        return $data;
    }
}
