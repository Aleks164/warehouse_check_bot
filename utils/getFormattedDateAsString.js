function getFormattedDateAsString(date) {
  if (date instanceof Date)
    return date.toLocaleString("ru-RU", {
      timeZone: "Europe/Moscow",
    });
  const newDate = new Date(date);
  if (!date || isNaN(newDate.getTime()))
    return new Date().toLocaleString("ru-RU", {
      timeZone: "Europe/Moscow",
    });
  return new Date(date).toLocaleString("ru-RU", {
    timeZone: "Europe/Moscow",
  });
}

module.exports = { getFormattedDateAsString };
