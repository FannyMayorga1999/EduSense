<?php

namespace App\Modules\Psychopedagogic\Events;

use App\Modules\Psychopedagogic\Models\Survey;
use App\Modules\Students\Models\Student;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Broadcasts a processed evaluation to the public dashboard channel.
 */
class EvaluationProcessed implements ShouldBroadcast
{
    use Dispatchable;
    use InteractsWithSockets;
    use SerializesModels;

    /**
     * Create a new event instance.
     */
    public function __construct(
        public Student $student,
        public Survey $survey,
        public int $score,
        public int $threshold,
        public bool $alerted,
        public int $evaluatorId,
    ) {}

    /**
     * The public channel consumed by the frontend dashboard.
     *
     * @return Channel<int, mixed>
     */
    public function broadcastOn(): array
    {
        return [new Channel('evaluaciones')];
    }

    /**
     * The event name as listened by Laravel Echo.
     */
    public function broadcastAs(): string
    {
        return 'evaluacion.procesada';
    }

    /**
     * Data sent to the subscribers.
     *
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        return [
            'student' => $this->student->full_name,
            'student_id' => $this->student->id,
            'area' => $this->survey->evaluation_area->value,
            'score' => $this->score,
            'threshold' => $this->threshold,
            'alerted' => $this->alerted,
        ];
    }
}
