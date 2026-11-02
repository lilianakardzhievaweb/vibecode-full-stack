<?php

namespace Tests\Feature;

use App\Models\ActivityLog;
use App\Models\Category;
use App\Models\Role;
use App\Models\Tool;
use App\Models\User;
use Database\Seeders\CategorySeeder;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ToolModerationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed([RoleSeeder::class, CategorySeeder::class]);
    }

    private function toolPayload(array $overrides = []): array
    {
        return array_merge([
            'name' => 'Test Tool',
            'url' => 'https://example.com',
            'description' => 'Описание',
            'usage' => 'Как се използва',
            'role_ids' => [Role::first()->id],
            'category_ids' => [Category::first()->id],
            'tags' => ['тест'],
        ], $overrides);
    }

    public function test_new_tool_from_regular_user_is_pending_and_logged(): void
    {
        $user = User::factory()->create(['role' => 'frontend']);

        $response = $this->actingAs($user)->postJson('/api/tools', $this->toolPayload());

        $response->assertCreated()->assertJsonPath('data.status', Tool::STATUS_PENDING);
        $this->assertDatabaseHas('activity_logs', ['user_id' => $user->id, 'action' => 'tool.created']);
    }

    public function test_tool_from_owner_is_approved_immediately(): void
    {
        $owner = User::factory()->create(['role' => 'owner']);

        $this->actingAs($owner)->postJson('/api/tools', $this->toolPayload())
            ->assertCreated()
            ->assertJsonPath('data.status', Tool::STATUS_APPROVED);
    }

    public function test_pending_tool_is_hidden_from_other_users(): void
    {
        $author = User::factory()->create(['role' => 'frontend']);
        $other = User::factory()->create(['role' => 'qa']);
        $tool = $author->tools()->create($this->toolPayload(['status' => Tool::STATUS_PENDING]));

        $this->actingAs($other)->getJson("/api/tools/{$tool->id}")->assertNotFound();
        $this->actingAs($other)->getJson('/api/tools')->assertJsonCount(0, 'data');
        $this->actingAs($author)->getJson("/api/tools/{$tool->id}")->assertOk();
        $this->actingAs($author)->getJson('/api/tools?mine=1')->assertJsonCount(1, 'data');
    }

    public function test_only_owner_can_access_admin_routes(): void
    {
        $user = User::factory()->create(['role' => 'backend']);

        $this->actingAs($user)->getJson('/api/admin/tools')->assertForbidden();
        $this->actingAs($user)->getJson('/api/admin/activity')->assertForbidden();
        $this->actingAs($user)->getJson('/api/admin/users')->assertForbidden();
    }

    public function test_owner_can_approve_and_reject_tools(): void
    {
        $owner = User::factory()->create(['role' => 'owner']);
        $author = User::factory()->create(['role' => 'designer']);
        $tool = $author->tools()->create($this->toolPayload(['status' => Tool::STATUS_PENDING]));

        $this->actingAs($owner)->getJson('/api/admin/tools?status=pending')
            ->assertOk()
            ->assertJsonPath('data.0.id', $tool->id)
            ->assertJsonPath('counts.pending', 1);

        $this->actingAs($owner)->postJson("/api/admin/tools/{$tool->id}/reject", ['reason' => 'Липсва документация'])
            ->assertOk()
            ->assertJsonPath('data.status', Tool::STATUS_REJECTED);

        $this->actingAs($owner)->postJson("/api/admin/tools/{$tool->id}/approve")
            ->assertOk()
            ->assertJsonPath('data.status', Tool::STATUS_APPROVED);

        $this->assertSame(['tool.rejected', 'tool.approved'], ActivityLog::orderBy('id')->pluck('action')->all());
    }

    public function test_owner_can_change_user_role_but_not_own(): void
    {
        $owner = User::factory()->create(['role' => 'owner']);
        $user = User::factory()->create(['role' => 'qa']);

        $this->actingAs($owner)->putJson("/api/admin/users/{$user->id}/role", ['role' => 'pm'])->assertOk();
        $this->assertSame('pm', $user->fresh()->role);

        $this->actingAs($owner)->putJson("/api/admin/users/{$owner->id}/role", ['role' => 'qa'])->assertUnprocessable();
    }

    public function test_stats_are_cached_and_refreshed_after_changes(): void
    {
        $owner = User::factory()->create(['role' => 'owner']);

        $this->actingAs($owner)->getJson('/api/stats')->assertJsonPath('tools_total', 0);

        $this->actingAs($owner)->postJson('/api/tools', $this->toolPayload())->assertCreated();

        $this->actingAs($owner)->getJson('/api/stats')->assertJsonPath('tools_total', 1);
    }
}
