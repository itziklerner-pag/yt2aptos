"use strict";
/**
 * Authentication and authorization type definitions for the YouTube Archiving System.
 * These types are shared between the frontend and backend.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ROLE_PERMISSIONS = exports.Permission = exports.UserRole = exports.AuthMethod = void 0;
/**
 * Available authentication methods
 */
var AuthMethod;
(function (AuthMethod) {
    AuthMethod["TRADITIONAL"] = "traditional";
    AuthMethod["WALLET"] = "wallet";
})(AuthMethod || (exports.AuthMethod = AuthMethod = {}));
/**
 * User roles for role-based access control
 */
var UserRole;
(function (UserRole) {
    UserRole["USER"] = "user";
    UserRole["ADMIN"] = "admin";
})(UserRole || (exports.UserRole = UserRole = {}));
/**
 * User permissions for fine-grained access control
 */
var Permission;
(function (Permission) {
    // Content management permissions
    Permission["VIEW_CONTENT"] = "view_content";
    Permission["MANAGE_CONTENT"] = "manage_content";
    Permission["DELETE_CONTENT"] = "delete_content";
    // User management permissions
    Permission["VIEW_USERS"] = "view_users";
    Permission["MANAGE_USERS"] = "manage_users";
    // Download management permissions
    Permission["CREATE_DOWNLOAD"] = "create_download";
    Permission["VIEW_DOWNLOADS"] = "view_downloads";
    Permission["MANAGE_DOWNLOADS"] = "manage_downloads";
    // System management permissions
    Permission["SYSTEM_ADMIN"] = "system_admin";
})(Permission || (exports.Permission = Permission = {}));
/**
 * Role permission mappings
 */
exports.ROLE_PERMISSIONS = {
    [UserRole.USER]: [
        Permission.VIEW_CONTENT,
        Permission.CREATE_DOWNLOAD,
        Permission.VIEW_DOWNLOADS,
    ],
    [UserRole.ADMIN]: Object.values(Permission),
};
//# sourceMappingURL=types.js.map