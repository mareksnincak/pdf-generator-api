export function toUnixTimestamp(date: Date) {
  return Math.floor(date.getTime() / 1000);
}

export function fromUnixTimestamp(timestamp: number) {
  return new Date(timestamp * 1000);
}

export function addHoursToDate(date: Date, hours: number) {
  const clonedDate = new Date(date);
  clonedDate.setHours(clonedDate.getHours() + hours);
  return clonedDate;
}
