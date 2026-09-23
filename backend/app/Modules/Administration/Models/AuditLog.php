<?php

namespace App\Modules\Administration\Models;

use App\Modules\System\Models\User;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Security audit log entry (login, logout, resource changes).
 *
 * @property string $action
 * @property string|null $module
 * @property string|null $context
 */
#[Fillable(['user_id', 'action', 'module', 'context', 'ip_address', 'user_agent'])]
class AuditLog extends Model
{
    /**
     * Database table of the model (Administration module prefix).
     *
     * @var string
     */
    protected $table = 'adm_audit_logs';

    /**
     * The user that fired the audited action.
     *
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
