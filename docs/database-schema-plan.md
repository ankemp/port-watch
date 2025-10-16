# Database Schema Plan (v1 scope)

This document defines the scope and approach for the current subtask: define the complete Prisma schema for v1.

## Objectives

- Model core entities with fields, constraints, and relationships.
- Add enums for roles, connection types, permission types, and audit events.
- Include indexes and cascade rules for integrity and performance.
- Mark sensitive fields intended for encryption.

## Enums (v1 scope)

- `UserRole`: ADMIN, USER
- `HostConnectionType`: DOCKER_SOCKET, SSH, TCP_TLS
- `PermissionType`: OWNER, ADMIN, WRITE, READ
- `AuditEventType`: USER_LOGIN, USER_LOGOUT, USER_CREATED, USER_DELETED, HOST_ADDED, HOST_UPDATED, HOST_REMOVED, CONTAINER_STARTED, CONTAINER_STOPPED, CONTAINER_REMOVED

## Models and Relationships (v1 scope)

- `User`

  - Fields: id, email (unique), name?, passwordHash, role, createdAt, updatedAt
  - Relations: permissions (1:M), auditLogs (1:M)

- `Permission`

  - Fields: id, userId, resourceType, resourceId, type, createdAt
  - Relations: user (M:1)
  - Notes: `resourceType` is a string for flexibility (e.g., 'host', 'container')
  - Indexes: (userId, resourceType, resourceId) unique

- `AuditLog`
  - Fields: id, userId?, eventType, entityType, entityId, details (Json), createdAt
  - Relations: user (M:1, optional)
  - Indexes: eventType, createdAt

## Host Configuration

Hosts are defined in a YAML config file (`hosts.yaml`) at the project root. This file is loaded at application startup. No host data is stored in the database.

Example:

```yaml
hosts:
  - name: local-docker
    connectionType: DOCKER_SOCKET
    dockerSocketPath: /var/run/docker.sock
  - name: remote-tcp
    connectionType: TCP_TLS
    host: 192.168.1.100
    port: 2376
  - name: remote-ssh
    connectionType: SSH
    host: 192.168.1.101
    port: 22
    user: dockeradmin
```

## Referential Actions (Cascade Strategy)

- `User` -> `Permission`: onDelete: Cascade
- Optional/null-safe relationships use `SetNull` where appropriate (e.g., `AuditLog.user`)

## Notes on Security and Performance

- Fields marked `*Encrypted` are placeholders to be handled by the upcoming `EncryptionService`.
- Use `@unique` where natural keys exist (e.g., user.email).
- Add pragmatic indexes for frequent queries: `AuditLog(eventType, createdAt)`.

## Acceptance Criteria

- Prisma schema contains v1 models (User, Host, Permission, AuditLog), enums, relations, indexes, and cascade rules.
- `npx prisma format` succeeds; `npx prisma generate` runs without errors.
- Ready to proceed with the initial migration in the subsequent subtask.

## Implementation Steps

1. Add enums and models to `prisma/schema.prisma` with comments for encrypted fields.
2. Define relations and referential actions.
3. Add `@@index`/`@@unique` as specified.
4. Format and generate Prisma Client.
5. Commit changes with message: "feat(db): define initial Prisma schema (v1)".

## Future Considerations

- Consider converting `Permission.resourceType` to an enum in a future version.
- Add soft-delete flags if needed for auditability; otherwise, rely on `AuditLog` and true deletes.
- Consider partitioning or archiving strategy for `AuditLog` if it grows large.
