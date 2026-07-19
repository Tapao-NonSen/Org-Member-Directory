<?php

declare(strict_types=1);

/*
 * This file is part of tapao/org-member-directory.
 */

use Flarum\Database\Migration;
use Flarum\Group\Group;

return Migration::addPermissions([
    'member-directory.view' => Group::MEMBER_ID,
]);
