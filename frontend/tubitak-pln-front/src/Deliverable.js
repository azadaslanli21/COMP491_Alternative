import React, { Component } from 'react';
import { Table, Button, ButtonToolbar } from 'react-bootstrap';
import { AddDeliverableModal } from './AddDeliverableModal';
import { EditDeliverableModal } from './EditDeliverableModal';

export class Deliverable extends Component {
  constructor(props) {
    super(props);
    this.state = {
      deliverables: [],
      addModalShow: false,
      editModalShow: false,
      wpMap: {},
    };
  }

  /* ------------------ helpers ------------------ */
  refreshList = () => {
    fetch(process.env.REACT_APP_API + 'deliverables')
      .then(res => res.json())
      .then(data => this.setState({ deliverables: data }));
  };

  getWPName = id => this.state.wpMap[id] || id;

  deleteDeliverable = id => {
    if (window.confirm('Are you sure?')) {
      fetch(process.env.REACT_APP_API + 'deliverables/' + id, {
        method: 'DELETE',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      }).then(this.refreshList);
    }
  };

  /* ------------------ lifecycle ------------------ */
  componentDidMount() {
    // Pre‑load lookup maps, then tasks
    Promise.all([
      fetch(process.env.REACT_APP_API + 'workpackages').then(r => r.json()),
    ]).then(([wps]) => {
      const wpMap = {};
      wps.forEach(wp => (wpMap[wp.id] = wp.name));
      this.setState({ wpMap }, this.refreshList);
    });
  }

  componentDidUpdate(prevProps, prevState) {
    if (
      prevState.addModalShow !== this.state.addModalShow ||
      prevState.editModalShow !== this.state.editModalShow
    ) {
      this.refreshList();
    }
  }

  /* ------------------ render ------------------ */
  render() {
    const { deliverables } = this.state;
    const addModalClose = () => this.setState({ addModalShow: false });
    const editModalClose = () => this.setState({ editModalShow: false });

    return (
      <div>
        <Table className="mt-4" striped bordered hover size="sm">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Description</th>
              <th>Deadline</th>
              <th>WorkPackage</th>
            </tr>
          </thead>
          <tbody>
            {deliverables.map(t => (
              <tr key={t.id}>
                <td>{t.id}</td>
                <td>{t.name}</td>
                <td>{t.description}</td>
                <td>{t.deadline}</td>
                <td>{this.getWPName(t.work_package)}</td>
                <td>
                  <ButtonToolbar>
                    <Button
                      className="mr-2"
                      variant="info"
                      onClick={() =>
                        this.setState({
                          editModalShow: true,
                          deliverableid: t.id,
                          name: t.name,
                          description: t.description,
                          deadline: t.deadline,
                          work_package: t.work_package,
                        })
                      }
                    >
                      Edit
                    </Button>
                    <Button className="mr-2" variant="danger" onClick={() => this.deleteDeliverable(t.id)}>
                      Delete
                    </Button>
                  </ButtonToolbar>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>

        <ButtonToolbar>
          <Button variant="primary" onClick={() => this.setState({ addModalShow: true })}>
            Add Deliverable
          </Button>

          <AddDeliverableModal show={this.state.addModalShow} onHide={addModalClose} />

          <EditDeliverableModal
            show={this.state.editModalShow}
            onHide={editModalClose}
            deliverableid={this.state.deliverableid}
            name={this.state.name}
            description={this.state.description}
            deadline={this.state.deadline}
            work_package={this.state.work_package}
          />
        </ButtonToolbar>
      </div>
    );
  }
}
