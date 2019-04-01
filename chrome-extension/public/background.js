/*global chrome*/
chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  switch (message.action) {
    case 'popupOpen': {
      console.log('popup is open...');
      chrome.storage.local.get(['user'], response => {
        if (!response.user) {
          chrome.identity.getProfileUserInfo(result => {
            validateEmail(result.email);
            chrome.storage.local.set({
              resumeCount: 0,
              mailCount: 0,
              smsCount: 0,
              user: result.user
            });
          });
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
    console.log('Received: ' + msg);
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
    } else if (msg === 'Requesting reset')
      chrome.storage.local.set(
        {
          resumeCount: 0,
          mailCount: 0,
          smsCount: 0,
          records: []
        },
        () => console.log('Reset counts and records')
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
      const url = decodeURI(currentTab.url);
      resolve(chrome.storage.local.set({ url }));
    });
  });
};

const loadCandidate = () => {
  console.log('loading candidate');
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(['records', 'url'], response => {
      const candidateUrl = response.url.substring(28);
      console.log('candidateUrl', candidateUrl);
      for (let i = 0; i < response.records.length; i++) {
        let record = response.records[i];
        let candidateId = record.candidate.rm_code.substring(13);
        if (candidateUrl.includes(candidateId)) {
          resolve(chrome.storage.local.set({ saved: record.candidate }));
          break;
        } else {
          console.log('no it does not include');
        }
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
  console.log(json);
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
  console.log(json);
  await chrome.storage.local.set({
    candidate: json,
    resumeCount: storage.data.resumeCount + 1
  });
};

const records = () => {
  chrome.storage.local.get({ records: [], candidate: {} }, function(result) {
    const records = result.records;
    if (result.candidate.code === 200) {
      records.push({ candidate: result.candidate.result });
      chrome.storage.local.set({ records: records }, function() {
        chrome.storage.local.get('records', function(result) {
          console.log(result.records);
        });
      });
    }
  });
};

const compileMessage = myPort => {
  let message = {};
  return new Promise((resolve, reject) => {
    resolve(
      chrome.storage.local.get(null, response => {
        message = {
          user: response.user,
          url: response.url,
          html: response.html,
          history: response.history,
          resumeCount: response.resumeCount,
          candidate: response.candidate.result,
          records: response.records,
          saved: response.saved
        };
        console.log(message);
        myPort.postMessage(message);
      })
    ).catch(error => console.log(error));
  });
};

const cacheMessage = myPort => {
  return new Promise((resolve, reject) => {
    resolve(
      chrome.storage.local.get(['saved', 'history'], response => {
        console.log(response);
        myPort.postMessage(response);
      })
    ).catch(error => console.log(error));
  });
};

// function sleep(ms) {
//   return new Promise(resolve => setTimeout(resolve, ms));
// }
