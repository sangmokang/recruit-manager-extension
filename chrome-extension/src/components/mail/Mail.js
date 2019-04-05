import React, { Component } from 'react';
import { Button, Col, Form, Row } from 'react-bootstrap';
import Axios from 'axios';
import Api from '../../utils/api';

export default class Mail extends Component {
  constructor(props) {
    super(props);
    this.state = {
      validatedMail: false
    };
  }

  mailSubmit = event => {
    const form = event.currentTarget;
    if (form.checkValidity() === false) {
      event.preventDefault();
      event.stopPropagation();
    } else {
      event.preventDefault();
      this.setState({ validatedMail: true, mailKey: 0 });
      this.sendMail();
    }
  };

  sendMail = () => {
    Axios.post(Api.sendMail, {
      user_id: this.props.user.user_id,
      rm_code: this.props.candidate.rm_code,
      sender: this.props.user.user_email,
      recipient: this.props.candidate.email,
      subject: this.props.mail.title,
      body:
        this.props.mail.content +
        '\n\n' +
        '[Position Detail]\n\n' +
        this.props.positionDetail +
        '\n\n' +
        this.props.mail.sign,
      position: this.props.selectedPosition
    });
    this.props.addCount('mailCount');
  };

  render() {
    const { validatedMail } = this.state;
    const {
      candidate,
      mail,
      nextMail,
      priorMail,
      mailKey,
      date,
      handleContentChange,
      handleDetailChange,
      positionDetail,
      selectedPosition
    } = this.props;

    return (
      <div>
        <Row>
          <Col>
            <details>
              <summary>[Mail]</summary>
              <br />
              <Form
                noValidate
                validated={validatedMail}
                onSubmit={e => this.mailSubmit(e)}
              >
                <Form.Group as={Row} controlId="emailRecipient">
                  <Form.Label column sm={2}>
                    수신인
                  </Form.Label>
                  <Col sm={10}>
                    <Form.Control
                      size="sm"
                      required
                      defaultValue={candidate.email || null}
                      onChange={event =>
                        this.setState({
                          candidate: {
                            ...candidate,
                            email: event.target.value
                          }
                        })
                      }
                    />
                    <Form.Control.Feedback type="invalid">
                      이메일을 입력해주세요.
                    </Form.Control.Feedback>
                  </Col>
                </Form.Group>

                <Form.Group as={Row} controlId="mailTitle">
                  <Form.Label column sm={2}>
                    제목
                  </Form.Label>
                  <Col sm={10}>
                    <Form.Control
                      type="text"
                      size="sm"
                      required
                      value={selectedPosition}
                      onChange={event =>
                        this.setState({
                          mail: {
                            ...mail,
                            title: event.target.value
                          }
                        })
                      }
                    />
                    <Form.Control.Feedback type="invalid">
                      메일 제목을 작성해주세요.
                    </Form.Control.Feedback>
                  </Col>
                </Form.Group>
                <Form.Group as={Row} controlId="mailContent">
                  <Form.Label column sm={2}>
                    내용
                  </Form.Label>
                  <Col sm={10}>
                    <Form.Control
                      as="textarea"
                      size="sm"
                      rows="2"
                      required
                      value={mail.content || '내용 없음'}
                      onChange={event => handleContentChange(event)}
                    />
                    <Form.Control.Feedback type="invalid">
                      메일을 작성해주세요.
                    </Form.Control.Feedback>
                  </Col>
                </Form.Group>
                <Form.Group as={Row}>
                  <Col sm={2} />
                  <Col>
                    <Form.Label>
                      {mailKey ? `No.${mailKey} / ${date}` : ''}
                    </Form.Label>
                  </Col>
                  <Button
                    onClick={priorMail}
                    column
                    sm={2}
                    size="sm"
                    variant="outline-warning"
                  >
                    <i className="fas fa-arrow-left" />
                  </Button>
                  <Col sm={2}>
                    <Button
                      onClick={nextMail}
                      column
                      sm={2}
                      size="sm"
                      variant="outline-warning"
                    >
                      <i className="fas fa-arrow-right" />
                    </Button>
                  </Col>
                </Form.Group>

                <Form.Group as={Row} controlId="mailPositionDetail">
                  <Form.Label column sm={2}>
                    디테일
                  </Form.Label>
                  <Col sm={10}>
                    <Form.Control
                      as="textarea"
                      size="sm"
                      rows="3"
                      required
                      value={positionDetail || '디테일 없음'}
                      onChange={event => handleDetailChange(event)}
                    />
                    <Form.Control.Feedback type="invalid">
                      포지션 디테일을 작성해주세요.
                    </Form.Control.Feedback>
                  </Col>
                </Form.Group>
                <Button type="submit" block size="sm">
                  <i class="fas fa-envelope"> 메일 보내기</i>
                </Button>
              </Form>
            </details>
          </Col>
        </Row>
      </div>
    );
  }
}
