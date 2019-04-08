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
import Hotkeys from 'react-hot-keys';
import Axios from 'axios';
import Api from './utils/api';
import Mail from './components/mail/Mail';
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
      mailSentDate: null,
      smsList: [],
      smsKey: 0,
      smsSentDate: null
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

  setPosition = selectedPosition => {
    this.setState({ selectedPosition }, () => this.fetchPositionDetail());
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
    try {
      const mails = await Axios.post(Api.recentMail, { user_id });
      this.setState(prevState => ({
        mailList: [...prevState.mailList, mails.data.result]
      }));
    } catch (err) {
      alert(err);
    }
  };

  nextMail = async () => {
    try {
      const { mailKey, mailList } = this.state;
      if (mailKey === 0 && mailList[0][0]) {
        const { body, client, position, modified_date } = mailList[0][0];
        alert('이메일을 불러왔습니다');
        this.setState(prevState => ({
          selectedPosition: position,
          mail: {
            title: `${client} | ${position}`,
            content: body,
            sign: `\n커리어셀파 헤드헌터 강상모 \n+82 010 3929 7682 \nwww.careersherpa.co.kr`
          },
          mailKey: prevState.mailKey + 1,
          mailSentDate: modified_date
        }));
      } else if (mailKey > 0 && mailList[0][mailKey]) {
        const { body, client, position, modified_date } = mailList[0][mailKey];
        alert('이메일을 불러왔습니다');
        this.setState(prevState => ({
          selectedPosition: position,
          mail: {
            title: `${client} | ${position}`,
            content: body,
            sign: `\n커리어셀파 헤드헌터 강상모 \n+82 010 3929 7682 \nwww.careersherpa.co.kr`
          },
          mailKey: prevState.mailKey + 1,
          mailSentDate: modified_date
        }));
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
      if (mailKey === 0) {
        alert('더 이상 메일이 없습니다');
        this.setState(prevState => ({
          selectedPosition: null,
          mail: {
            title: 'N/A',
            content: 'N/A',
            sign: `\n커리어셀파 헤드헌터 강상모 \n+82 010 3929 7682 \nwww.careersherpa.co.kr`
          },
          mailSentDate: ''
        }));
      } else if (mailKey > 0 && mailList[0][mailKey]) {
        const { body, client, position, modified_date } = mailList[0][mailKey];
        alert('이메일을 불러왔습니다');
        this.setState(prevState => ({
          selectedPosition: position,
          mail: {
            title: `${client} | ${position}`,
            content: body,
            sign: `\n커리어셀파 헤드헌터 강상모 \n+82 010 3929 7682 \nwww.careersherpa.co.kr`
          },
          mailKey: prevState.mailKey - 1,
          mailSentDate: modified_date
        }));
      }
    } catch (err) {
      alert(err);
    }
  };

  userUpdateMailTitle = event => {
    this.setState({
      selectedPosition: event.target.value
    });
  };

  userUpdateMailContent = event => {
    this.setState({
      mail: {
        ...this.mail,
        content: event.target.value
      }
    });
  };

  userUpdateMailDetail = event => {
    this.setState({
      positionDetail: event.target.value
    });
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

  fetchSMS = async () => {
    const { user_id } = this.state.user;
    try {
      const sms = await Axios.post(Api.recentSMS, { user_id });
      this.setState(prevState => ({
        smsList: [...prevState.mailList, sms.data.result]
      }));
    } catch (err) {
      alert(err);
    }
  };

  nextSms = async () => {
    try {
      const { smsKey, smsList } = this.state;
      if (smsKey === 0 && smsList[0][0]) {
        const { body, modified_date } = smsList[0][0];
        alert('문자를 불러왔습니다');
        this.setState(prevState => ({
          sms: {
            content: body,
            sign: `\n커리어셀파 강상모 드림. 010-3929-7682`
          },
          smsKey: prevState.smsKey + 1,
          smsSentDate: modified_date
        }));
      } else if (smsKey > 0 && smsList[0][smsKey]) {
        const { body, modified_date } = smsList[0][smsKey];
        alert('문자를 불러왔습니다');
        this.setState(prevState => ({
          sms: {
            content: body,
            sign: `\n커리어셀파 강상모 드림. 010-3929-7682`
          },
          smsKey: prevState.smsKey + 1,
          smsSentDate: modified_date
        }));
      } else {
        alert('더 이상 문자가 없습니다');
      }
    } catch (err) {
      alert(err);
    }
  };

  priorSms = async () => {
    try {
      const { smsKey, smsList } = this.state;
      if (smsKey === 0) {
        alert('더 이상 문자가 없습니다');
        this.setState(prevState => ({
          sms: {
            content: `안녕하세요, undefined으로 제안드리오니 메일 검토를 부탁드리겠습니다. 감사합니다.`,
            sign: '\n커리어셀파 강상모 드림. 010-3929-7682'
          },
          smsSentDate: ''
        }));
      } else if (smsKey > 0 && smsList[0][smsKey]) {
        const { body, modified_date } = smsList[0][smsKey];
        alert('문자를 불러왔습니다');
        this.setState(prevState => ({
          sms: {
            content: body,
            sign: `\n커리어셀파 강상모 드림. 010-3929-7682`
          },
          smsKey: prevState.smsKey - 1,
          smsSentDate: modified_date
        }));
      }
    } catch (err) {
      alert(err);
    }
  };

  userUpdateSmsMobile = event => {
    // const number = event.target.value.replace(/-/g, '');
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
      if (this.state.history.result.length > 0) {
        alert('저장된 연락처를 불러왔습니다');
      }
    });
  };

  reset = () => {
    alert('데이터를 초기화 하였습니다');
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
        this.setState(
          {
            user: response.user,
            history: response.history,
            candidate: response.candidate,
            ratings: sortRatings,

            fetchingCrawlingData: false,
            resumeCount: response.resumeCount
          },
          () => {
            this.fetchMail();
            this.fetchSMS();
          }
        );
        alert('저장했습니다');
      } else {
        alert('Unauthorized user');
        this.setState({ fetchingCrawlingData: false });
      }
    });
  };

  onKeyUp = keyNm => {
    alert('저장 중입니다...');
    if (keyNm === 'control+2') {
      this.crawling();
    }
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
      fetchingCrawlingData,
      mail,
      mailSentDate,
      mailKey,
      sms,
      smsSentDate,
      smsKey,
      user,
      history,
      positions
    } = this.state;

    return (
      <Container style={{ fontSize: '0.75em' }}>
        <Hotkeys keyName="control+2" onKeyUp={this.onKeyUp} />
        <Row>
          <Col className="pullRight">
            {fetchingCrawlingData ? (
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
          nextSms={this.nextSms}
          priorSms={this.priorSms}
          date={smsSentDate}
          smsKey={smsKey}
          handleMobileChange={this.userUpdateSmsMobile}
          handleContentChange={this.userUpdateSmsContent}
          addCount={this.addCount}
        />

        <hr />

        <Mail
          user={user}
          candidate={candidate}
          selectedPosition={selectedPosition}
          positionDetail={positionDetail}
          mail={mail}
          nextMail={this.nextMail}
          priorMail={this.priorMail}
          date={mailSentDate}
          mailKey={mailKey}
          handleTitleChange={this.userUpdateMailTitle}
          handleContentChange={this.userUpdateMailContent}
          handleDetailChange={this.userUpdateMailDetail}
          addCount={this.addCount}
        />

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
