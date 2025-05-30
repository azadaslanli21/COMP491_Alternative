// GanttChartPage.js
import React, { Component } from 'react';
import { Container, Row, Col, Form, Button, Modal, Table } from 'react-bootstrap';
import { FrappeGantt } from 'frappe-gantt-react';
import dayjs from 'dayjs';

export class GanttChartPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      projectStart: '',
      workPackages: [],
      tasks: [],
      users: [],
      ganttTasks: [],
      showInfo: false,
      infoItem: null,
      filterStatus: 'all',
      filterUser: 'all',
      showWorkPackages: true,
      showTasks: true,
      showDeliverables: true, // placeholder for future use
    };
  }

  fetchData = () => {
    Promise.all([
      fetch(process.env.REACT_APP_API + 'workpackages').then(res => res.json()),
      fetch(process.env.REACT_APP_API + 'tasks').then(res => res.json()),
      fetch(process.env.REACT_APP_API + 'users').then(res => res.json()),
    ]).then(([wps, tasks, users]) =>
      this.setState({ workPackages: wps, tasks, users }, this.buildGanttData)
    );
  };

  buildGanttData = () => {
    const {
      projectStart, workPackages, tasks,
      filterStatus, filterUser,
      showWorkPackages, showTasks, showDeliverables
    } = this.state;

    if (!projectStart) return;

    const pStart = dayjs(projectStart);
    const ganttTasks = [];
    const wpIdToTaskId = {};

    const filteredWPs = workPackages.filter(wp => {
      if (filterStatus !== 'all' && wp.status !== filterStatus) return false;
      if (filterUser !== 'all') {
        if (!wp.users) return false;
        const ids = wp.users.map(u => (typeof u === 'object' ? u.id : u));
        if (!ids.includes(parseInt(filterUser))) return false;
      }
      return true;
    });

    if (showWorkPackages) {
      filteredWPs.forEach(wp => {
        const start = pStart.add(wp.start_date - 1, 'month');
        const end = pStart.add(wp.end_date, 'month');
        const wpTask = {
          id: 'WP-' + wp.id,
          name: wp.name,
          start: start.format('YYYY-MM-DD'),
          end: end.format('YYYY-MM-DD'),
          custom_class: 'bar-wp',
          progress: 100,
        };
        ganttTasks.push(wpTask);
        wpIdToTaskId[wp.id] = wpTask.id;
      });
    }

    if (showTasks) {
      const filteredTasks = tasks.filter(t => {
        if (filterStatus !== 'all' && t.status !== filterStatus) return false;
        if (filterUser !== 'all') {
          if (!t.users) return false;
          const ids = t.users.map(u => (typeof u === 'object' ? u.id : u));
          if (!ids.includes(parseInt(filterUser))) return false;
        }
        if (!wpIdToTaskId[t.work_package]) return false;
        return true;
      });

      filteredTasks.forEach(t => {
        const start = pStart.add(t.start_date - 1, 'month');
        const end = pStart.add(t.end_date, 'month');
        ganttTasks.push({
          id: 'T-' + t.id,
          name: t.name,
          start: start.format('YYYY-MM-DD'),
          end: end.format('YYYY-MM-DD'),
          parent: wpIdToTaskId[t.work_package],
          custom_class: 'bar-task',
          progress: 100,
        });
      });
    }

    // Future: Add deliverables here if showDeliverables === true

    this.setState({ ganttTasks });
  };

  componentDidMount() {
    fetch(process.env.REACT_APP_API + 'project/')
      .then(r => (r.ok ? r.json() : { start_date: '' }))
      .then(p => this.setState({ projectStart: p.start_date || '' }, this.fetchData));
  }

  handleBarClick = task => {
    const isWP = task.id.startsWith('WP-');
    const isTask = task.id.startsWith('T-');
    const id = parseInt(task.id.split('-')[1]);
    const { workPackages, tasks } = this.state;
    let data = null;
    if (isWP) {
      data = workPackages.find(wp => wp.id === id);
    } else if (isTask) {
      data = tasks.find(t => t.id === id);
    }
    this.setState({ showInfo: true, infoItem: { type: isWP ? 'Work Package' : 'Task', data } });
  };

  render() {
    const {
      ganttTasks, showInfo, infoItem,
      projectStart, users, filterStatus, filterUser,
      showWorkPackages, showTasks, showDeliverables
    } = this.state;

    const userMap = {};
    users.forEach(u => (userMap[u.id] = u.username || u.name || `User${u.id}`));

    return (
      <Container fluid className="mt-4">
        <Row className="mb-3">
          <Col sm={4}>
            <Form.Group>
              <Form.Label>Project Start Date:</Form.Label>
              <Form.Control type="text" readOnly value={projectStart || '—'} />
            </Form.Group>
          </Col>
        </Row>

        {/* Filters */}
        <Row className="mb-3">
          <Col sm={3}>
            <Form.Group controlId="filterStatus">
              <Form.Label>Status Filter:</Form.Label>
              <Form.Control
                as="select"
                value={filterStatus}
                onChange={e => this.setState({ filterStatus: e.target.value }, this.buildGanttData)}
              >
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="closed">Closed</option>
              </Form.Control>
            </Form.Group>
          </Col>
          <Col sm={3}>
            <Form.Group controlId="filterUser">
              <Form.Label>Filter by Member:</Form.Label>
              <Form.Control
                as="select"
                value={filterUser}
                onChange={e => this.setState({ filterUser: e.target.value }, this.buildGanttData)}
              >
                <option value="all">All Members</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.username || u.name || `User ${u.id}`}
                  </option>
                ))}
              </Form.Control>
            </Form.Group>
          </Col>
        </Row>

        {/* Show/hide checkboxes */}
        <Row className="mb-3">
          <Col sm={3}>
            <Form.Group controlId="showOptions">
              <Form.Label>Show Elements:</Form.Label>
              <div className="form-check">
                <Form.Check
                  type="checkbox"
                  label="Work Packages"
                  checked={showWorkPackages}
                  onChange={(e) => this.setState({ showWorkPackages: e.target.checked }, this.buildGanttData)}
                />
                <Form.Check
                  type="checkbox"
                  label="Tasks"
                  checked={showTasks}
                  onChange={(e) => this.setState({ showTasks: e.target.checked }, this.buildGanttData)}
                />
                <Form.Check
                  type="checkbox"
                  label="Deliverables"
                  checked={showDeliverables}
                  onChange={(e) => this.setState({ showDeliverables: e.target.checked }, this.buildGanttData)}
                />
              </div>
            </Form.Group>
          </Col>
        </Row>

        {/* Gantt Chart */}
        {ganttTasks.length > 0 && (
          <FrappeGantt
            tasks={ganttTasks}
            viewMode="Month"
            onClick={this.handleBarClick}
            listCellWidth="220px"
          />
        )}

        {/* Info Modal */}
        <Modal show={showInfo} onHide={() => this.setState({ showInfo: false })} size="lg" centered>
          <Modal.Header closeButton>
            <Modal.Title>
              {infoItem?.type} Details – {infoItem?.data?.name}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {infoItem && (
              <Table bordered size="sm" striped>
                <tbody>
                  {Object.entries(infoItem.data).map(([key, val]) => {
                    if (key === 'id') return null;
                    let displayVal = val;
                    if (
                      (key === 'users' || key === 'user_ids' || key === 'assigned_users') &&
                      Array.isArray(val)
                    ) {
                      displayVal = val.map(u =>
                        typeof u === 'object' ? userMap[u.id] || u.id : userMap[u] || u
                      );
                    }
                    if (
                      (key === 'user' || key === 'owner' || key === 'assigned_to') &&
                      typeof val === 'number'
                    ) {
                      displayVal = userMap[val] || val;
                    }
                    return (
                      <tr key={key}>
                        <th>{key}</th>
                        <td>{Array.isArray(displayVal) ? displayVal.join(', ') : displayVal}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            )}
          </Modal.Body>
        </Modal>

        <style>{`
          .bar-wp   { fill: rgb(0, 88, 210) !important; }
          .bar-task { fill: rgb(105, 149, 105) !important; }
        `}</style>
      </Container>
    );
  }
}
