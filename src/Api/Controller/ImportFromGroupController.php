<?php

declare(strict_types=1);

/*
 * This file is part of tapao/org-member-directory.
 */

namespace Tapao\OrgMemberDirectory\Api\Controller;

use Flarum\Foundation\ValidationException;
use Flarum\Group\Group;
use Flarum\Http\RequestUtil;
use Illuminate\Support\Arr;
use Laminas\Diactoros\Response\JsonResponse;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;
use Tapao\OrgMemberDirectory\Model\MemberRecord;

/**
 * POST /api/member-directory/import
 *
 * One-time convenience: copies a group's users into member records (no
 * position, no dates, no ongoing link to the group). Skips users who already
 * have any directory record, current or past.
 */
class ImportFromGroupController implements RequestHandlerInterface
{
    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        RequestUtil::getActor($request)->assertAdmin();

        $body = (array) $request->getParsedBody();
        $groupId = Arr::get($body, 'groupId');

        if (! is_numeric($groupId)) {
            throw new ValidationException(['groupId' => 'The groupId field is required.']);
        }

        $group = Group::find((int) $groupId);

        if ($group === null) {
            throw new ValidationException(['groupId' => 'The groupId field must reference an existing group.']);
        }

        // Cast to int on both sides: pluck() results can come back as strings
        // depending on the DB driver, which would break a strict in_array().
        $existingUserIds = array_map('intval', MemberRecord::pluck('user_id')->all());

        $created = 0;
        $skipped = 0;

        foreach ($group->users()->pluck('users.id') as $userId) {
            $userId = (int) $userId;

            if (in_array($userId, $existingUserIds, true)) {
                $skipped++;

                continue;
            }

            MemberRecord::create(['user_id' => $userId]);
            $existingUserIds[] = $userId;
            $created++;
        }

        return new JsonResponse(['created' => $created, 'skipped' => $skipped]);
    }
}
