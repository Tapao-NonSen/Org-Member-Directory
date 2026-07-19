<?php

declare(strict_types=1);

/*
 * This file is part of tapao/org-member-directory.
 */

namespace Tapao\OrgMemberDirectory\Api\Controller;

use Flarum\Http\RequestUtil;
use Laminas\Diactoros\Response\JsonResponse;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;
use Tapao\OrgMemberDirectory\Api\MemberRecordValidator;
use Tapao\OrgMemberDirectory\Model\MemberRecord;

class CreateMemberRecordController implements RequestHandlerInterface
{
    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        RequestUtil::getActor($request)->assertAdmin();

        $body = (array) $request->getParsedBody();
        $data = MemberRecordValidator::validate($body, true);

        $record = MemberRecord::create($data);

        return new JsonResponse($this->serialize($record), 201);
    }

    /**
     * @return array<string, mixed>
     */
    private function serialize(MemberRecord $record): array
    {
        return [
            'id' => $record->id,
            'userId' => $record->user_id,
            'name' => $record->name,
            'positionId' => $record->position_id,
            'cohort' => $record->cohort,
            'startedAt' => $record->started_at?->toDateString(),
            'endedAt' => $record->ended_at?->toDateString(),
            'sortOrder' => $record->sort_order,
        ];
    }
}
