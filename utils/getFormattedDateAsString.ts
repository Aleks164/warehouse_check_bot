function getFormattedDateAsString(date?: string | number | Date) {
  if (date instanceof Date)
    return date.toLocaleString("ru-RU", {
      timeZone: "Europe/Moscow",
    });

  if (!date || isNaN(new Date(date).getTime()))
    return new Date().toLocaleString("ru-RU", {
      timeZone: "Europe/Moscow",
    });
  return new Date(date).toLocaleString("ru-RU", {
    timeZone: "Europe/Moscow",
  });
}

export default getFormattedDateAsString;
