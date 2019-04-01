/*global chrome*/
import React, { Component } from 'react';
import {
  Button,
  ButtonGroup,
  Col,
  Container,
  Dropdown,
  Form,
  Row
} from 'react-bootstrap';
import Axios from 'axios';
import Api from './utils/api';
import Sms from './components/sms/Sms';
import Memo from './components/memo/Memo';
import Footer from './components/footer/Footer';
import RatingsTable from './components/ratings/RatingsTable.js';

class App extends Component {
  constructor(props) {
    super(props);
    chrome.runtime.sendMessage({ action: 'popupOpen' });

    this.state = {
      resumeCount: 0,
      mailCount: 0,
      smsCount: 0,
      history: {},
      candidate: {},
      ratings: [],
      positions: [],
      selectedPosition: null,
      positionDetail: '',
      mail: {
        title: '',
        content:
          '안녕하세요, \n간략히 검토후 의향에 대해서 회신 주시면 감사하겠습니다.',
        sign: `\n커리어셀파 헤드헌터 강상모 \n+82 010 3929 7682 \nwww.careersherpa.co.kr`
      },
      sms: {
        content: `안녕하세요, ${
          this.selectedPosition
        }으로 제안드리오니 메일 검토를 부탁드리겠습니다. 감사합니다.`,
        sign: '\n커리어셀파 강상모 드림. 010-3929-7682'
      },
      fetchingCrawlingData: false,
      validatedMail: false,
      user: {},
      url: '',
      records: [],
      mailList: [],
      mailKey: 0,
      smsList: [],
      smsKey: 0
    };
  }

  componentDidMount() {
    this.fetchUser();
    this.getResumeCount();
    this.getCount('mailCount');
    this.getCount('smsCount');
    this.fetchPosition();
    this.loadExistingCandidateData();
  }

  fetchUser = async () => {
    try {
      await chrome.storage.local.get(['user', 'saved', 'url'], response => {
        if (response.user && response.user.check === true) {
          this.setState({
            user: response.user
          });
        }
      });
    } catch (err) {
      alert('failed to fetch user', err);
    }
  };

  fetchPosition = async () => {
    try {
      const allPositions = await Axios.post(Api.getPosition, {
        user_id: this.state.user.user_email
      });
      const positions = allPositions.data.result.filter(
        item => item.valid === 'alive'
      );
      this.setState({ positions });
    } catch (err) {
      alert('failed to fetch positions', err);
    }
  };

  fetchPositionDetail = () => {
    const { positions, selectedPosition } = this.state;
    for (let i = 0; i < positions.length; i++) {
      if (selectedPosition.includes(positions[i].title)) {
        this.setState({ positionDetail: positions[i].detail });
        break;
      }
    }
    this.updateSmsContent();
  };

  memoSubmit = event => {
    const form = event.currentTarget;
    if (form.checkValidity() === false) {
      event.preventDefault();
      event.stopPropagation();
    } else {
      event.preventDefault();
      this.setState({ validatedMemo: true });
      this.writeMemo(this.state.newNote, this.state.selectedPosition);
    }
  };

  writeMemo = async (body, position) => {
    try {
      await Axios.post(Api.writeMemo, {
        user_id: this.state.user.user_id,
        rm_code: this.state.candidate.rm_code,
        position: position,
        body: `${position} | ${this.state.user.user_name} 헤드헌터 | ${body}`,
        client: 'chrome-extension'
      });
      await this.viewMemo();
    } catch (err) {
      alert(err);
    }
  };

  viewMemo = async () => {
    const memo = await Axios.post(Api.getMemo, {
      user_id: this.state.user.user_id,
      rm_code: this.state.candidate.rm_code
    });
    this.setState({ memo: memo.data.result });
  };

  deleteMemo = async memo_id => {
    try {
      await Axios.post(Api.deleteMemo, {
        user_id: this.state.user.user_id,
        memo_id
      });
      await alert('메모를 삭제했습니다');
      await this.viewMemo();
    } catch (error) {
      alert(error);
    }
  };

  fetchMail = async () => {
    const { user_id } = this.state.user;
    const { rm_code, email } = this.state.candidate;
    try {
      const mails = await Axios.post(Api.getMail, { user_id, rm_code, email });
      this.setState(prevState => ({
        mailList: [...prevState.mailList, mails.data.result]
      }));
    } catch (err) {
      alert(err);
    }
  };

  fetchSMS = async () => {
    const { user_id } = this.state.user;
    const { rm_code, mobile } = this.state.candidate;
    try {
      const sms = await Axios.post(Api.getSMS, { user_id, rm_code, mobile });
      this.setState(prevState => ({
        smsList: [...prevState.mailList, sms.data.result]
      }));
    } catch (err) {
      alert(err);
    }
  };

  nextMail = async () => {
    try {
      const { mailKey, mailList } = this.state;
      if (mailKey === 0 && mailList[0][0]) {
        const { body, client, position } = mailList[0][0];
        this.setState(prevState => ({
          selectedPosition: position,
          mail: {
            title: `${client} | ${position}`,
            content: body,
            sign: `\n커리어셀파 헤드헌터 강상모 \n+82 010 3929 7682 \nwww.careersherpa.co.kr`
          },
          mailKey: prevState.mailKey + 1
        }));
        alert('메일을 불러왔습니다');
      } else if (mailKey > 0 && mailList[0][mailKey]) {
        const { body, client, position } = mailList[0][mailKey];
        this.setState(prevState => ({
          selectedPosition: position,
          mail: {
            title: `${client} | ${position}`,
            content: body,
            sign: `\n커리어셀파 헤드헌터 강상모 \n+82 010 3929 7682 \nwww.careersherpa.co.kr`
          },
          mailKey: prevState.mailKey + 1
        }));
        alert('이메일을 불러왔습니다');
      } else {
        alert('더 이상 메일이 없습니다');
      }
    } catch (err) {
      alert(err);
    }
  };

  priorMail = async () => {
    try {
      const { mailKey, mailList } = this.state;
      if (mailKey === 0 && mailList[0][0]) {
        const { body, client, position } = mailList[0][0];
        this.setState(prevState => ({
          selectedPosition: position,
          mail: {
            title: `${client} | ${position}`,
            content: body,
            sign: `\n커리어셀파 헤드헌터 강상모 \n+82 010 3929 7682 \nwww.careersherpa.co.kr`
          }
        }));
        alert('메일을 불러왔습니다');
      }
      if (mailKey > 0 && mailList[0][mailKey - 1]) {
        const { body, client, position } = mailList[0][mailKey - 1];
        this.setState(prevState => ({
          selectedPosition: position,
          mail: {
            title: `${client} | ${position}`,
            content: body,
            sign: `\n커리어셀파 헤드헌터 강상모 \n+82 010 3929 7682 \nwww.careersherpa.co.kr`
          },
          mailKey: prevState.mailKey - 1
        }));
        alert('이메일을 불러왔습니다');
      } else {
        alert('더 이상 메일이 없습니다');
      }
    } catch (err) {
      alert(err);
    }
  };

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
      user_id: this.state.user.user_id,
      rm_code: this.state.candidate.rm_code,
      sender: this.state.user.user_email,
      recipient: this.state.candidate.email,
      subject: this.state.mail.title,
      body:
        this.state.mail.content +
        '\n\n' +
        '[Position Detail]\n\n' +
        this.state.positionDetail +
        '\n\n' +
        this.state.mail.sign,
      position: this.state.selectedPosition
    });
    this.addCount('mailCount');
  };

  userUpdateSmsMobile = event => {
    this.setState({
      candidate: {
        ...this.candidate,
        mobile: event.target.value
      }
    });
  };

  userUpdateSmsContent = event => {
    this.setState({
      sms: {
        ...this.sms,
        content: event.target.value
      }
    });
  };

  updateSmsContent = () => {
    this.setState({
      sms: {
        ...this.sms,
        content: `안녕하세요 ${
          this.state.selectedPosition
        }으로 제안드리오니 메일 검토를 부탁드리겠습니다. 감사합니다.`,
        sign: '\n커리어셀파 강상모 드림. 010-3929-7682'
      }
    });
  };

  getResumeCount = () => {
    const storage = chrome.storage.local;
    storage.get('resumeCount', result => {
      this.setState({ resumeCount: result.resumeCount });
    });
  };

  getCount = key => {
    const storage = chrome.storage.local;
    storage.get(key, result => {
      const currCount = result[key];
      this.setState({ [key]: currCount });
    });
  };

  addCount = key => {
    chrome.storage.local.get(key, async result => {
      if (result[key]) {
        const currCount = result[key];
        await chrome.storage.local.set({ [key]: currCount + 1 }, () => {
          this.setState({ [key]: currCount + 1 });
        });
      } else {
        await chrome.storage.local.set({ [key]: 1 }, () => {
          this.setState({ [key]: 1 });
        });
      }
      alert('송부되었습니다!');
    });
  };

  loadExistingCandidateData = () => {
    var port = chrome.extension.connect({
      name: 'Load Existing Candidate Data Communication'
    });
    port.postMessage('Requesting existing candidate data');
    port.onMessage.addListener(response => {
      const sortRatings = response.saved.rate.sort((a, b) => {
        return b.score - a.score;
      });
      this.setState({
        history: response.history,
        candidate: response.saved,
        ratings: sortRatings,
        fetchingCrawlingData: true
      });
      this.fetchMail();
      this.fetchSMS();
    });
  };

  reset = () => {
    var port = chrome.extension.connect({
      name: 'Resetting Communication'
    });
    port.postMessage('Requesting reset');
    this.setState({
      resumeCount: 0,
      mailCount: 0,
      smsCount: 0
    });
    return;
  };

  crawling = () => {
    this.setState({ fetchingCrawlingData: true });
    var port = chrome.extension.connect({
      name: 'Crawling Communication'
    });
    port.postMessage('Requesting crawling');
    port.onMessage.addListener(response => {
      if (response.user && response.user.check === true) {
        const sortRatings = response.candidate.rate.sort((a, b) => {
          return b.score - a.score;
        });
        this.fetchMail();
        this.setState({
          user: response.user,
          history: response.history,
          candidate: response.candidate,
          ratings: sortRatings,

          fetchingCrawlingData: false,
          resumeCount: response.resumeCount
        });
      } else {
        alert('Unauthorized user');
        this.setState({ fetchingCrawlingData: false });
      }
    });
  };

  setPosition = selectedPosition => {
    this.setState({ selectedPosition }, () => this.fetchPositionDetail());
  };

  render() {
    const {
      resumeCount,
      mailCount,
      smsCount,
      candidate,
      ratings,
      positionDetail,
      selectedPosition,
      mail,
      sms,
      validatedMail,
      user,
      history,
      positions
    } = this.state;

    return (
      <Container style={{ fontSize: '0.75em' }}>
        <Row>
          <Col className="pullRight">
            {this.state.fetchingCrawlingData ? (
              <Dropdown as={ButtonGroup} style={{ float: 'right' }} size="sm">
                <Button variant="outline-danger" disabled>
                  저장
                </Button>
                <Dropdown.Toggle
                  split
                  variant="outline-danger"
                  id="dropdown-split-basic"
                />
                <Dropdown.Menu style={{ fontSize: '0.90em' }}>
                  <Dropdown.Item onClick={this.reset}>초기화</Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            ) : (
              <Dropdown as={ButtonGroup} style={{ float: 'right' }} size="sm">
                <Button variant="outline-danger" onClick={this.crawling}>
                  저장
                </Button>
                <Dropdown.Toggle
                  split
                  variant="outline-danger"
                  id="dropdown-split-basic"
                />
                <Dropdown.Menu style={{ fontSize: '0.80em' }}>
                  <Dropdown.Item onClick={this.reset}>초기화</Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            )}
          </Col>
        </Row>

        <RatingsTable ratings={ratings} setPosition={this.setPosition} />

        <hr />

        <Form.Row>
          <Form.Group as={Col} controlId="selectedPosition">
            <Form.Control
              as="select"
              size="sm"
              required
              onChange={event =>
                this.setState(
                  {
                    selectedPosition: event.target.value,
                    mail: {
                      ...mail,
                      title: event.target.value
                    }
                  },
                  () => this.fetchPositionDetail()
                )
              }
            >
              <option>Position List</option>
              {positions
                ? positions.map(position => {
                    return (
                      <option as="button" size="sm">
                        {position.company} | {position.title}
                      </option>
                    );
                  })
                : null}
            </Form.Control>
          </Form.Group>
        </Form.Row>

        <hr />

        <Sms
          user={user}
          candidate={candidate}
          selectedPosition={selectedPosition}
          sms={sms}
          handleMobileChange={this.userUpdateSmsMobile}
          handleContentChange={this.userUpdateSmsContent}
          addCount={this.addCount}
        />

        <hr />

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
                      value={mail.content || null}
                      onChange={event =>
                        this.setState({
                          mail: {
                            ...mail,
                            content: event.target.value
                          }
                        })
                      }
                    />
                    <Form.Control.Feedback type="invalid">
                      메일을 작성해주세요.
                    </Form.Control.Feedback>
                  </Col>
                </Form.Group>
                <Form.Group as={Row}>
                  <Col sm={9} />
                  <Button
                    onClick={this.priorMail}
                    column
                    sm={2}
                    size="sm"
                    variant="outline-warning"
                  >
                    <i className="fas fa-arrow-left" />
                  </Button>
                  <Col sm={2}>
                    <Button
                      onClick={this.nextMail}
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
                      onChange={event =>
                        this.setState({
                          positionDetail: event.target.value
                        })
                      }
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

        <hr />

        <Memo
          user={user}
          candidate={candidate}
          selectedPosition={selectedPosition}
        />

        <hr />
        <Footer
          history={history}
          resumeCount={resumeCount}
          mailCount={mailCount}
          smsCount={smsCount}
          user={user}
          reset={this.reset}
        />
        <br />
        <Row>
          <Col>
            <p style={{ color: 'DarkGray' }}>Recruit Manager &copy; 2019</p>
          </Col>
        </Row>
      </Container>
    );
  }
}

export default App;
