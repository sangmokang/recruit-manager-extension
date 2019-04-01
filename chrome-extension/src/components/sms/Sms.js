import React, { Component } from 'react';
import { Button, Col, Form, Row } from 'react-bootstrap';
import Axios from 'axios';
import Api from '../../utils/api';

export default class Sms extends Component {
  constructor(props) {
    super(props);
    this.state = {
      validatedSms: false
    };
  }

  smsSubmit = event => {
    const form = event.currentTarget;
    if (form.checkValidity() === false) {
      event.preventDefault();
      alert('전화번호를 입력해주세요');
      event.stopPropagation();
    } else {
      if (!this.props.sms.content.includes('undefined')) {
        event.preventDefault();
        this.setState({ validatedSms: true });
        this.sendSMS();
      } else {
        event.preventDefault();
        alert('포지션을 선택해주세요');
      }
    }
  };

  sendSMS = () => {
    Axios.post(Api.sendSMS, {
      user_id: this.props.user.user_id,
      rm_code: this.props.candidate.rm_code,
      recipient: this.props.candidate.mobile,
      body: this.props.sms.content,
      position: this.props.selectedPosition
    });
    this.props.addCount('smsCount');
  };

  render() {
    const { validatedSms } = this.state;
    const {
      candidate,
      sms,
      handleMobileChange,
      handleContentChange
    } = this.props;

    return (
      <Row>
        <Col>
          <details open={true}>
            <summary>[SMS]</summary>
            <br />
            <Form
              noValidate
              validated={validatedSms}
              onSubmit={e => this.smsSubmit(e)}
            >
              <Button type="submit" block size="sm">
                <i class="fas fa-comment"> 문자 보내기</i>
              </Button>
              <br />
              <Form.Group as={Row} controlId="smsRecipient">
                <Form.Label column sm={2}>
                  수신인
                </Form.Label>
                <Col sm={10}>
                  <Form.Control
                    required
                    size="sm"
                    value={candidate.mobile || null}
                    onChange={event => handleMobileChange(event)}
                  />
                  <Form.Control.Feedback type="invalid">
                    전화번호를 입력해주세요.
                  </Form.Control.Feedback>
                </Col>
              </Form.Group>

              <Form.Group as={Row} controlId="smsContent">
                <Form.Label column sm={2}>
                  내용
                </Form.Label>
                <Col sm={10}>
                  <Form.Control
                    as="textarea"
                    size="sm"
                    rows="2"
                    required
                    value={sms.content || null}
                    onChange={event => handleContentChange(event)}
                  />
                  <Form.Control.Feedback type="invalid">
                    내용을 입력해주세요.
                  </Form.Control.Feedback>
                </Col>
              </Form.Group>

              <Form.Group as={Row}>
                <Col sm={9} />
                <Button column sm={2} size="sm" variant="outline-warning">
                  <i className="fas fa-arrow-left" />
                </Button>
                <Col sm={2}>
                  <Button column sm={2} size="sm" variant="outline-warning">
                    <i className="fas fa-arrow-right" />
                  </Button>
                </Col>
              </Form.Group>
            </Form>
          </details>
        </Col>
      </Row>
    );
  }
}
