<?php
require_once __DIR__ . '/../config/database.php';

try {
    // Get basic counts
    $totalStmt = $pdo->query("SELECT COUNT(*) as total FROM task_tasks");
    $total = $totalStmt->fetch()['total'];
    
    $pendingStmt = $pdo->query("SELECT COUNT(*) as pending FROM task_tasks WHERE status = 'pending'");
    $pending = $pendingStmt->fetch()['pending'];
    
    $inProgressStmt = $pdo->query("SELECT COUNT(*) as in_progress FROM task_tasks WHERE status = 'in_progress'");
    $inProgress = $inProgressStmt->fetch()['in_progress'];
    
    $completedStmt = $pdo->query("SELECT COUNT(*) as completed FROM task_tasks WHERE status = 'completed'");
    $completed = $completedStmt->fetch()['completed'];
    
    // Get overdue tasks (due_date < today AND status != completed)
    $overdueStmt = $pdo->query("
        SELECT COUNT(*) as overdue 
        FROM task_tasks 
        WHERE due_date < CURDATE() 
        AND status != 'completed'
        AND due_date IS NOT NULL
    ");
    $overdue = $overdueStmt->fetch()['overdue'];
    
    $stats = [
        'total' => (int)$total,
        'pending' => (int)$pending,
        'in_progress' => (int)$inProgress,
        'completed' => (int)$completed,
        'overdue' => (int)$overdue
    ];
    
    echo json_encode(['success' => true, 'data' => $stats]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>