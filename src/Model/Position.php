<?php

declare(strict_types=1);

/*
 * This file is part of tapao/org-member-directory.
 */

namespace Tapao\OrgMemberDirectory\Model;

use Flarum\Database\AbstractModel;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property string $name
 * @property int $sort_order
 * @property string|null $color
 * @property bool $is_visible
 * @property \Carbon\Carbon $created_at
 * @property \Carbon\Carbon $updated_at
 */
class Position extends AbstractModel
{
    protected $table = 'member_directory_positions';

    protected $fillable = ['name', 'sort_order', 'color', 'is_visible'];

    protected $casts = [
        'sort_order' => 'integer',
        'is_visible' => 'bool',
    ];

    /**
     * @return HasMany<MemberRecord, $this>
     */
    public function members(): HasMany
    {
        return $this->hasMany(MemberRecord::class, 'position_id');
    }
}
