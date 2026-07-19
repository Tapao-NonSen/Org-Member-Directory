<?php

declare(strict_types=1);

/*
 * This file is part of tapao/org-member-directory.
 */

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Schema\Builder;

return [
    'up' => function (Builder $schema) {
        $schema->table('member_directory_members', function (Blueprint $table) {
            $table->string('name', 255)->nullable()->after('user_id');
        });
    },

    'down' => function (Builder $schema) {
        $schema->table('member_directory_members', function (Blueprint $table) {
            $table->dropColumn('name');
        });
    },
];
