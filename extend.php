<?php

declare(strict_types=1);

/*
 * This file is part of tapao/org-member-directory.
 */

use Flarum\Extend;
use Tapao\OrgMemberDirectory\Api\Controller\CreateMemberRecordController;
use Tapao\OrgMemberDirectory\Api\Controller\CreatePositionController;
use Tapao\OrgMemberDirectory\Api\Controller\DeleteMemberRecordController;
use Tapao\OrgMemberDirectory\Api\Controller\DeletePositionController;
use Tapao\OrgMemberDirectory\Api\Controller\ImportCsvController;
use Tapao\OrgMemberDirectory\Api\Controller\ImportFromGroupController;
use Tapao\OrgMemberDirectory\Api\Controller\ShowMemberDirectoryController;
use Tapao\OrgMemberDirectory\Api\Controller\UpdateMemberRecordController;
use Tapao\OrgMemberDirectory\Api\Controller\UpdatePositionController;

return [
    (new Extend\Frontend('forum'))
        ->js(__DIR__ . '/js/dist/forum.js')
        ->css(__DIR__ . '/less/forum.less')
        ->route('/members', 'members'),

    (new Extend\Frontend('admin'))
        ->js(__DIR__ . '/js/dist/admin.js')
        ->css(__DIR__ . '/less/admin.less'),

    new Extend\Locales(__DIR__ . '/locale'),

    (new Extend\Routes('api'))
        ->get('/member-directory', 'tapao-member-directory.show', ShowMemberDirectoryController::class)
        ->post('/member-directory/positions', 'tapao-member-directory.positions.create', CreatePositionController::class)
        ->patch('/member-directory/positions/{id}', 'tapao-member-directory.positions.update', UpdatePositionController::class)
        ->delete('/member-directory/positions/{id}', 'tapao-member-directory.positions.delete', DeletePositionController::class)
        ->post('/member-directory/members', 'tapao-member-directory.members.create', CreateMemberRecordController::class)
        ->patch('/member-directory/members/{id}', 'tapao-member-directory.members.update', UpdateMemberRecordController::class)
        ->delete('/member-directory/members/{id}', 'tapao-member-directory.members.delete', DeleteMemberRecordController::class)
        ->post('/member-directory/import', 'tapao-member-directory.import', ImportFromGroupController::class)
        ->post('/member-directory/import-csv', 'tapao-member-directory.import-csv', ImportCsvController::class),

    (new Extend\Settings)
        ->default('member-directory.date_granularity', 'year')
        ->default('member-directory.cards_per_row', '4')
        ->serializeToForum('memberDirectoryDateGranularity', 'member-directory.date_granularity')
        ->serializeToForum('memberDirectoryCardsPerRow', 'member-directory.cards_per_row'),
];
