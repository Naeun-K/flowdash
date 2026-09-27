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

  const overlay = document.createElement("div");
  overlay.className = "notification-settings-overlay";

  overlay.innerHTML = `
    <section
      class="notification-settings-dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby="notification-settings-title"
    >
      <h2 id="notification-settings-title">알림 설정</h2>
      <p class="notification-settings-due"></p>

      <h3>설정된 알림</h3>
      <ul class="notification-settings-list"></ul>

      <form class="notification-settings-form">
        <label for="notification-value">만기일</label>
        <input
          id="notification-value"
          type="number"
          min="1"
          step="1"
          value="30"
          required
        />
        <select aria-label="알림 단위">
          <option value="minute">분</option>
          <option value="hour">시간</option>
          <option value="day">일</option>
        </select>
        <span>전</span>
        <button type="submit">추가</button>
      </form>

      <p class="notification-settings-error" role="alert"></p>

      <div class="notification-settings-actions">
        <button type="button" data-action="cancel">취소</button>
        <button type="button" data-action="save">적용</button>
      </div>
    </section>
  `;

  const list = overlay.querySelector(".notification-settings-list");
  const error = overlay.querySelector(".notification-settings-error");
  const valueInput = overlay.querySelector("#notification-value");
  const unitSelect = overlay.querySelector("select");
  const saveButton = overlay.querySelector('[data-action="save"]');

  overlay.querySelector(".notification-settings-due").textContent =
    `만기일: ${new Date(dueAt).toLocaleString("ko-KR")}`;

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

  overlay
    .querySelector(".notification-settings-form")
    .addEventListener("submit", (event) => {
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

  overlay
    .querySelector('[data-action="cancel"]')
    .addEventListener("click", close);

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
