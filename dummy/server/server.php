<?php
    // Gather request data
    $method = $_SERVER['REQUEST_METHOD'];
    $uri = $_SERVER['REQUEST_URI'];
    $headers = getallheaders();
    $body = file_get_contents("php://input");

    // Format log message
    $log = "Request Received:\n";
    $log .= "Method: $method\n";
    $log .= "URI: $uri\n";
    $log .= "Headers: " . print_r($headers, true);
    $log .= "Body: $body\n";

    // Output to server console/log
    error_log($log);
    echo "hello";
?>