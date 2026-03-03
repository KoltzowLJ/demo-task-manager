<?php
require_once __DIR__ . '/../config/database.php';

function resetTasksTable($pdo) {
    try {
        // Delete all records
        $pdo->exec("DELETE FROM task_tasks");
        
        // Reset auto-increment
        $pdo->exec("ALTER TABLE task_tasks AUTO_INCREMENT = 1");
        
        // Re-insert original sample data
        $stmt = $pdo->prepare("
            INSERT INTO task_tasks (title, description, status, priority, category, due_date) VALUES
            (?, ?, ?, ?, ?, ?),
            (?, ?, ?, ?, ?, ?),
            (?, ?, ?, ?, ?, ?),
            (?, ?, ?, ?, ?, ?),
            (?, ?, ?, ?, ?, ?),
            (?, ?, ?, ?, ?, ?)
        ");
        
        $stmt->execute([
            'Design Homepage', 'Create mockups and wireframes for the new homepage layout', 'in_progress', 'high', 'Design', '2024-03-05',
            'Code Review', 'Review pull requests from team members', 'pending', 'medium', 'Development', '2024-03-04',
            'Team Meeting', 'Weekly standup meeting with the development team', 'completed', 'medium', 'Meetings', '2024-03-01',
            'Database Optimization', 'Optimize slow queries and add proper indexing', 'pending', 'high', 'Development', '2024-03-06',
            'Write Documentation', 'Update API documentation for new endpoints', 'pending', 'low', 'Documentation', '2024-03-08',
            'Client Presentation', 'Present project progress to stakeholders', 'in_progress', 'high', 'Business', '2024-03-07'
        ]);
        
        // Update completed task
        $pdo->exec("UPDATE task_tasks SET completed_at = NOW() WHERE status = 'completed'");
        
        return true;
    } catch (Exception $e) {
        error_log("Reset error: " . $e->getMessage());
        return false;
    }
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST' || $method === 'PUT') {
    // Manual reset requested
    $resetResult = resetTasksTable($pdo);
    if ($resetResult) {
        echo json_encode(['success' => true, 'message' => 'Demo data reset successfully']);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Failed to reset database']);
    }
} else {
    // Auto-reset check
    $count = $pdo->query("SELECT COUNT(*) FROM task_tasks")->fetchColumn();
    
    if ($count > 25) {
        $resetResult = resetTasksTable($pdo);
        echo json_encode(['success' => true, 'message' => 'Database auto-reset completed']);
    } else {
        echo json_encode(['success' => true, 'message' => 'No reset needed']);
    }
}
?>