<?php

declare(strict_types=1);

/*
 * This file is part of tapao/org-member-directory.
 */

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Schema\Builder;

return [
    'up' => function (Builder $schema) {
        $schema->create('member_directory_members', function (Blueprint $table) {
            $table->increments('id');
            $table->unsignedInteger('user_id');
            $table->unsignedInteger('position_id')->nullable();
            $table->string('cohort', 50)->nullable();
            $table->date('started_at')->nullable();
            $table->date('ended_at')->nullable();
            $table->integer('sort_order')->default(0);
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('position_id')->references('id')->on('member_directory_positions')->onDelete('set null');

            $table->index('position_id');
            $table->index('ended_at');
            $table->index(['position_id', 'sort_order']);
        });
    },

    'down' => function (Builder $schema) {
        $schema->dropIfExists('member_directory_members');
    },
];
