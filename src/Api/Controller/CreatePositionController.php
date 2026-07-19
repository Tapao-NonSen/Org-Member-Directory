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
use Tapao\OrgMemberDirectory\Api\PositionValidator;
use Tapao\OrgMemberDirectory\Model\Position;

class CreatePositionController implements RequestHandlerInterface
{
    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        RequestUtil::getActor($request)->assertAdmin();

        $body = (array) $request->getParsedBody();
        $data = PositionValidator::validate($body, true);

        $position = Position::create($data);

        return new JsonResponse($this->serialize($position), 201);
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
