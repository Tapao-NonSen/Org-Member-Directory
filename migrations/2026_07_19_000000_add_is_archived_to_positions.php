<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Schema\Builder;

return [
    'up' => function (Builder $schema) {
        $schema->table('member_directory_positions', function (Blueprint $table) {
            $table->boolean('is_archived')->default(false);
        });
    },
    'down' => function (Builder $schema) {
        $schema->table('member_directory_positions', function (Blueprint $table) {
            $table->dropColumn('is_archived');
        });
    }
];
