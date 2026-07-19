<?php

declare(strict_types=1);

/*
 * This file is part of tapao/org-member-directory.
 */

namespace Tapao\OrgMemberDirectory\Model;

use Flarum\Database\AbstractModel;
use Flarum\User\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $user_id
 * @property int|null $position_id
 * @property string|null $cohort
 * @property \Carbon\Carbon|null $started_at
 * @property \Carbon\Carbon|null $ended_at
 * @property int $sort_order
 * @property \Carbon\Carbon $created_at
 * @property \Carbon\Carbon $updated_at
 */
class MemberRecord extends AbstractModel
{
    protected $table = 'member_directory_members';

    protected $fillable = ['user_id', 'position_id', 'cohort', 'started_at', 'ended_at', 'sort_order'];

    protected $casts = [
        'started_at' => 'date',
        'ended_at' => 'date',
        'sort_order' => 'integer',
    ];

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * @return BelongsTo<Position, $this>
     */
    public function position(): BelongsTo
    {
        return $this->belongsTo(Position::class, 'position_id');
    }

    /**
     * @param Builder<MemberRecord> $query
     * @return Builder<MemberRecord>
     */
    public function scopeCurrent(Builder $query): Builder
    {
        return $query->whereNull('ended_at');
    }

    /**
     * @param Builder<MemberRecord> $query
     * @return Builder<MemberRecord>
     */
    public function scopePast(Builder $query): Builder
    {
        return $query->whereNotNull('ended_at');
    }
}
