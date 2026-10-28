// Данные клиники и настройки сайта. Меняются здесь, а не в разметке.
window.VET_CONFIG = {
  clinic: {
    name: "ВетЭксперт",
    phone: "+7 908 548-46-51",
    phoneHref: "tel:+79085484651",
    address: "Энгельс, пр-т Фридриха Энгельса, 24, 1 этаж",
    hours: "Ежедневно 08:00–20:00",
    yandexOrg: "https://yandex.ru/maps/org/vetekspert/26442412714/",
    max: "https://max.ru/", // TODO: ссылка на канал или чат клиники в MAX
    telegram: "https://t.me/+79085484651",
  },
  // Временная почта для заявок (этап 3). Позже sendLead() переедет на бота MAX или Telegram.
  leadEmail: "",
};
