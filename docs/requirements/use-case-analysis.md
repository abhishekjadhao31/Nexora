# Nexora Use Case Analysis

## 1. Purpose

This document identifies the actors and major use cases of the Nexora system
based on the approved stakeholder requirements and Software Requirements
Specification.

The identified use cases will be used as the basis for designing the Nexora
Use Case Diagram and detailed use case specifications.

---

## 2. Actors

### 2.1 Project Owner / Leader

The Project Owner / Leader is responsible for creating and managing projects,
organizing project members, creating and assigning tasks, managing task
resources, managing milestones, and monitoring project progress.

The Project Leader may assign a task either to a project member or to
himself/herself.

### 2.2 Team Member

The Team Member is responsible for performing tasks assigned to them, updating
the status of those tasks, and submitting documents and links as deliverables.

A Team Member cannot independently create project tasks.

### 2.3 Supervisor / Manager

The Supervisor / Manager is responsible primarily for monitoring project
activities and progress.

The Supervisor / Manager can view project information, tasks, milestones,
team information, and submitted deliverables. The Supervisor / Manager can
also change the deadline of a task when required.

---

## 3. Actor Responsibilities

### 3.1 Project Owner / Leader

The Project Owner / Leader can:

- Register and log in to the system.
- Create projects.
- Update project information.
- Manage project members.
- Create tasks.
- Assign tasks to project members.
- Assign tasks to himself/herself.
- Provide task descriptions.
- Set task deadlines.
- Attach documents to tasks.
- Attach links to tasks.
- Create and manage project milestones.
- View project and task progress.
- View completed tasks.
- View task deliverables.
- Update the status of tasks assigned to himself/herself.

The Project Leader cannot change the status of another member's task.

### 3.2 Team Member

The Team Member can:

- Register and log in to the system.
- View projects they are assigned to.
- View their assigned tasks.
- View task descriptions and deadlines.
- View documents and links attached to their tasks.
- Update the status of their assigned tasks.
- Submit documents as task deliverables.
- Submit links as task deliverables.
- View relevant project information and progress.

The Team Member cannot independently create project tasks.

### 3.3 Supervisor / Manager

The Supervisor / Manager can:

- Register and log in to the system.
- View assigned projects.
- View project members.
- View project tasks.
- View task statuses.
- View project milestones.
- View overall project progress.
- View completed tasks.
- View submitted task deliverables.
- Change the deadline of a task.

The Supervisor / Manager cannot create tasks, assign tasks, change task status,
or manage project members.

---

## 4. Use Cases

### 4.1 Authentication and User Management

- **UC-AUTH-01:** Register Account
- **UC-AUTH-02:** Log In

### 4.2 Project Management

- **UC-PROJ-01:** Create Project
- **UC-PROJ-02:** Manage Project

### 4.3 Team Management

- **UC-TEAM-01:** Manage Project Team

### 4.4 Task Management

- **UC-TASK-01:** Create Task
- **UC-TASK-02:** Assign Task
- **UC-TASK-03:** Set Task Deadline
- **UC-TASK-04:** View Assigned Tasks
- **UC-TASK-05:** Update Task Status

### 4.5 Task Resources

- **UC-RES-01:** Attach Task Resource
- **UC-RES-02:** View Task Resources

### 4.6 Task Deliverables

- **UC-DEL-01:** Submit Task Deliverable
- **UC-DEL-02:** View Task Deliverables

### 4.7 Milestone Management

- **UC-MILE-01:** Manage Project Milestones
- **UC-MILE-02:** View Project Milestones

### 4.8 Progress Tracking

- **UC-PROG-01:** View Project Progress

### 4.9 Monitoring

- **UC-MON-01:** Monitor Project
- **UC-MON-02:** Change Task Deadline

---

## 5. Actor–Use Case Relationships

### 5.1 Project Owner / Leader

The Project Owner / Leader is associated with the following use cases:

| Use Case ID | Use Case |
|---|---|
| UC-AUTH-01 | Register Account |
| UC-AUTH-02 | Log In |
| UC-PROJ-01 | Create Project |
| UC-PROJ-02 | Manage Project |
| UC-TEAM-01 | Manage Project Team |
| UC-TASK-01 | Create Task |
| UC-TASK-02 | Assign Task |
| UC-TASK-03 | Set Task Deadline |
| UC-TASK-05 | Update Task Status for own tasks |
| UC-RES-01 | Attach Task Resource |
| UC-DEL-02 | View Task Deliverables |
| UC-MILE-01 | Manage Project Milestones |
| UC-MILE-02 | View Project Milestones |
| UC-PROG-01 | View Project Progress |

The Project Leader may assign a task either to a project member or to
himself/herself.

The Project Leader cannot change the status of a task assigned to another
member.

### 5.2 Team Member

The Team Member is associated with the following use cases:

| Use Case ID | Use Case |
|---|---|
| UC-AUTH-01 | Register Account |
| UC-AUTH-02 | Log In |
| UC-TASK-04 | View Assigned Tasks |
| UC-TASK-05 | Update Task Status |
| UC-RES-02 | View Task Resources |
| UC-DEL-01 | Submit Task Deliverable |
| UC-MILE-02 | View Project Milestones |
| UC-PROG-01 | View Project Progress |

The Team Member can update the status only of tasks assigned to them.

The Team Member cannot independently create or assign project tasks.

### 5.3 Supervisor / Manager

The Supervisor / Manager is associated with the following use cases:

| Use Case ID | Use Case |
|---|---|
| UC-AUTH-01 | Register Account |
| UC-AUTH-02 | Log In |
| UC-DEL-02 | View Task Deliverables |
| UC-MILE-02 | View Project Milestones |
| UC-PROG-01 | View Project Progress |
| UC-MON-01 | Monitor Project |
| UC-MON-02 | Change Task Deadline |

The Supervisor / Manager can monitor project information but cannot create or
assign tasks, change task status, or manage project members.

The Supervisor / Manager can change the deadline of a task when required.

---

## 6. Use Case Relationship Decisions

### 6.1 Association Relationships

The primary relationships in the Nexora Use Case Diagram will be direct
associations between actors and the use cases they are authorized to perform.

### 6.2 Include Relationships

No mandatory `<<include>>` relationships have been identified at the current
level of requirements analysis.

The use cases are sufficiently independent that introducing `<<include>>`
relationships would unnecessarily complicate the initial Use Case Diagram.

### 6.3 Extend Relationships

No `<<extend>>` relationships have been identified at the current level of
requirements analysis.

For example, assigning a task to the Project Leader himself/herself is treated
as an allowed assignment option within the `Assign Task` use case rather than
as a separate extending use case.

### 6.4 Relationship Modeling Principle

The Use Case Diagram will prioritize clarity and meaningful actor-system
interactions. Individual interface actions, database operations, and internal
implementation steps will not be represented as separate use cases unless
they represent meaningful actor goals.

---

## 7. Use Case Diagram

Detailed specifications for individual use cases will be developed after the
Use Case Diagram has been finalized.

## 8. Detailed Use Case Specifications