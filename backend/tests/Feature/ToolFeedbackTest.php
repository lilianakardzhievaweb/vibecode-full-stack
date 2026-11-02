<?php

namespace Tests\Feature;

use App\Models\Tool;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ToolFeedbackTest extends TestCase
{
    use RefreshDatabase;

    private function makeTool(User $author, string $status = Tool::STATUS_APPROVED): Tool
    {
        return $author->tools()->create([
            'name' => 'Tool '.uniqid(),
            'url' => 'https://example.com',
            'description' => 'Описание',
            'usage' => 'Употреба',
            'status' => $status,
        ]);
    }

    public function test_user_can_rate_tool_and_change_rating(): void
    {
        $user = User::factory()->create();
        $tool = $this->makeTool(User::factory()->create());

        $this->actingAs($user)->putJson("/api/tools/{$tool->id}/rating", ['rating' => 4])
            ->assertOk()
            ->assertJson(['average_rating' => 4, 'ratings_count' => 1, 'my_rating' => 4]);

        $this->actingAs($user)->putJson("/api/tools/{$tool->id}/rating", ['rating' => 2])
            ->assertJson(['average_rating' => 2, 'ratings_count' => 1]);

        $this->actingAs($user)->putJson("/api/tools/{$tool->id}/rating", ['rating' => 6])->assertUnprocessable();

        $this->actingAs($user)->getJson("/api/tools/{$tool->id}")->assertJsonPath('data.my_rating', 2);
    }

    public function test_user_can_comment_and_delete_own_comment(): void
    {
        $user = User::factory()->create(['role' => 'qa']);
        $other = User::factory()->create(['role' => 'pm']);
        $tool = $this->makeTool(User::factory()->create());

        $commentId = $this->actingAs($user)->postJson("/api/tools/{$tool->id}/comments", ['body' => 'Полезен!'])
            ->assertCreated()
            ->json('id');

        $this->actingAs($other)->getJson("/api/tools/{$tool->id}/comments")
            ->assertJsonPath('0.body', 'Полезен!')
            ->assertJsonPath('0.can_delete', false);

        $this->actingAs($other)->deleteJson("/api/comments/{$commentId}")->assertForbidden();
        $this->actingAs($user)->deleteJson("/api/comments/{$commentId}")->assertNoContent();
    }

    public function test_cannot_comment_or_rate_pending_tool(): void
    {
        $author = User::factory()->create();
        $tool = $this->makeTool($author, Tool::STATUS_PENDING);

        $this->actingAs($author)->postJson("/api/tools/{$tool->id}/comments", ['body' => 'Здравей'])->assertForbidden();
        $this->actingAs($author)->putJson("/api/tools/{$tool->id}/rating", ['rating' => 5])->assertForbidden();
    }
}
