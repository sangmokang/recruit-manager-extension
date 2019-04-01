import React, { Component } from 'react';
import { Col, Row, Table } from 'react-bootstrap';

export default class RatingsTable extends Component {
  render() {
    return (
      <Row>
        <Col>
          <details open={true}>
            <summary>[적합도]</summary>
            <br />
            <div>
              <Table striped bordered hover>
                <thead>
                  <tr>
                    <th>Company</th>
                    <th>Title</th>
                    <th>Score</th>
                  </tr>
                </thead>
                {this.props.ratings
                  ? this.props.ratings.slice(6).map(rate => {
                      return (
                        <tbody>
                          <tr>
                            <td>{rate.company}</td>
                            <td
                              onClick={() => this.props.setPosition(rate.title)}
                            >
                              {rate.title}
                            </td>
                            <td>{rate.score}</td>
                          </tr>
                        </tbody>
                      );
                    })
                  : null}
              </Table>
            </div>
          </details>
        </Col>
      </Row>
    );
  }
}
