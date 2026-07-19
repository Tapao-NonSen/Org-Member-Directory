<?php

declare(strict_types=1);

/*
 * This file is part of tapao/org-member-directory.
 */

namespace Tapao\OrgMemberDirectory\Api\Controller;

use Flarum\Foundation\ValidationException;
use Flarum\Http\RequestUtil;
use Illuminate\Support\Arr;
use Laminas\Diactoros\Response\EmptyResponse;
use Laminas\Diactoros\Response\JsonResponse;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;
use Tapao\OrgMemberDirectory\Api\MemberRecordValidator;
use Tapao\OrgMemberDirectory\Model\MemberRecord;

class UpdateMemberRecordController implements RequestHandlerInterface
{
    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        RequestUtil::getActor($request)->assertAdmin();

        $id = (int) Arr::get($request->getQueryParams(), 'id');
        $record = MemberRecord::find($id);

        if ($record === null) {
            return new EmptyResponse(404);
        }

        $body = (array) $request->getParsedBody();
        $data = MemberRecordValidator::validate($body, false);

        $record->fill($data);

        // Re-check date order against the merged (existing + incoming) state,
        // since MemberRecordValidator only compares fields present together
        // in this request body, not against what is already stored.
        if ($record->started_at !== null && $record->ended_at !== null && $record->ended_at->lt($record->started_at)) {
            throw new ValidationException(['endedAt' => 'The endedAt field must not be before startedAt.']);
        }

        $record->save();

        return new JsonResponse($this->serialize($record));
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
