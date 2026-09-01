# Software Requirements Specification (SRS)

# Nexora

## 1. Introduction

### 1.1 Purpose

This Software Requirements Specification (SRS) document defines the functional
and non-functional requirements of Nexora, a web-based project organization
and collaboration platform.

The purpose of this document is to provide a clear and structured description
of the system's expected behavior, capabilities, constraints, and quality
requirements. It will serve as a reference for the design, development,
testing, and deployment of the Nexora system.

This document is intended for the project development team, project
stakeholders, supervisors, testers, and other individuals involved in the
development and evaluation of the system.

### 1.2 Scope

Nexora is a web-based platform designed to help teams organize and manage
project-related activities through a centralized system.

The system will provide functionality for:

- User authentication and role-based access.
- Project creation and management.
- Team member management.
- Task creation and assignment.
- Assignment of tasks to project members or to the Project Leader himself/herself.
- Task deadline management.
- Task status tracking.
- Sharing documents and links as task resources.
- Submission of documents and links as task deliverables.
- Project milestone management.
- Project progress tracking.
- Project monitoring by authorized users.

Nexora will support three primary user roles:

1. Project Owner / Leader
2. Team Member
3. Supervisor / Manager

Nexora is intended to support project organization and collaboration. It is
not intended to replace specialized development and collaboration tools such
as GitHub, IDEs, or other external services.

### 1.3 Definitions and Acronyms

| Term | Definition |
|------|------------|
| Nexora | The web-based project organization and collaboration platform developed as part of the semester project. |
| Project Leader | The user responsible for creating and managing a project, its members, tasks, and milestones. |
| Team Member | A user who works on tasks assigned to them within a project. |
| Supervisor / Manager | A user responsible for monitoring project activities and progress and changing task deadlines when required. |
| Task | A unit of work created within a project and assigned to a project member or the Project Leader. |
| Task Resource | A document or link provided with a task to help the assigned user perform the task. |
| Task Deliverable | A document or link submitted by a Team Member as the result of work performed on a task. |
| Milestone | A significant point or stage within a project used to organize and track project progress. |
| REST API | Representational State Transfer Application Programming Interface used for communication between system components. |
| UI | User Interface through which users interact with Nexora. |
| SRS | Software Requirements Specification. |

### 1.4 References

The following project documents will be used as references during the
development of Nexora:

- Nexora Stakeholder Requirements
- Nexora UML and system design documentation
- Nexora database design documentation
- Nexora REST API documentation
- Nexora testing documentation

### 1.5 Document Overview

This document describes the requirements and expected behavior of the Nexora
system.

The following sections describe the overall system, system features,
interfaces, functional requirements, non-functional requirements, constraints,
and assumptions that will guide the development of Nexora.


## 2. Overall Description

### 2.1 Product Perspective

Nexora is a web-based project organization and collaboration system. It will
provide a centralized platform for managing project information, team members,
tasks, task resources, task deliverables, milestones, and project progress.

The system will follow a client-server architecture consisting primarily of a
frontend application, a backend application, and a database.

The frontend will provide the user interface through which users interact with
the system. The backend will implement the application logic and expose REST
APIs for communication with the frontend. The database will provide persistent
storage for users, projects, tasks, milestones, resources, deliverables, and
related information.

The high-level relationship between the major components is:

    User
      |
      v
    Frontend
      |
      | REST API
      v
    Backend
      |
      v
    Database

Nexora may also work with external services or tools where appropriate, but it
is not intended to replace specialized tools such as GitHub or IDEs.

### 2.2 Product Functions

The major functions of Nexora include:

- User registration and authentication.
- Role-based access control.
- Project creation and management.
- Project team management.
- Task creation and assignment.
- Assignment of tasks to project members or to the Project Leader.
- Task deadline management.
- Task status management.
- Task resource management.
- Task deliverable submission and management.
- Milestone management.
- Project progress tracking.
- Project monitoring.
- Role-based access to project information.

### 2.3 User Classes and Characteristics

Nexora will support three primary user classes.

#### 2.3.1 Project Owner / Leader

The Project Owner / Leader is responsible for managing projects and organizing
the work performed within them.

The Project Leader can:

- Create and manage projects.
- Add and remove project members.
- Create tasks.
- Assign tasks to team members.
- Assign tasks to himself/herself.
- Set task deadlines.
- Attach documents and links as task resources.
- Create and manage milestones.
- View project and task progress.
- View submitted task deliverables.
- Update the status of tasks assigned to himself/herself.

The Project Leader cannot change the status of another member's task.

#### 2.3.2 Team Member

The Team Member is responsible for completing tasks assigned to them.

The Team Member can:

- View projects they are assigned to.
- View their assigned tasks.
- View task descriptions, deadlines, resources, and links.
- Update the status of their assigned tasks.
- Submit documents as task deliverables.
- Submit links as task deliverables.
- View relevant project information and progress.

The Team Member cannot independently create project tasks.

#### 2.3.3 Supervisor / Manager

The Supervisor / Manager is primarily responsible for monitoring project
activities and progress.

The Supervisor / Manager can:

- View assigned projects.
- View project members.
- View project tasks.
- View task statuses.
- View project milestones.
- View completed tasks and submitted deliverables.
- View overall project progress.
- Change the deadline of a task.

The Supervisor / Manager cannot create or assign tasks or change task status.

### 2.4 Operating Environment

Nexora will operate as a web-based application.

The expected operating environment includes:

- A modern web browser such as Google Chrome, Microsoft Edge, Mozilla Firefox,
  or another standards-compliant browser.
- A frontend application running in the user's web browser.
- A backend application running on a server or cloud deployment environment.
- A relational database used for persistent data storage.
- Network connectivity for communication between the frontend and backend.

The exact technologies and deployment services will be finalized during the
system design and implementation phases.

### 2.5 Design and Implementation Constraints

The following constraints apply to the development of Nexora:

- The project will be developed by a two-member student team.
- The project must satisfy the academic requirements of the Software
  Engineering and Web Services subjects.
- The system must be implemented as a web-based application.
- Frontend and backend components will be developed separately.
- Communication between frontend and backend will use REST-based web services.
- Persistent project data will be stored in a relational database.
- Git and GitHub will be used for source-code version control and collaborative
  development.
- The system must implement role-based access control.
- Development must be completed within the available semester project
  timeframe.

### 2.6 Assumptions and Dependencies

The following assumptions and dependencies apply to Nexora:

- Users will have valid accounts before accessing protected system features.
- Each user will have an appropriate role within the system.
- A Project Leader will manage the project and its members.
- Team Members will work on tasks assigned to them.
- Team Members will not independently create project tasks.
- A Project Leader may assign a task either to a project member or to
  himself/herself.
- Task status will consist of To Do, In Progress, and Completed.
- Task priority is not part of the system.
- Task resources may contain documents and links provided by the Project
  Leader.
- Task deliverables may contain documents and links submitted by Team Members.
- The Supervisor / Manager will primarily monitor projects and may change task
  deadlines when required.
- Project progress will be derived from task status.
- The availability and reliability of the deployment environment and database
  are dependencies for the deployed system.