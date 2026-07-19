<?php

declare(strict_types=1);

/*
 * This file is part of tapao/org-member-directory.
 */

namespace Tapao\OrgMemberDirectory\Api\Controller;

use Flarum\Http\RequestUtil;
use Flarum\User\User;
use Illuminate\Support\Arr;
use Laminas\Diactoros\Response\JsonResponse;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;
use Tapao\OrgMemberDirectory\Model\MemberRecord;
use Tapao\OrgMemberDirectory\Model\Position;

/**
 * GET /api/member-directory
 *
 * Aggregate, read-only payload for the public directory page. Not modelled as
 * a JSON:API resource: the shape (positions with nested current members,
 * a positionless grid, and past members grouped by cohort) doesn't map onto
 * a single Eloquent model/relationship, so a plain aggregate response is
 * simpler than a resource + custom endpoint + serializer for one GET route.
 */
class ShowMemberDirectoryController implements RequestHandlerInterface
{
    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $actor = RequestUtil::getActor($request);
        $actor->assertPermission($actor->hasPermission('member-directory.view'));

        $cohortFilter = Arr::get($request->getQueryParams(), 'cohort');
        $cohortFilter = is_string($cohortFilter) && $cohortFilter !== '' ? $cohortFilter : null;

        $positionsQuery = Position::query();
        if (! $actor->isAdmin()) {
            $positionsQuery->where('is_visible', true);
        }

        $positions = $positionsQuery
            ->orderBy('sort_order')
            ->with(['members' => function ($query) {
                $query->current()->with('user')->orderBy('sort_order');
            }])
            ->get();

        $positionsPayload = $positions->map(function (Position $position) {
            return [
                'id' => $position->id,
                'name' => $position->name,
                'color' => $position->color,
                'sortOrder' => $position->sort_order,
                'isVisible' => $position->is_visible,
                'members' => $position->members
                    ->filter(fn (MemberRecord $r) => $r->user !== null)
                    ->map(fn (MemberRecord $r) => $this->serializeRecord($r, false))
                    ->values(),
            ];
        })->values();

        $positionless = MemberRecord::current()
            ->whereNull('position_id')
            ->with('user')
            ->orderBy('sort_order')
            ->get()
            ->filter(fn (MemberRecord $r) => $r->user !== null)
            ->map(fn (MemberRecord $r) => $this->serializeRecord($r, false))
            ->values();

        $pastQuery = MemberRecord::past()->with(['user', 'position']);

        if ($cohortFilter !== null) {
            $pastQuery->where('cohort', $cohortFilter);
        }

        $pastRecords = $pastQuery->orderBy('sort_order')->get();

        // Group in PHP (not SQL) so cohort ordering (desc, null last) is
        // consistent across MySQL/MariaDB/SQLite/Postgres, whose NULL
        // ordering defaults for ORDER BY DESC differ.
        $grouped = [];
        foreach ($pastRecords as $record) {
            if ($record->user === null) {
                continue;
            }

            $key = $record->cohort ?? '';
            $grouped[$key][] = $this->serializeRecord($record, true);
        }

        $cohortKeys = array_keys($grouped);
        usort($cohortKeys, function (string $a, string $b) {
            if ($a === $b) {
                return 0;
            }
            if ($a === '') {
                return 1;
            }
            if ($b === '') {
                return -1;
            }

            return strcmp($b, $a);
        });

        $past = array_map(fn (string $key) => [
            'cohort' => $key === '' ? null : $key,
            'members' => $grouped[$key],
        ], $cohortKeys);

        return new JsonResponse([
            'positions' => $positionsPayload,
            'positionless' => $positionless,
            'past' => $past,
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function serializeRecord(MemberRecord $record, bool $includePosition): array
    {
        $data = [
            'id' => $record->id,
            'name' => $record->name,
            'cohort' => $record->cohort,
            'startedAt' => $record->started_at?->toDateString(),
            'endedAt' => $record->ended_at?->toDateString(),
            'sortOrder' => $record->sort_order,
            'user' => $this->serializeUser($record->user),
        ];

        if ($includePosition) {
            $data['position'] = $record->position === null ? null : [
                'id' => $record->position->id,
                'name' => $record->position->name,
                'color' => $record->position->color,
            ];
        }

        return $data;
    }

    /**
     * @return array<string, mixed>
     */
    private function serializeUser(User $user): array
    {
        return [
            'id' => $user->id,
            'username' => $user->username,
            'displayName' => $user->display_name,
            'avatarUrl' => $user->avatar_url,
            // ponytail: no custom slug driver in this extension, username is
            // Flarum's default slug source. Swap for SlugManager if one is added.
            'slug' => $user->username,
            'joinTime' => $user->joined_at?->toIso8601String(),
        ];
    }
}
