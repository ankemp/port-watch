# **Port Watch**

A modern, multi-host Docker management UI with a focus on security and team-based access control.

## **Table of Contents**

- [Introduction](#introduction)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
- [Configuration](#configuration)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

## **Introduction**

Port Watch is a web-based user interface designed to manage multiple Docker instances from a single, centralized platform. Whether your Docker hosts are on your local machine, on your network via a TCP proxy, or on a remote server accessible via SSH, Port Watch provides the tools to manage them.

The core philosophy of Port Watch is to provide powerful Docker management capabilities while enforcing security through a robust Role-Based Access Control (RBAC) system. Administrators can grant granular permissions to users, ensuring they only have access to the specific containers and hosts they are authorized to manage.

## **Key Features**

- **Multi-Host Management**: Connect to and manage Docker daemons via local socket, TCP proxy, or SSH.
- **Container Lifecycle Management**: Start, stop, restart, and delete containers. View detailed information, including labels, ports, volumes, and environment variables.
- **Real-time Log Streaming**: Stream logs directly from your containers to the UI in real-time.
- **Image Management**: Pull new images from public or private registries, and clean up your hosts by deleting or pruning unused images.
- **Role-Based Access Control (RBAC)**: A comprehensive user management system with Admin and User roles. Admins can assign specific permissions (View, Manage, Logs, Delete) for each container to individual users.
- **System-Wide Audit Trail**: Keep track of critical actions performed within the system. Admins can view a complete log of events like user logins, container actions, and host modifications.
- **Read-Only Network & Volume Views**: Inspect Docker networks and volumes on your hosts.

## **Screenshots**

A screenshot of the main container list.  
A screenshot of the container details view.  
A screenshot of the user management panel.

## **Tech Stack**

Port Watch is built with a modern, robust, and scalable tech stack.

| Component               | Technology          |
| :---------------------- | :------------------ |
| **Monorepo Management** | Nx                  |
| **Frontend Framework**  | Angular             |
| **Backend Framework**   | NestJS (TypeScript) |
| **Database**            | SQLite / PostgreSQL |
| **Authentication**      | JWT                 |

## **Getting Started**

Follow these instructions to get Port Watch up and running on your local machine for development and testing purposes.

### **Prerequisites**

- [Node.js](https://nodejs.org/) (v18 or later)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [Docker](https://www.docker.com/get-started)

## **Configuration**

Port Watch is designed to be easy to run out-of-the-box, but also configurable for production environments.

### **Database**

By default, the application uses a local **SQLite** database, which requires no configuration. The database file will be automatically created in the project directory.

For production deployments, you can switch to **PostgreSQL** by setting the following environment variables. You can create a .env file in the root of the project to manage these.

## **Roadmap**

We have many exciting features planned for future versions of Port Watch. Here's a look at what's potentially on the horizon:

- **Docker Compose Management**: Link Git repositories to discover and deploy Docker Compose stacks directly from the UI.
- **Dashboard View**: A high-level overview of all connected hosts and their status.
- **User Notifications**: In-app, email, and webhook notifications for important events (e.g., container crashes).
- **Docker Swarm & Kubernetes Support**: Expand management capabilities to include container orchestrators.
- **Advanced Network & Volume Management**: Add functionality to create and manage networks and volumes.

## **Contributing**

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

Please read our CONTRIBUTING.md file for details on our code of conduct and the process for submitting pull requests.

## **License**

Distributed under the MIT License. See [LICENSE](LICENSE) for more information.
