import React, { Component } from 'react';
import { Col, Row } from 'react-bootstrap';

export default class Footer extends Component {
  render() {
    const { history, resumeCount, mailCount, smsCount, user } = this.props;
    return (
      <div>
        <Row>
          <Col>[History]</Col>
        </Row>
        <Row>
          <Col>
            {history && history.result
              ? history.result.map(each => {
                  return <p>{each}</p>;
                })
              : 'new candidate'}
          </Col>
        </Row>
        <hr />
        <Row>
          <Col>Resume: {resumeCount}</Col>
          <Col>Mail: {mailCount}</Col>
          <Col>SMS: {smsCount}</Col>
          <Col className="text-right">
            {user.user_name || 'Unauthorized User'}
          </Col>
        </Row>
      </div>
    );
  }
}
