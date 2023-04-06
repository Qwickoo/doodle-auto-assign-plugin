async function sleep(duration) {
  await new Promise(resolve => setTimeout(resolve, duration));
}

async function applicationTableLoaded() {
  let element = undefined;
  while (!element) {
    element = document.querySelector('.ParticipationTable > table');
    await sleep(250);
  }
}

function createSessions() {
  const sessionNames = [];
  const sessions = [];

  document.querySelectorAll('.OptionHeader__date').forEach(element => {
    const month = element.querySelector(".OptionHeader__date-month").innerText;
    const date = element.querySelector(".OptionHeader__date-day").innerText;
    const day = element.querySelector(".OptionHeader__date-DOW").innerText;

    sessionNames.push(`${day} ${date} ${month}`);
  });

  for (let i = 0; i < sessionNames.length; i++) {
    sessions.push([]);
  }

  return [sessionNames, sessions]
}

function readParticipation() {
  let isMe = true;
  const participants = new Map();

  document
    .querySelector('.ParticipationTable > table').querySelectorAll('.ParticipationTable__rows')
    .forEach(element => {
      if (!isMe) {
        const participantName = element.querySelector('.UserStatusListItem__name').innerText;
        const booleans = [];

        element.parentElement.querySelectorAll('.Vote')
          .forEach(voteElement => {
            booleans.push(voteElement.classList.contains('Vote--accepted') || voteElement.classList.contains('Vote--if-need-be'));
          });

        participants.set(participantName, booleans);
      } else {
        isMe = false;
      }
    });

  return participants;
}

function fillSessions(sessions, participants) {
  const maxParticipantPerSession = (participants.size / sessions.length);

  // Sort participant by less available first
  const participantsByQuantityAvailable = [...participants.entries()]
    .sort((entryA, entryB) => {
      const sortResult = entryA[1].filter(Boolean).length - entryB[1].filter(Boolean).length;

      return sortResult !== 0 ? sortResult : 0.5 - Math.random();
    })
    .map(entry => entry[0]);

  // Fill sessions
  for (let participant of participantsByQuantityAvailable) {
    for (let i = 0; i < sessions.length; i++) {
      if (sessions[i].length <= maxParticipantPerSession) {
        if (participants.get(participant) && participants.get(participant)[i]) {
          sessions[i].push(participant)
          break;
        }
      }
    }
  }

  return sessions;
}

async function removeAds() {
    let adsLayout = [];
    while (adsLayout.length === 0) {
        adsLayout = document.querySelectorAll('.AdsSlot');
        await new Promise(resolve => setTimeout(resolve, 250));
    }

    adsLayout.forEach(ad => ad.remove());

    document.querySelector('.AdsLayout__top-container').remove();
}


function buildBody(sessions, sessionNames) {
    return sessions
        .map((session, i) => "<div>" + sessionNames[i] + " : " + session.join(', ') + "</div><br />");
}

applicationTableLoaded()
    .then(() => {
        const participants = readParticipation();

        let [sessionNames, sessions] = createSessions();

        sessions = fillSessions(sessions, participants)

        document.querySelector('.OpenStatePageContent__details').insertAdjacentHTML(
            "afterend",
            "<style>" +
            "#show-sessions { width: 100%; background-color : white; padding: var(--space-3x);" +
            "border-left: 1px solid var(--color-neutral-300); border-right: 1px solid var(--color-neutral-300)}" +
            "</style>" +
            "<div id='show-sessions'><div class='Button Button--blue'>Show me sessions !</div></div>"
        );

        document.querySelector(".OpenStatePageContent").insertAdjacentHTML(
            'afterbegin',
            "<style>" +
            ".popin-sessions { width: 800px; padding: 40px 60px; z-index: 100000; background: white; align-items: center; justify-content: center; box-shadow: 0 0 10px #c0c0c0; border-radius: 5px; }" +
            "#popin-sessions-container { display: none; align-items: center; z-index: 100000; justify-content: center; position: absolute; width: 100vw; height: 100vh; background-color: rgba(35, 114, 232, 0.2); }" +
            "</style>" +
            "<div id='popin-sessions-container'><div class='popin-sessions'>" +
            buildBody(sessions, sessionNames).join('') +
            "</div></div>"
        );

        document.querySelector("#show-sessions").addEventListener("click", (ev) => {
            ev.stopPropagation();
            document.querySelector("#popin-sessions-container").style.display = 'flex';
        });

        document.querySelector("#popin-sessions-container").addEventListener("click", () => {
            document.querySelector("#popin-sessions-container").style.display = 'none';
        });
    });

removeAds();
