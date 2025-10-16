# **Functional Requirements Document: Docker Management UI**

## **1\. Introduction**

### **1.1. Project Overview**

This document outlines the functional requirements for a web-based user interface designed to manage multiple Docker instances. The application will provide a centralized platform for administrators and users to monitor and interact with Docker containers, images, and hosts, with a strong emphasis on security and multi-user support through Role-Based Access Control (RBAC).

### **1.2. Scope**

The project will deliver a complete web application consisting of an Angular frontend, a NestJS backend API, and a supporting database. The application will connect to Docker hosts via local socket, TCP (for proxies), and SSH.

**In-Scope:**

- User authentication and management.
- Multi-host connection management.
- Container and image lifecycle management.
- Real-time container log streaming.
- Read-only viewing of networks and volumes.
- RBAC for restricting access to specific Docker resources.
- System-wide audit trail for key actions.

**Out-of-Scope for Initial Version**

- Management of Docker Compose stacks from Git repositories.
- Docker Swarm or Kubernetes management.
- Advanced network or volume management (e.g., creating/deleting unattached resources).
- Automated updates for deployed Docker Compose stacks from Git.
- A dedicated dashboard/homepage view.
- User notifications (e.g., in-app, email, webhooks).
- Billing and resource usage reporting.

## **2\. Technical Stack**

| Component               | Technology            | Notes                                                          |
| :---------------------- | :-------------------- | :------------------------------------------------------------- |
| **Monorepo Management** | Nx                    | Manages both frontend and backend code in a single repository. |
| **Frontend Framework**  | Angular               | The primary UI framework.                                      |
| **Backend Framework**   | NestJS (TypeScript)   | Provides the API for the frontend.                             |
| **Database**            | PostgreSQL            | Stores user data, host configurations, and RBAC policies.      |
| **Authentication**      | JWT (JSON Web Tokens) | Stateless authentication managed by the backend.               |

## **3\. User Roles & Access Control (RBAC)**

The system will have two primary user roles:

### **3.1. Administrator (Admin)**

- Has full, unrestricted access to all system features.
- Can add, edit, and remove other users (both Admins and General Users).
- Can add, edit, and remove all Docker host connections.
- Can view and manage all containers and images on any configured host.
- Can assign access permissions for hosts and containers to General Users.
- Can manage Git repository links and assign stack deployment permissions.
- Can view the system-wide audit trail to monitor user actions.

### **3.2. General User (User)**

- Has restricted access based on permissions granted by an Administrator.
- Can only view and interact with Docker hosts they have been explicitly granted access to.
- Can only view and interact with containers they have been explicitly granted access to.
- Permissions are granular and can include:
  - View: See the container/host and its status.
  - Manage: Start, stop, and restart the container.
  - Logs: View real-time logs for the container.
  - Delete: Remove the container.
  - Deploy Stack: Deploy and manage specific Docker Compose stacks.

## **4\. Functional Requirements**

### **4.1. User Management & Authentication**

- **FR-001:** The system shall provide a secure login page for users to authenticate. Upon successful login, the user shall be redirected to the main container list view.
- **FR-002:** Administrators shall have an interface to create, view, edit, and delete user accounts.
- **FR-003:** When creating a user, an Administrator shall assign a role (Admin or User).
- **FR-004:** The backend shall securely store user credentials, with passwords hashed and salted.

### **4.2. Host Management**

- **FR-005:** Administrators shall be able to add new Docker hosts to the system.
- **FR-006:** Adding a host requires specifying a name and connection type.
  - **Socket:** No additional details required (assumes local socket).
  - **TCP Proxy:** Requires Host/IP and Port.
  - **SSH:** Requires Host/IP, Port, Username, and authentication method (password or private key).
- **FR-007:** The system must securely store sensitive connection details (e.g., SSH keys) encrypted at rest in the database.
- **FR-008:** Administrators shall be able to grant User roles access to specific hosts.

### **4.3. Container Management**

- **FR-009:** Users shall be able to view a list of all containers on hosts they have access to.
- **FR-010:** The container list shall display key information: Name, Status (e.g., Running, Exited), Image, and creation date.
- **FR-011:** The container list shall display all Docker labels associated with each container, with a focus on easily identifying and reading traefik labels.
- **FR-012:** Users shall be able to filter the container list by name, status, and labels.
- **FR-013:** Users shall be able to navigate to a detailed view for each container, which displays comprehensive information including port mappings, attached volumes, connected networks, and environment variables.
- **FR-014:** Users with Manage permissions shall be able to perform actions on containers: Start, Stop, Restart.
- **FR-015:** Users with Logs permissions shall be able to open a view that streams the container's logs in real-time.
- **FR-016:** Administrators shall be able to assign User roles access to specific containers. If a user has access to a container, they are implicitly granted view-only access to its host.

### **4.4. Image Management**

- **FR-017:** Users shall be able to view a list of all images on hosts they have access to.
- **FR-018:** Users shall be able to pull new images from a public or private registry to a specific host.
- **FR-019:** Users shall be able to delete unused images from a host.
- **FR-020:** The system shall provide a feature to "prune" images (remove all dangling images).

### **4.5. Network and Volume Management (Read-Only)**

- **FR-021:** Users shall be able to view a list of all Docker networks on hosts they have access to.
- **FR-022:** Users shall be able to view a list of all Docker volumes on hosts they have access to.

### **4.6. Docker Compose Management**

- **FR-023:** Administrators shall be able to link Git repositories to the system, providing a URL, branch, and necessary credentials (e.g., personal access token or SSH key).
- **FR-024:** The system shall have a service to pull a linked repository and scan its file system for Docker Compose files (compose.yml, docker-compose.yml).
- **FR-025:** The UI shall display a list of discoverable "stacks" from the compose files found in the linked repositories.
- **FR-026:** Users with Deploy Stack permissions shall be able to deploy a stack to a permitted host. This action is equivalent to running docker-compose up \-d.
- **FR-027:** The system shall group containers belonging to a deployed stack, allowing users to view them as a single entity.
- **FR-028:** Users with Deploy Stack permissions shall be able to take down a deployed stack. This action is equivalent to running docker-compose down.
- **FR-029:** Administrators shall be able to grant User roles permissions to deploy and manage specific stacks on specific hosts.

### **4.7. Audit Trail**

- **FR-030:** The system shall automatically record critical events to an audit trail.
- **FR-031:** Recorded events shall include, but are not limited to: user login (success/failure), user creation/deletion, host creation/deletion, container start/stop/delete, and stack deployment/teardown.
- **FR-032:** The audit trail entry shall record the event timestamp, the user who performed the action, the action itself, and the target resource (e.g., container ID).
- **FR-033:** Administrators shall have access to a dedicated UI to view, search, and filter the audit trail.

## **5\. Non-Functional Requirements**

- **NFR-001 (Performance):** The UI must remain responsive. API calls for lists (containers, images) should be paginated to handle hosts with a large number of items. Log streaming should not noticeably impact frontend performance.
- **NFR-002 (Security):** All communication between the frontend and backend must be over HTTPS. All sensitive data stored in the database must be encrypted.
- **NFR-003 (Usability):** The user interface should be intuitive and require minimal training for a user familiar with Docker concepts. All actions should provide clear feedback (success, error).
