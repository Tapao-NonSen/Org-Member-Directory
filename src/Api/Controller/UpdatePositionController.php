<?php

declare(strict_types=1);

/*
 * This file is part of tapao/org-member-directory.
 */

namespace Tapao\OrgMemberDirectory\Api\Controller;

use Flarum\Http\RequestUtil;
use Illuminate\Support\Arr;
use Laminas\Diactoros\Response\EmptyResponse;
use Laminas\Diactoros\Response\JsonResponse;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;
use Tapao\OrgMemberDirectory\Api\PositionValidator;
use Tapao\OrgMemberDirectory\Model\Position;

class UpdatePositionController implements RequestHandlerInterface
{
    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        RequestUtil::getActor($request)->assertAdmin();

        $id = (int) Arr::get($request->getQueryParams(), 'id');
        $position = Position::find($id);

        if ($position === null) {
            return new EmptyResponse(404);
        }

        $body = (array) $request->getParsedBody();
        $data = PositionValidator::validate($body, false);

        $position->fill($data)->save();

        return new JsonResponse($this->serialize($position));
    }

    /**
     * @return array<string, mixed>
     */
    private function serialize(Position $position): array
    {
        return [
            'id' => $position->id,
            'name' => $position->name,
            'color' => $position->color,
            'sortOrder' => $position->sort_order,
            'isVisible' => $position->is_visible,
            'isArchived' => (bool) $position->is_archived,
        ];
    }
}
