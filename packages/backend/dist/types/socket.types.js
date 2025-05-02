"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocketNamespace = exports.SocketEventType = void 0;
/**
 * Socket event types for standardization
 */
var SocketEventType;
(function (SocketEventType) {
    // Connection events
    SocketEventType["CONNECT"] = "connect";
    SocketEventType["DISCONNECT"] = "disconnect";
    SocketEventType["RECONNECT"] = "reconnect";
    SocketEventType["ERROR"] = "error";
    // Content update events
    SocketEventType["CONTENT_UPDATED"] = "content:updated";
    SocketEventType["CONTENT_CREATED"] = "content:created";
    SocketEventType["CONTENT_DELETED"] = "content:deleted";
    // Download job events
    SocketEventType["DOWNLOAD_CREATED"] = "download:created";
    SocketEventType["DOWNLOAD_UPDATED"] = "download:updated";
    SocketEventType["DOWNLOAD_STATUS_CHANGED"] = "download:statusChanged";
    SocketEventType["DOWNLOAD_PROGRESS"] = "download:progress";
    // User events
    SocketEventType["USER_ACTIVITY"] = "user:activity";
    SocketEventType["USER_PRESENCE"] = "user:presence";
    // System events
    SocketEventType["SYSTEM_NOTIFICATION"] = "system:notification";
    SocketEventType["SYSTEM_ERROR"] = "system:error";
    SocketEventType["SYSTEM_MAINTENANCE"] = "system:maintenance";
    // Monitoring events
    SocketEventType["SYSTEM_METRICS_UPDATED"] = "monitoring:systemMetricsUpdated";
    SocketEventType["DOWNLOAD_METRICS_UPDATED"] = "monitoring:downloadMetricsUpdated";
    SocketEventType["STORAGE_METRICS_UPDATED"] = "monitoring:storageMetricsUpdated";
    SocketEventType["ALERT_TRIGGERED"] = "monitoring:alertTriggered";
    SocketEventType["ALERT_RESOLVED"] = "monitoring:alertResolved";
    // Acknowledgment events
    SocketEventType["ACK"] = "ack";
    SocketEventType["RECEIVED"] = "received";
})(SocketEventType || (exports.SocketEventType = SocketEventType = {}));
/**
 * Socket namespaces
 */
var SocketNamespace;
(function (SocketNamespace) {
    SocketNamespace["CONTENT"] = "/content";
    SocketNamespace["DOWNLOADS"] = "/downloads";
    SocketNamespace["USERS"] = "/users";
    SocketNamespace["SYSTEM"] = "/system";
})(SocketNamespace || (exports.SocketNamespace = SocketNamespace = {}));
//# sourceMappingURL=socket.types.js.map