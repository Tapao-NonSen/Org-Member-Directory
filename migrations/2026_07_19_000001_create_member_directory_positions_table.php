<?php

declare(strict_types=1);

/*
 * This file is part of tapao/org-member-directory.
 */

use Flarum\Database\Migration;
use Illuminate\Database\Schema\Blueprint;

return Migration::createTable(
    'member_directory_positions',
    function (Blueprint $table) {
        $table->increments('id');
        $table->string('name', 100);
        $table->integer('sort_order')->default(0);
        $table->string('color', 7)->nullable();
        $table->boolean('is_visible')->default(true);
        $table->timestamps();
    }
);
