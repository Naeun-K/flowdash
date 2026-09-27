const UNIT_TO_MS = {
  minute: 60 * 1000,
  hour: 60 * 60 * 1000,
  day: 24 * 60 * 60 * 1000,
};

const UNIT_LABEL = {
  minute: "분",
  hour: "시간",
  day: "일",
};

export function calculateNotifyAt(dueAt, value, unit) {
  return Number(dueAt) - Number(value) * UNIT_TO_MS[unit];
}

export function recalculateNotifications(
  notifications,
  dueAt,
  dueAtChanged = false,
) {
  return (Array.isArray(notifications) ? notifications : []).map(
    (notification) => ({
      ...notification,
      notifyAt: calculateNotifyAt(dueAt, notification.value, notification.unit),
      sent: dueAtChanged ? false : Boolean(notification.sent),
    }),
  );
}

export function openNotificationSettings(task, onSave) {
  if (task.status === "DONE") return;

  const previousFocus = document.activeElement;
  const dueAt =
    Number(task.dueAt) || Number(task.createdAt) + 24 * 60 * 60 * 1000;

  let notifications = (
    Array.isArray(task.notifications) ? task.notifications : []
  ).map((notification) => ({ ...notification }));

  // 대화상자의 요소를 HTML 문자열 없이 생성한다.
  const overlay = document.createElement("div");
  overlay.className = "notification-settings-overlay";

  const dialog = document.createElement("section");
  dialog.className = "notification-settings-dialog";
  dialog.setAttribute("role", "dialog");
  dialog.setAttribute("aria-modal", "true");
  dialog.setAttribute("aria-labelledby", "notification-settings-title");

  const title = document.createElement("h2");
  title.id = "notification-settings-title";
  title.textContent = "알림 설정";

  const due = document.createElement("p");
  due.className = "notification-settings-due";
  due.textContent = `만기일: ${new Date(dueAt).toLocaleString("ko-KR")}`;

  const listTitle = document.createElement("h3");
  listTitle.textContent = "설정된 알림";

  const list = document.createElement("ul");
  list.className = "notification-settings-list";

  const form = document.createElement("form");
  form.className = "notification-settings-form";

  const valueLabel = document.createElement("label");
  valueLabel.htmlFor = "notification-value";
  valueLabel.textContent = "만기일";

  const valueInput = document.createElement("input");
  valueInput.id = "notification-value";
  valueInput.type = "number";
  valueInput.min = "1";
  valueInput.step = "1";
  valueInput.value = "30";
  valueInput.required = true;

  const unitSelect = document.createElement("select");
  unitSelect.setAttribute("aria-label", "알림 단위");

  for (const [value, label] of Object.entries(UNIT_LABEL)) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    unitSelect.append(option);
  }

  const beforeText = document.createElement("span");
  beforeText.textContent = "전";

  const addButton = document.createElement("button");
  addButton.type = "submit";
  addButton.textContent = "추가";

  form.append(valueLabel, valueInput, unitSelect, beforeText, addButton);

  const error = document.createElement("p");
  error.className = "notification-settings-error";
  error.setAttribute("role", "alert");

  const actions = document.createElement("div");
  actions.className = "notification-settings-actions";

  const cancelButton = document.createElement("button");
  cancelButton.type = "button";
  cancelButton.dataset.action = "cancel";
  cancelButton.textContent = "취소";

  const saveButton = document.createElement("button");
  saveButton.type = "button";
  saveButton.dataset.action = "save";
  saveButton.textContent = "적용";

  actions.append(cancelButton, saveButton);
  dialog.append(title, due, listTitle, list, form, error, actions);
  overlay.append(dialog);

  function close() {
    document.removeEventListener("keydown", handleKeyDown);
    overlay.remove();
    previousFocus?.focus();
  }

  function handleKeyDown(event) {
    if (event.key === "Escape") {
      close();
      return;
    }

    if (event.key !== "Tab") return;

    const controls = [
      ...overlay.querySelectorAll("button:not(:disabled), input, select"),
    ];

    if (event.shiftKey && document.activeElement === controls[0]) {
      event.preventDefault();
      controls.at(-1).focus();
    } else if (!event.shiftKey && document.activeElement === controls.at(-1)) {
      event.preventDefault();
      controls[0].focus();
    }
  }

  function renderNotifications() {
    list.replaceChildren();

    if (notifications.length === 0) {
      const empty = document.createElement("li");
      empty.textContent = "설정된 알림이 없습니다.";
      list.append(empty);
      return;
    }

    notifications.forEach((notification) => {
      const item = document.createElement("li");
      const label = document.createElement("span");
      const removeButton = document.createElement("button");

      label.textContent = `${notification.value}${UNIT_LABEL[notification.unit]} 전`;

      removeButton.type = "button";
      removeButton.textContent = "삭제";
      removeButton.setAttribute("aria-label", `${label.textContent} 알림 삭제`);

      removeButton.addEventListener("click", () => {
        notifications = notifications.filter(
          (item) => item.id !== notification.id,
        );
        renderNotifications();
      });

      item.append(label, removeButton);
      list.append(item);
    });
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    error.textContent = "";

    const value = Number(valueInput.value);
    const unit = unitSelect.value;
    const notifyAt = calculateNotifyAt(dueAt, value, unit);

    if (
      !Number.isSafeInteger(value) ||
      value < 1 ||
      !Number.isFinite(notifyAt) ||
      notifyAt <= Date.now()
    ) {
      error.textContent = "알림 시각은 현재보다 미래여야 합니다.";
      return;
    }

    const alreadyExists = notifications.some(
      (notification) =>
        calculateNotifyAt(dueAt, notification.value, notification.unit) ===
        notifyAt,
    );

    if (alreadyExists) {
      error.textContent = "같은 시각의 알림이 이미 있습니다.";
      return;
    }

    notifications.push({
      id: crypto.randomUUID(),
      type: "before",
      value,
      unit,
      notifyAt,
      sent: false,
    });

    renderNotifications();
  });

  cancelButton.addEventListener("click", close);

  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) close();
  });

  saveButton.addEventListener("click", async () => {
    saveButton.disabled = true;
    error.textContent = "";

    try {
      await onSave(recalculateNotifications(notifications, dueAt));
      close();
    } catch (saveError) {
      console.error("알림 설정 저장 실패:", saveError);
      error.textContent = "저장하지 못했습니다. 다시 시도해 주세요.";
      saveButton.disabled = false;
    }
  });

  document.body.append(overlay);
  document.addEventListener("keydown", handleKeyDown);

  renderNotifications();
  valueInput.focus();
}
