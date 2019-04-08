/*global chrome*/
chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  switch (message.action) {
    case 'popupOpen': {
      // console.log('popup is open...');
      chrome.storage.local.get(['user'], response => {
        if (!response.user) {
          chrome.identity.getProfileUserInfo(result => {
            validateEmail(result.email);
            chrome.storage.local.set({
              resumeCount: 0,
              mailCount: 0,
              smsCount: 0,
              user: result.user,
              warning: ''
            });
          });
        } else {
          chrome.storage.local.set({ warning: '' });
        }
      });
      break;
    }
    default: {
      console.log('no popup');
    }
  }
});

chrome.extension.onConnect.addListener(function(port) {
  port.onMessage.addListener(async function(msg) {
    // console.log('Received: ' + msg);
    const myPort = port;
    if (msg === 'Requesting crawling') {
      try {
        await getURL();
        await getHTML();
        await getHistory();
        await crawlCandidate();
      } catch (error) {
        console.log(error);
      }
      await records();
      await compileMessage(myPort);
    } else if (msg === 'Requesting existing candidate data') {
      await getURL();
      await getHistory();
      await loadCandidate();
      await cacheMessage(myPort);
    } else if (msg === 'Requesting resume update') {
      await getURL();
      await getHTML();
      await getHistory();
      await updateCandidate();
      await records();
      await compileMessage(myPort);
    } else if (msg === 'Requesting reset')
      chrome.storage.local.set(
        {
          resumeCount: 0,
          mailCount: 0,
          smsCount: 0,
          records: [],
          saved: {},
          candidate: {},
          warning: ''
        }
        // ,() => console.log('Reset counts and records')
      );
  });
});

function validateEmail(email) {
  const api = 'http://128.199.203.161:8500/extension/login';
  const input = { email: email };
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Origin': '*'
  };
  fetch(api, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(input)
  })
    .then(response => response.json())
    .then(responseJson => {
      if (responseJson.result.check === true) {
        chrome.storage.local.set({ user: responseJson.result });
      } else {
        console.log('Unauthorized user!');
      }
    })
    .catch(error => console.log(error));
}

const getURL = () => {
  return new Promise((resolve, reject) => {
    chrome.tabs.query({ active: true, currentWindow: true }, ([currentTab]) => {
      if (currentTab) {
        const url = decodeURI(currentTab.url);
        // console.log('Got url: ', url);
        resolve(chrome.storage.local.set({ url }));
      } else {
        console.log('Unable to get current URL');
        reject('Unable to get current URL');
      }
    });
  });
};

const getHTML = () => {
  return new Promise((resolve, reject) => {
    chrome.tabs.executeScript(
      null,
      { code: 'var html = document.documentElement.outerHTML; html' },
      html => {
        resolve(chrome.storage.local.set({ html: html[0] }));
      }
    );
  });
};

function read() {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(null, function(obj) {
      resolve(obj);
    });
  });
}

const getHistory = async () => {
  const api = 'http://128.199.203.161:8500/extension/view_history';
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Origin': '*'
  };
  let storage = {};
  await read().then(data => {
    storage.data = data;
  });
  const data = await fetch(api, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify({
      user_id: storage.data.user.user_id,
      user_name: storage.data.user.user_name,
      url: storage.data.url
    })
  });
  const json = await data.json();
  await chrome.storage.local.set({ history: json });
};

const crawlCandidate = async () => {
  const api = 'http://128.199.203.161:8500/extension/parsing';
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Origin': '*'
  };
  let storage = {};
  await read().then(data => {
    storage.data = data;
  });
  // console.log(storage.data.url);
  if (
    storage.data.url.includes('linkedin') &&
    !storage.data.url.includes('detail/contact-info')
  ) {
    // console.log('incorrect linkedin');
    await chrome.storage.local.set({ warning: 'linkedin has incorrect url' });
    return;
  } else {
    const data = await fetch(api, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        user_id: storage.data.user.user_id,
        user_name: storage.data.user.user_name,
        url: storage.data.url,
        html: storage.data.html
      })
    });
    const json = await data.json();
    // console.log(json);
    await chrome.storage.local.set({
      candidate: json,
      resumeCount: storage.data.resumeCount + 1
    });
  }
};

const updateCandidate = async () => {
  const api = 'http://128.199.203.161:8500/extension/updating';
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Origin': '*'
  };
  let storage = {};
  await read().then(data => {
    storage.data = data;
  });

  for (let i = 0; i < storage.data.records.length; i++) {
    if (storage.data.records[i].candidate.url === storage.data.url) {
      storage.data.records.splice(i, 1);
      await chrome.storage.local.set({ records: storage.data.records });
      break;
    }
  }

  const data = await fetch(api, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify({
      user_id: storage.data.user.user_id,
      user_name: storage.data.user.user_name,
      url: storage.data.url,
      html: storage.data.html
    })
  });
  const json = await data.json();
  // console.log(json);
  await chrome.storage.local.set({ candidate: json });
};

const loadCandidate = () => {
  // console.log('Loading candidate...');
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(['records', 'url'], response => {
      // console.log('loading candidate: ', response.records);
      if (response.records) {
        for (let i = 0; i < response.records.length; i++) {
          let record = response.records[i];
          if (record.candidate.url !== response.url) {
            // console.log('New resume');
          } else {
            // console.log('Stored resume');
            resolve(chrome.storage.local.set({ saved: record.candidate }));
            break;
          }
        }
      } else {
        console.log('There are no saved records');
      }
    });
  });
};

const records = () => {
  chrome.storage.local.get(
    { records: [], candidate: {}, url: '', warning: '' },
    result => {
      const records = result.records;
      if (
        result.candidate &&
        result.candidate.code === 200 &&
        !result.warning
      ) {
        result.candidate.result.url = result.url;
        records.push({ candidate: result.candidate.result });
        chrome.storage.local.set({ records: records });
        // chrome.storage.local.set({ records: records }, () => {
        //   chrome.storage.local.get('records', result => {
        //     console.log(result.records);
        //   });
        // });
      }
    }
  );
};

const compileMessage = myPort => {
  let message = {};
  return new Promise((resolve, reject) => {
    resolve(
      chrome.storage.local.get(null, response => {
        if (response.candidate) {
          message = {
            user: response.user,
            url: response.url,
            html: response.html,
            history: response.history,
            resumeCount: response.resumeCount,
            candidate: response.candidate.result,
            records: response.records,
            saved: response.saved,
            warning: response.warning
          };
        } else {
          message = {
            user: response.user,
            url: response.url,
            html: response.html,
            history: response.history,
            resumeCount: response.resumeCount,
            candidate: {},
            records: response.records,
            saved: response.saved,
            warning: response.warning
          };
        }
        myPort.postMessage(message);
      })
    ).catch(error => console.log(error));
  });
};

const cacheMessage = myPort => {
  return new Promise((resolve, reject) => {
    resolve(
      chrome.storage.local.get(['saved', 'history'], response => {
        // console.log('cache: ', response);
        myPort.postMessage(response);
      })
    ).catch(error => console.log(error));
  });
};

// function sleep(ms) {
//   return new Promise(resolve => setTimeout(resolve, ms));
// }
