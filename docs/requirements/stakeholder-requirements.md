# Nexora Stakeholder Requirements

## 1. Project Overview

Nexora is a web-based project organization and collaboration platform designed
to help teams organize projects, tasks, milestones, resources, deliverables,
and project progress.

The system is intended to provide a centralized platform where project leaders,
team members, and supervisors can manage and monitor project-related activities.

Nexora focuses on project organization and collaboration while allowing
specialized tools such as GitHub, IDEs, and other external services to continue
serving their respective purposes.

---

## 2. Stakeholders

### 2.1 Project Owner / Leader

The Project Owner / Leader is responsible for creating and managing projects,
organizing the project team, creating and assigning tasks, managing milestones,
and monitoring project progress.

### 2.2 Team Member

The Team Member is responsible for working on tasks assigned to them, updating
task status, and submitting documents and links related to their completed work.

### 2.3 Supervisor / Manager

The Supervisor / Manager is responsible for monitoring project activities and
progress. The Supervisor / Manager can view project information and change task
deadlines when required.

---

## 3. Stakeholder Needs

### 3.1 Project Owner / Leader

The Project Owner / Leader needs the system to:

- Create and manage projects.
- Add and manage members within a project.
- Create tasks for the project.
- Assign tasks to project members.
- Assign tasks to himself/herself.
- Set deadlines for tasks.
- Provide relevant documents and links with assigned tasks.
- Create and manage project milestones.
- Monitor the progress of tasks and milestones.
- View completed tasks and submitted deliverables.
- Review documents and links submitted by team members.

### 3.2 Team Member

The Team Member needs the system to:

- Access projects they are assigned to.
- View tasks assigned to them.
- View task descriptions, deadlines, documents, and links provided by the
  Project Leader.
- Update the status of their assigned tasks.
- Submit documents related to completed work.
- Submit links related to completed work.
- View relevant project resources and information.
- Track their assigned work and progress.

### 3.3 Supervisor / Manager

The Supervisor / Manager needs the system to:

- View projects they are responsible for monitoring.
- View project members and their assigned tasks.
- View task and milestone progress.
- Monitor overall project progress.
- View completed tasks and submitted deliverables.
- Review project activity and status.
- Change the deadline of a task when required.

---

## 4. Functional Requirements

### 4.1 Authentication and User Management

**FR-AUTH-01:** The system shall allow users to create an account.

**FR-AUTH-02:** The system shall allow registered users to log in securely.

**FR-AUTH-03:** The system shall authenticate users before providing access to
protected project information.

**FR-AUTH-04:** The system shall associate each user with an appropriate role.

**FR-AUTH-05:** The system shall restrict system functionality according to the
user's role.

---

### 4.2 Project Management

**FR-PROJ-01:** The system shall allow a Project Leader to create a project.

**FR-PROJ-02:** The system shall allow a Project Leader to view projects they
own or manage.

**FR-PROJ-03:** The system shall allow a Project Leader to update project
information.

**FR-PROJ-04:** The system shall allow a Project Leader to manage the members
associated with a project.

**FR-PROJ-05:** The system shall allow authorized users to view project
information according to their role.

---

### 4.3 Team Management

**FR-TEAM-01:** The system shall allow a Project Leader to add members to a
project.

**FR-TEAM-02:** The system shall allow a Project Leader to remove members from
a project.

**FR-TEAM-03:** The system shall allow project members to view the members
associated with their project.

**FR-TEAM-04:** The system shall restrict team-management operations to
authorized users.

---

### 4.4 Task Management

**FR-TASK-01:** The system shall allow a Project Leader to create a task within
a project.

**FR-TASK-02:** The system shall allow a Project Leader to assign a task to a
project member.

**FR-TASK-03:** The system shall allow a Project Leader to assign a task to
himself/herself.

**FR-TASK-04:** The system shall allow a Project Leader to provide a task
description.

**FR-TASK-05:** The system shall allow a Project Leader to set a deadline for
a task.

**FR-TASK-06:** The system shall allow a Supervisor / Manager to change the
deadline of a task.

**FR-TASK-07:** The system shall allow a Team Member to view tasks assigned to
them.

**FR-TASK-08:** The system shall allow a Team Member to update the status of
their assigned task.

**FR-TASK-09:** The system shall support the task statuses To Do, In Progress,
and Completed.

**FR-TASK-10:** The system shall allow a Project Leader to update the status of
tasks assigned to himself/herself.

**FR-TASK-11:** The system shall prevent Team Members from creating tasks
independently.

**FR-TASK-12:** The system shall prevent a Project Leader from changing the
status of another member's task.

---

### 4.5 Task Resources

**FR-RES-01:** The system shall allow a Project Leader to attach documents to a
task.

**FR-RES-02:** The system shall allow a Project Leader to attach links to a
task.

**FR-RES-03:** The system shall allow a Team Member assigned to a task to view
the resources attached to that task.

**FR-RES-04:** The system shall associate each task resource with its
corresponding task.

---

### 4.6 Task Deliverables

**FR-DEL-01:** The system shall allow a Team Member to attach documents as
deliverables for an assigned task.

**FR-DEL-02:** The system shall allow a Team Member to attach links as
deliverables for an assigned task.

**FR-DEL-03:** The system shall associate each deliverable with its
corresponding task.

**FR-DEL-04:** The system shall allow the Project Leader to view submitted task
deliverables.

**FR-DEL-05:** The system shall allow authorized users to view submitted
deliverables according to their role.

---

### 4.7 Milestone Management

**FR-MILE-01:** The system shall allow a Project Leader to create a milestone
for a project.

**FR-MILE-02:** The system shall allow a Project Leader to define milestone
information.

**FR-MILE-03:** The system shall allow a Project Leader to view and manage
project milestones.

**FR-MILE-04:** The system shall allow authorized project users to view
milestone information.

---

### 4.8 Progress Tracking

**FR-PROG-01:** The system shall track the status of project tasks.

**FR-PROG-02:** The system shall calculate project progress based on the status
of project tasks.

**FR-PROG-03:** The system shall allow the Project Leader to view overall
project progress.

**FR-PROG-04:** The system shall allow Team Members to view progress relevant
to their assigned work.

**FR-PROG-05:** The system shall allow the Supervisor / Manager to view overall
project progress.

---

### 4.9 Monitoring

**FR-MON-01:** The system shall allow the Supervisor / Manager to view assigned
projects.

**FR-MON-02:** The system shall allow the Supervisor / Manager to view project
members.

**FR-MON-03:** The system shall allow the Supervisor / Manager to view project
tasks.

**FR-MON-04:** The system shall allow the Supervisor / Manager to view task
statuses.

**FR-MON-05:** The system shall allow the Supervisor / Manager to view project
milestones.

**FR-MON-06:** The system shall allow the Supervisor / Manager to view
completed tasks and submitted deliverables.

**FR-MON-07:** The system shall allow the Supervisor / Manager to change task
deadlines.

---

## 5. Non-Functional Requirements

### 5.1 Security

- The system shall authenticate users before allowing access to protected
  resources.
- The system shall enforce role-based access control.
- The system shall prevent unauthorized users from accessing project data.
- User passwords shall not be stored in plain text.
- Sensitive configuration information shall not be stored directly in source
  code.

### 5.2 Performance

- The system should provide responses to normal user operations within a
  reasonable amount of time.
- The system should efficiently handle project, task, member, and resource
  information.
- The system should avoid unnecessary database operations.

### 5.3 Usability

- The system should provide a clear and understandable user interface.
- Users should be able to access functionality according to their role.
- Task status and project progress should be easy to understand.
- The system should provide clear feedback after important user actions.

### 5.4 Reliability

- The system should preserve project and task information accurately.
- The system should handle invalid user input without crashing.
- The system should provide appropriate error messages when an operation fails.
- Stored project information should remain consistent across the system.

### 5.5 Maintainability

- The system should use a modular architecture.
- Frontend and backend responsibilities should be separated.
- The backend should expose well-defined REST APIs.
- The source code should follow consistent coding practices.
- The project should use Git and GitHub for version control and collaboration.
- Project documentation should be maintained throughout development.

---

## 6. Constraints

- The project will be developed by a two-member student team.
- The system will be developed as a semester project combining Software
  Engineering and Web Services concepts.
- The system will use a web-based architecture.
- The backend and frontend will be developed as separate components.
- Communication between the frontend and backend will use web services through
  REST APIs.
- The system will use a relational database for persistent project data.
- Development time and resources are limited by the academic semester.
- The project will use Git and GitHub for collaborative development and version
  control.
- Specialized external tools such as GitHub or IDEs are not intended to be
  replaced by Nexora.

---

## 7. Assumptions

- Users have access to a modern web browser and an internet connection when
  using the deployed system.
- Users are assigned an appropriate role within the system.
- A Project Leader is responsible for managing the project and its members.
- Team Members work only on tasks assigned to them.
- Team Members cannot independently create project tasks.
- A Project Leader can assign tasks either to a project member or to
  himself/herself.
- Task status consists of To Do, In Progress, and Completed.
- Task priority is not part of the system.
- Task resources provided by the Project Leader may include documents and links.
- Task deliverables submitted by Team Members may include documents and links.
- The Supervisor / Manager primarily monitors projects and may change task
  deadlines when required.
- Project progress is derived from the status of project tasks.