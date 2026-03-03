<?php
require_once __DIR__ . '/../config/database.php';

$method = $_SERVER['REQUEST_METHOD'];
$request = $_SERVER['REQUEST_URI'];

// Parse the request to get task ID
$path_parts = explode('/', trim(parse_url($request, PHP_URL_PATH), '/'));
$taskId = null;

// Look for numeric ID in path
foreach ($path_parts as $part) {
    if (is_numeric($part)) {
        $taskId = (int)$part;
        break;
    }
}

switch ($method) {
    case 'GET':
        if ($taskId) {
            getTask($pdo, $taskId);
        } else {
            getAllTasks($pdo);
        }
        break;
        
    case 'POST':
        createTask($pdo);
        break;
        
    case 'PUT':
        if ($taskId) {
            updateTask($pdo, $taskId);
        } else {
            $input = json_decode(file_get_contents('php://input'), true);
            if (isset($input['id'])) {
                updateTask($pdo, $input['id']);
            } else {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Task ID required']);
            }
        }
        break;
        
    case 'DELETE':
        if ($taskId) {
            deleteTask($pdo, $taskId);
        } else {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Task ID required']);
        }
        break;
        
    default:
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => 'Method not allowed']);
        break;
}

function getAllTasks($pdo) {
    try {
        $stmt = $pdo->query("SELECT * FROM task_tasks ORDER BY created_at DESC");
        $tasks = $stmt->fetchAll();
        
        // Convert dates to proper format
        foreach ($tasks as &$task) {
            if ($task['due_date']) {
                $task['due_date'] = date('Y-m-d', strtotime($task['due_date']));
            }
        }
        
        echo json_encode(['success' => true, 'data' => $tasks]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}

function getTask($pdo, $id) {
    try {
        $stmt = $pdo->prepare("SELECT * FROM task_tasks WHERE id = ?");
        $stmt->execute([$id]);
        $task = $stmt->fetch();
        
        if ($task) {
            if ($task['due_date']) {
                $task['due_date'] = date('Y-m-d', strtotime($task['due_date']));
            }
            echo json_encode(['success' => true, 'data' => $task]);
        } else {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Task not found']);
        }
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}

function checkRateLimit($pdo) {
    // Limit to 15 new records per hour for tasks
    $stmt = $pdo->query("
        SELECT COUNT(*) as recent_count 
        FROM task_tasks 
        WHERE created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)
    ");
    $result = $stmt->fetch();
    
    if ($result['recent_count'] > 15) {
        http_response_code(429);
        echo json_encode(['success' => false, 'error' => 'Rate limit exceeded. Demo allows max 15 new tasks per hour.']);
        exit;
    }
}

function createTask($pdo) {
    checkRateLimit($pdo);
    
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        
        // Validate required fields
        if (!$input['title'] || !$input['description'] || !$input['category']) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Missing required fields: title, description, and category']);
            return;
        }
        
        // Handle completed_at timestamp
        $completed_at = null;
        if (isset($input['status']) && $input['status'] === 'completed') {
            $completed_at = date('Y-m-d H:i:s');
        }
        
        $stmt = $pdo->prepare("
            INSERT INTO task_tasks (title, description, status, priority, category, due_date, completed_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ");
        
        $stmt->execute([
            $input['title'],
            $input['description'],
            $input['status'] ?? 'pending',
            $input['priority'] ?? 'medium',
            $input['category'],
            $input['due_date'] ?? null,
            $completed_at
        ]);
        
        $newId = $pdo->lastInsertId();
        echo json_encode(['success' => true, 'data' => ['id' => $newId], 'message' => 'Task created successfully']);
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}

function updateTask($pdo, $id) {
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        
        // Get current task to check status change
        $currentStmt = $pdo->prepare("SELECT status FROM task_tasks WHERE id = ?");
        $currentStmt->execute([$id]);
        $currentTask = $currentStmt->fetch();
        
        if (!$currentTask) {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Task not found']);
            return;
        }
        
        // Handle completed_at timestamp
        $completed_at = $currentTask['status'] === 'completed' ? date('Y-m-d H:i:s') : null;
        if (isset($input['status'])) {
            if ($input['status'] === 'completed' && $currentTask['status'] !== 'completed') {
                $completed_at = date('Y-m-d H:i:s');
            } elseif ($input['status'] !== 'completed') {
                $completed_at = null;
            }
        }
        
        $stmt = $pdo->prepare("
            UPDATE task_tasks 
            SET title=?, description=?, status=?, priority=?, category=?, due_date=?, completed_at=?
            WHERE id=?
        ");
        
        $stmt->execute([
            $input['title'] ?? $currentTask['title'],
            $input['description'] ?? $currentTask['description'],
            $input['status'] ?? $currentTask['status'],
            $input['priority'] ?? $currentTask['priority'],
            $input['category'] ?? $currentTask['category'],
            $input['due_date'] ?? $currentTask['due_date'],
            $completed_at,
            $id
        ]);
        
        echo json_encode(['success' => true, 'message' => 'Task updated successfully']);
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}

function deleteTask($pdo, $id) {
    try {
        $stmt = $pdo->prepare("DELETE FROM task_tasks WHERE id = ?");
        $stmt->execute([$id]);
        
        if ($stmt->rowCount() > 0) {
            echo json_encode(['success' => true, 'message' => 'Task deleted successfully']);
        } else {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Task not found']);
        }
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}
?>