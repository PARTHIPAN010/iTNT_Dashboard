const sectionsData = {
  A1: "No of Outreach / Promotion",
  A2: "No of Training / Mentorship Programs",
  A3: "Direct Ecosystem Engagement Events (Pitch Fest, Contests, Hackathons, Talks)",
  A4: "Other Activities/Tasks (e.g., Infra, MoUs, Events)",
  B1: "No. of Startups to be Incubated",
  B2: "No. of Startups to be Accelerated",
  B3: "Cumulative No. of IPs Created by Startups",
  B4: "Cumulative No. of Products Created/Launched",
  B5: "Cumulative No. of Prototypes Showcased",
};

const yearOptions = [2023, 2024, 2025, 2026, 2027];
const monthOptions = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const selectedMonths = {};

document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("sections-container");

  Object.entries(sectionsData).forEach(([code, title]) => {
    selectedMonths[code] = {};
    const section = document.createElement("div");
    section.className = "section";
    section.id = `section-${code}`;

    const sectionTitle = document.createElement("div");
    sectionTitle.className = "section-title";
    sectionTitle.innerText = `${code} : ${title}`;
    section.appendChild(sectionTitle);

    const monthContainer = document.createElement("div");
    monthContainer.className = "month-container";

    addMonthForm(section, monthContainer, code);
    section.appendChild(monthContainer);
    container.appendChild(section);
  });
});

async function saveEventToDB(teamCode, date, month, year, eventDetails, participants = [], startups = []) {
  try {
    const response = await fetch('http://localhost:3000/api/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        teamCode,
        parameter: sectionsData[teamCode],
        date,
        month,
        year,
        eventDetails,
        participants,
        startups
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to save event');
    }

    return await response.json();
  } catch (error) {
    console.error('Error saving event:', error);
    return null;
  }
}

function addMonthForm(section, container, code) {
  const form = document.createElement("div");
  form.className = "controls";

  const yearSelect = document.createElement("select");
  yearOptions.forEach(y => {
    const opt = document.createElement("option");
    opt.value = y;
    opt.text = y;
    yearSelect.appendChild(opt);
  });

  const monthSelect = document.createElement("select");

  const updateMonthDropdown = () => {
    const year = yearSelect.value;
    monthSelect.innerHTML = "";
    const usedMonths = selectedMonths[code][year] || [];

    monthOptions.forEach(month => {
      if (!usedMonths.includes(month)) {
        const opt = document.createElement("option");
        opt.value = month;
        opt.text = month;
        monthSelect.appendChild(opt);
      }
    });
  };

  yearSelect.addEventListener("change", updateMonthDropdown);
  updateMonthDropdown();

  const eventsDiv = document.createElement("div");
  eventsDiv.className = "event-group";
  addEventInput(eventsDiv, code);

  const addEventBtn = document.createElement("button");
  addEventBtn.innerText = "+ Event";
  addEventBtn.type = "button";
  addEventBtn.onclick = () => addEventInput(eventsDiv, code);

  const finishBtn = document.createElement("button");
  finishBtn.innerText = "Finish";
  finishBtn.type = "button";
  finishBtn.onclick = () => summarizeEvents(container, code);

  const editBtn = document.createElement("button");
  editBtn.innerText = "✏ Edit";
  editBtn.type = "button";
  editBtn.className = "edit-btn";
  editBtn.style.display = "none";
  editBtn.onclick = () => {
    form.querySelectorAll("input").forEach(input => input.disabled = false);
    yearSelect.disabled = false;
    monthSelect.disabled = false;
    addEventBtn.disabled = false;
    
    // Enable all event edit buttons
    eventsDiv.querySelectorAll(".edit-event-btn").forEach(btn => {
      btn.style.display = "inline-block";
    });
    
    savePart.style.display = "flex";
    editBtn.style.display = "none";
    savePart.innerText = "💾 Re-save";
  };

  const saveAddRemoveWrapper = document.createElement("div");
  saveAddRemoveWrapper.style.display = "flex";
  saveAddRemoveWrapper.style.alignItems = "center";
  saveAddRemoveWrapper.style.border = "1px solid #aaa";
  saveAddRemoveWrapper.style.borderRadius = "6px";
  saveAddRemoveWrapper.style.overflow = "hidden";
  saveAddRemoveWrapper.style.margin = "4px 0";
  saveAddRemoveWrapper.style.cursor = "pointer";
  saveAddRemoveWrapper.style.userSelect = "none";
  saveAddRemoveWrapper.style.fontSize = "14px";

  const savePart = document.createElement("div");
  savePart.innerText = "✔ Save Month";
  savePart.style.padding = "6px 10px";
  savePart.style.flex = "1";
  savePart.style.textAlign = "center";
  savePart.style.borderRight = "1px solid #aaa";
  savePart.style.backgroundColor = "#f5f5f5";
  savePart.style.display = "flex";
  savePart.style.justifyContent = "center";
  savePart.style.alignItems = "center";

  const plusPart = document.createElement("div");
  plusPart.innerText = "+";
  plusPart.title = "Add another month";
  plusPart.style.padding = "6px 10px";
  plusPart.style.borderRight = "1px solid #aaa";
  plusPart.style.backgroundColor = "#e0f7e9";

  const minusPart = document.createElement("div");
  minusPart.innerText = "−";
  minusPart.title = "Remove this month form";
  minusPart.style.padding = "6px 10px";
  minusPart.style.backgroundColor = "#fdecea";

  savePart.onclick = async () => {
    const year = yearSelect.value;
    const month = monthSelect.value;

    if (!selectedMonths[code][year]) {
      selectedMonths[code][year] = [];
    }

    if (!selectedMonths[code][year].includes(month)) {
      selectedMonths[code][year].push(month);
    }

    const eventInputs = form.querySelectorAll(".event-input");
    for (const input of eventInputs) {
      const date = input.querySelector("input[type='number']").value;
      const detail = input.querySelector("input[type='text']").value;
      const participants = JSON.parse(input.dataset.participants || "[]");
      const startups = JSON.parse(input.dataset.startups || "[]");

      if (date && detail) {
        await saveEventToDB(code, date, month, year, detail, participants, startups);
      }
    }

    form.querySelectorAll("input").forEach(input => input.disabled = true);
    yearSelect.disabled = true;
    monthSelect.disabled = true;
    addEventBtn.disabled = true;
    
    // Hide all event edit buttons
    eventsDiv.querySelectorAll(".edit-event-btn").forEach(btn => {
      btn.style.display = "none";
    });

    savePart.style.display = "none";
    editBtn.style.display = "inline-block";

    container.querySelectorAll(".controls").forEach(form => {
      const ySel = form.querySelector("select");
      if (ySel && ySel.value === year) {
        const mSel = form.querySelectorAll("select")[1];
        if (mSel && !mSel.disabled) {
          const used = selectedMonths[code][year] || [];
          mSel.innerHTML = "";
          monthOptions.forEach(month => {
            if (!used.includes(month)) {
              const opt = document.createElement("option");
              opt.value = month;
              opt.text = month;
              mSel.appendChild(opt);
            }
          });
        }
      }
    });
  };

  plusPart.onclick = () => addMonthForm(section, container, code);

  minusPart.onclick = () => {
    const forms = container.querySelectorAll(".controls");
    if (forms.length > 1) {
      container.removeChild(form);
    }
  };

  saveAddRemoveWrapper.appendChild(savePart);
  saveAddRemoveWrapper.appendChild(plusPart);
  saveAddRemoveWrapper.appendChild(minusPart);

  form.appendChild(yearSelect);
  form.appendChild(monthSelect);
  form.appendChild(saveAddRemoveWrapper);
  form.appendChild(editBtn);
  form.appendChild(addEventBtn);
  form.appendChild(finishBtn);
  form.appendChild(eventsDiv);

  container.appendChild(form);
}

function addEventInput(container, code) {
  const wrapper = document.createElement("div");
  wrapper.className = "event-input";
  wrapper.style.display = "flex";
  wrapper.style.flexDirection = "column";
  wrapper.style.gap = "8px";
  wrapper.style.padding = "10px";
  wrapper.style.border = "1px solid #ddd";
  wrapper.style.borderRadius = "5px";
  wrapper.style.marginBottom = "10px";

  const topRow = document.createElement("div");
  topRow.style.display = "flex";
  topRow.style.alignItems = "center";
  topRow.style.gap = "8px";

  const dateInput = document.createElement("input");
  dateInput.type = "number";
  dateInput.min = 1;
  dateInput.max = 31;
  dateInput.placeholder = "Date";
  dateInput.style.width = "60px";

  const eventInput = document.createElement("input");
  eventInput.type = "text";
  eventInput.placeholder = "Enter event details";
  eventInput.style.flex = "1";

  const controlBox = document.createElement("div");
  controlBox.style.display = "flex";
  controlBox.style.flexDirection = "column";
  controlBox.style.justifyContent = "center";
  controlBox.style.alignItems = "center";
  controlBox.style.fontSize = "18px";
  controlBox.style.cursor = "pointer";
  controlBox.style.border = "1px solid #aaa";
  controlBox.style.borderRadius = "4px";
  controlBox.style.padding = "4px 6px";
  controlBox.style.userSelect = "none";
  controlBox.style.lineHeight = "1";

  const plus = document.createElement("div");
  plus.innerText = "+";
  plus.style.marginBottom = "2px";
  plus.title = "Add Event";

  const minus = document.createElement("div");
  minus.innerText = "−";
  minus.title = "Remove Event";

  plus.onclick = () => addEventInput(container, code);
  minus.onclick = () => {
    if (container.childNodes.length > 1) {
      container.removeChild(wrapper);
    }
  };

  controlBox.appendChild(plus);
  controlBox.appendChild(minus);

  topRow.appendChild(dateInput);
  topRow.appendChild(eventInput);
  topRow.appendChild(controlBox);

  // Buttons for participants and startups
  const buttonsRow = document.createElement("div");
  buttonsRow.style.display = "flex";
  buttonsRow.style.gap = "10px";
  buttonsRow.style.marginTop = "5px";

  const participantsBtn = document.createElement("button");
  participantsBtn.innerText = "Entrepreneurs benefitted";
  participantsBtn.className = "participants-btn";
  participantsBtn.style.fontSize = "12px";
  participantsBtn.style.padding = "5px 8px";
  participantsBtn.onclick = () => showParticipantsModal(wrapper, code);

  const startupsBtn = document.createElement("button");
  startupsBtn.innerText = "Startups Supported";
  startupsBtn.className = "startups-btn";
  startupsBtn.style.fontSize = "12px";
  startupsBtn.style.padding = "5px 8px";
  startupsBtn.onclick = () => showStartupsModal(wrapper, code);

  const editEventBtn = document.createElement("button");
  editEventBtn.innerText = "✏ Edit Event";
  editEventBtn.className = "edit-event-btn";
  editEventBtn.style.fontSize = "12px";
  editEventBtn.style.padding = "5px 8px";
  editEventBtn.style.marginLeft = "auto";
  editEventBtn.style.display = "none";
  editEventBtn.onclick = () => {
    dateInput.disabled = false;
    eventInput.disabled = false;
    participantsBtn.disabled = false;
    startupsBtn.disabled = false;
    editEventBtn.style.display = "none";
  };

  buttonsRow.appendChild(participantsBtn);
  buttonsRow.appendChild(startupsBtn);
  buttonsRow.appendChild(editEventBtn);

  // Summary display
  const summaryDiv = document.createElement("div");
  summaryDiv.className = "event-summary";
  summaryDiv.style.fontSize = "12px";
  summaryDiv.style.color = "#666";

  wrapper.appendChild(topRow);
  wrapper.appendChild(buttonsRow);
  wrapper.appendChild(summaryDiv);
  container.appendChild(wrapper);

  // Initialize data attributes
  wrapper.dataset.participants = "[]";
  wrapper.dataset.startups = "[]";

  // Update summary display
  updateEventSummary(wrapper);
}

function updateEventSummary(wrapper) {
  const participants = JSON.parse(wrapper.dataset.participants || "[]");
  const startups = JSON.parse(wrapper.dataset.startups || "[]");
  const summaryDiv = wrapper.querySelector(".event-summary");

  let summaryText = "";
  if (participants.length > 0) {
    summaryText += `Entrepreneurs: ${participants.length} `;
  }
  if (startups.length > 0) {
    summaryText += `Startups: ${startups.length}`;
  }

  summaryDiv.innerText = summaryText;
}

function showParticipantsModal(wrapper, code) {
  const modal = document.createElement("div");
  modal.className = "modal";
  modal.style.position = "fixed";
  modal.style.top = "0";
  modal.style.left = "0";
  modal.style.width = "100%";
  modal.style.height = "100%";
  modal.style.backgroundColor = "rgba(0,0,0,0.5)";
  modal.style.display = "flex";
  modal.style.justifyContent = "center";
  modal.style.alignItems = "center";
  modal.style.zIndex = "1000";

  const modalContent = document.createElement("div");
  modalContent.className = "modal-content";
  modalContent.style.backgroundColor = "white";
  modalContent.style.padding = "20px";
  modalContent.style.borderRadius = "8px";
  modalContent.style.width = "80%";
  modalContent.style.maxWidth = "600px";

  const title = document.createElement("h3");
  title.innerText = `Entrepreneurs Benefitted for ${code}`;
  modalContent.appendChild(title);

  const inputContainer = document.createElement("div");
  inputContainer.className = "participants-container";
  inputContainer.style.maxHeight = "300px";
  inputContainer.style.overflowY = "auto";
  inputContainer.style.margin = "10px 0";

  // Load existing participants
  const existingParticipants = JSON.parse(wrapper.dataset.participants || "[]");
  existingParticipants.forEach(participant => {
    addParticipantInput(inputContainer, participant.name, participant.email);
  });

  // Add at least one empty input if no existing participants
  if (existingParticipants.length === 0) {
    addParticipantInput(inputContainer);
  }

  const addParticipantBtn = document.createElement("button");
  addParticipantBtn.innerText = "+ Add Participant";
  addParticipantBtn.className = "modal-btn";
  addParticipantBtn.onclick = () => addParticipantInput(inputContainer);

  const saveBtn = document.createElement("button");
  saveBtn.innerText = "Save";
  saveBtn.className = "modal-btn primary";
  saveBtn.style.marginLeft = "10px";
  saveBtn.onclick = () => {
    const participants = [];
    const inputs = inputContainer.querySelectorAll(".participant-input");
    
    inputs.forEach(input => {
      const name = input.querySelector("input[name='name']").value;
      const email = input.querySelector("input[name='email']").value;
      if (name) {
        participants.push({ name, email });
      }
    });

    wrapper.dataset.participants = JSON.stringify(participants);
    updateEventSummary(wrapper);
    modal.remove();
  };

  const closeBtn = document.createElement("button");
  closeBtn.innerText = "Close";
  closeBtn.className = "modal-btn";
  closeBtn.style.marginLeft = "10px";
  closeBtn.onclick = () => modal.remove();

  const buttonContainer = document.createElement("div");
  buttonContainer.style.display = "flex";
  buttonContainer.style.justifyContent = "flex-end";
  buttonContainer.style.marginTop = "15px";
  buttonContainer.appendChild(addParticipantBtn);
  buttonContainer.appendChild(saveBtn);
  buttonContainer.appendChild(closeBtn);

  modalContent.appendChild(inputContainer);
  modalContent.appendChild(buttonContainer);
  modal.appendChild(modalContent);
  document.body.appendChild(modal);
}

function addParticipantInput(container, name = "", email = "") {
  const wrapper = document.createElement("div");
  wrapper.className = "participant-input";
  wrapper.style.display = "flex";
  wrapper.style.margin = "5px 0";
  wrapper.style.gap = "10px";
  wrapper.style.alignItems = "center";

  const nameInput = document.createElement("input");
  nameInput.type = "text";
  nameInput.name = "name";
  nameInput.placeholder = "Participant Name";
  nameInput.style.flex = "1";
  nameInput.style.padding = "8px";
  nameInput.value = name;

  const emailInput = document.createElement("input");
  emailInput.type = "email";
  emailInput.name = "email";
  emailInput.placeholder = "Email (optional)";
  emailInput.style.flex = "1";
  emailInput.style.padding = "8px";
  emailInput.value = email;

  const removeBtn = document.createElement("button");
  removeBtn.innerText = "−";
  removeBtn.className = "remove-btn";
  removeBtn.onclick = () => {
    if (container.children.length > 1) {
      container.removeChild(wrapper);
    }
  };

  wrapper.appendChild(nameInput);
  wrapper.appendChild(emailInput);
  wrapper.appendChild(removeBtn);
  container.appendChild(wrapper);
}

function showStartupsModal(wrapper, code) {
  const modal = document.createElement("div");
  modal.className = "modal";
  modal.style.position = "fixed";
  modal.style.top = "0";
  modal.style.left = "0";
  modal.style.width = "100%";
  modal.style.height = "100%";
  modal.style.backgroundColor = "rgba(0,0,0,0.5)";
  modal.style.display = "flex";
  modal.style.justifyContent = "center";
  modal.style.alignItems = "center";
  modal.style.zIndex = "1000";

  const modalContent = document.createElement("div");
  modalContent.className = "modal-content";
  modalContent.style.backgroundColor = "white";
  modalContent.style.padding = "20px";
  modalContent.style.borderRadius = "8px";
  modalContent.style.width = "80%";
  modalContent.style.maxWidth = "600px";

  const title = document.createElement("h3");
  title.innerText = `Startups Supported & Mentored for ${code}`;
  modalContent.appendChild(title);

  const inputContainer = document.createElement("div");
  inputContainer.className = "startups-container";
  inputContainer.style.maxHeight = "300px";
  inputContainer.style.overflowY = "auto";
  inputContainer.style.margin = "10px 0";

  // Load existing startups
  const existingStartups = JSON.parse(wrapper.dataset.startups || "[]");
  existingStartups.forEach(startup => {
    addStartupInput(inputContainer, startup.name, startup.founder);
  });

  // Add at least one empty input if no existing startups
  if (existingStartups.length === 0) {
    addStartupInput(inputContainer);
  }

  const addStartupBtn = document.createElement("button");
  addStartupBtn.innerText = "+ Add Startup";
  addStartupBtn.className = "modal-btn";
  addStartupBtn.onclick = () => addStartupInput(inputContainer);

  const saveBtn = document.createElement("button");
  saveBtn.innerText = "Save";
  saveBtn.className = "modal-btn primary";
  saveBtn.style.marginLeft = "10px";
  saveBtn.onclick = () => {
    const startups = [];
    const inputs = inputContainer.querySelectorAll(".startup-input");
    
    inputs.forEach(input => {
      const name = input.querySelector("input[name='startup-name']").value;
      const founder = input.querySelector("input[name='founder']").value;
      if (name) {
        startups.push({ name, founder });
      }
    });

    wrapper.dataset.startups = JSON.stringify(startups);
    updateEventSummary(wrapper);
    modal.remove();
  };

  const closeBtn = document.createElement("button");
  closeBtn.innerText = "Close";
  closeBtn.className = "modal-btn";
  closeBtn.style.marginLeft = "10px";
  closeBtn.onclick = () => modal.remove();

  const buttonContainer = document.createElement("div");
  buttonContainer.style.display = "flex";
  buttonContainer.style.justifyContent = "flex-end";
  buttonContainer.style.marginTop = "15px";
  buttonContainer.appendChild(addStartupBtn);
  buttonContainer.appendChild(saveBtn);
  buttonContainer.appendChild(closeBtn);

  modalContent.appendChild(inputContainer);
  modalContent.appendChild(buttonContainer);
  modal.appendChild(modalContent);
  document.body.appendChild(modal);
}

function addStartupInput(container, name = "", founder = "") {
  const wrapper = document.createElement("div");
  wrapper.className = "startup-input";
  wrapper.style.display = "flex";
  wrapper.style.margin = "5px 0";
  wrapper.style.gap = "10px";
  wrapper.style.alignItems = "center";

  const nameInput = document.createElement("input");
  nameInput.type = "text";
  nameInput.name = "startup-name";
  nameInput.placeholder = "Startup Name";
  nameInput.style.flex = "1";
  nameInput.style.padding = "8px";
  nameInput.value = name;

  const founderInput = document.createElement("input");
  founderInput.type = "text";
  founderInput.name = "founder";
  founderInput.placeholder = "Founder Name (optional)";
  founderInput.style.flex = "1";
  founderInput.style.padding = "8px";
  founderInput.value = founder;

  const removeBtn = document.createElement("button");
  removeBtn.innerText = "−";
  removeBtn.className = "remove-btn";
  removeBtn.onclick = () => {
    if (container.children.length > 1) {
      container.removeChild(wrapper);
    }
  };

  wrapper.appendChild(nameInput);
  wrapper.appendChild(founderInput);
  wrapper.appendChild(removeBtn);
  container.appendChild(wrapper);
}

function summarizeEvents(container, code) {
  const summary = {};
  const sections = container.querySelectorAll(".controls");

  sections.forEach(section => {
    const selects = section.querySelectorAll("select");
    if (selects.length < 2) return;

    const year = selects[0].value;
    const month = selects[1].value;

    const inputs = section.querySelectorAll(".event-input");
    inputs.forEach(input => {
      const date = input.querySelector("input[type='number']").value;
      const detail = input.querySelector("input[type='text']").value;
      const participants = JSON.parse(input.dataset.participants || "[]");
      const startups = JSON.parse(input.dataset.startups || "[]");

      if (date && detail) {
        const key = `${month} ${year}`;
        if (!summary[key]) summary[key] = [];
        
        let eventText = `${date}: ${detail}`;
        if (participants.length > 0) {
          eventText += ` (${participants.length} entrepreneurs)`;
        }
        if (startups.length > 0) {
          eventText += ` (${startups.length} startups)`;
        }
        
        summary[key].push(eventText);
      }
    });
  });

  const existing = container.querySelector(".summary");
  if (existing) container.removeChild(existing);

  const summaryDiv = document.createElement("div");
  summaryDiv.className = "summary";

  summaryDiv.innerHTML = `<strong>Summary for ${code}:</strong><br>`;
  Object.entries(summary).forEach(([period, events]) => {
    summaryDiv.innerHTML += `<b>${period}</b><ul>`;
    events.forEach(event => {
      summaryDiv.innerHTML += `<li>${event}</li>`;
    });
    summaryDiv.innerHTML += "</ul>";
  });

  container.appendChild(summaryDiv);
}