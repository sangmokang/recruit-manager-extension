import React, { Component } from 'react';
import { Button, Col, Form, ListGroup, Row } from 'react-bootstrap';
import Axios from 'axios';
import Api from '../../utils/api';

export default class Memo extends Component {
  constructor(props) {
    super(props);
    this.state = {
      validatedMemo: false,
      memo: [],
      newNote: ''
    };
  }

  memoSubmit = event => {
    const form = event.currentTarget;
    if (form.checkValidity() === false) {
      event.preventDefault();
      event.stopPropagation();
    } else {
      event.preventDefault();
      this.setState({ validatedMemo: true });
      this.writeMemo(this.state.newNote, this.props.selectedPosition);
    }
  };

  writeMemo = async (body, position) => {
    try {
      const { user_id, user_name } = this.props.user;
      const { rm_code } = this.props.candidate;
      await Axios.post(Api.writeMemo, {
        user_id,
        rm_code,
        position: position,
        body: `${position} | ${user_name} 헤드헌터 | ${body}`,
        client: 'chrome-extension' // 수정 필요
      });
      await this.viewMemo();
    } catch (err) {
      alert(err);
    }
  };

  viewMemo = async () => {
    try {
      const { user_id } = this.props.user;
      const { rm_code } = this.props.candidate;
      const memo = await Axios.post(Api.getMemo, { user_id, rm_code });
      this.setState({ memo: memo.data.result });
    } catch (err) {
      alert(err);
    }
  };

  deleteMemo = async memo_id => {
    try {
      const { user_id } = this.props.user;
      await Axios.post(Api.deleteMemo, { user_id, memo_id });
      await alert('메모를 삭제했습니다');
      await this.viewMemo();
    } catch (error) {
      alert(error);
    }
  };

  render() {
    const { validatedMemo, memo } = this.state;

    return (
      <div>
        <Row>
          <Col>
            <Form
              noValidate
              validated={validatedMemo}
              onSubmit={e => this.memoSubmit(e)}
            >
              <Form.Row>
                <Form.Group as={Col} controlId="validationMemo">
                  <Form.Control
                    type="text"
                    size="sm"
                    placeholder="메모"
                    required
                    onChange={event =>
                      this.setState({ newNote: event.target.value })
                    }
                  />
                  <Form.Control.Feedback type="invalid">
                    메모를 작성해주세요.
                  </Form.Control.Feedback>
                </Form.Group>

                <div>
                  <Button type="submit" size="sm" inline>
                    입력
                  </Button>
                  <Button onClick={this.viewMemo} size="sm">
                    조회
                  </Button>
                </div>
              </Form.Row>
            </Form>
          </Col>
        </Row>
        <Row>
          <Col>
            <ListGroup>
              {memo && memo.length && Array.isArray(memo) ? (
                memo.map(line => {
                  return (
                    <ListGroup.Item variant="secondary" className="p-1" action>
                      {line.note}
                      <Button
                        style={{ float: 'right', fontSize: '0.75em' }}
                        variant="outline-primary"
                        size="sm"
                        onClick={() => this.deleteMemo(line.memo_id)}
                      >
                        삭제
                      </Button>
                    </ListGroup.Item>
                  );
                })
              ) : (
                <ListGroup.Item action variant="secondary" className="p-1">
                  메모가 없습니다
                </ListGroup.Item>
              )}
            </ListGroup>
          </Col>
        </Row>
      </div>
    );
  }
}
