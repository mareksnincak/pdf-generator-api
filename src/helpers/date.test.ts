import { addHoursToDate, fromUnixTimestamp, toUnixTimestamp } from './date.helper';

afterEach(() => {
  jest.clearAllMocks();
});

describe('toUnixTimestamp', () => {
  it('should convert date to unix timestamp', () => {
    const date = new Date('2024-03-08T12:16:11.000Z');

    const result = toUnixTimestamp(date);

    expect(result).toEqual(1709900171);
  });

  it('should ignore milliseconds', () => {
    const date1 = new Date('2024-03-08T12:16:11.999Z');
    const date2 = new Date('2024-03-08T12:16:11.000Z');

    const result1 = toUnixTimestamp(date1);
    const result2 = toUnixTimestamp(date2);

    expect(result1).toEqual(result2);
  });
});

describe('fromUnixTimestamp', () => {
  it('should convert unix timestamp to date', () => {
    const timestamp = 1709900171;

    const result = fromUnixTimestamp(timestamp);

    expect(result).toEqual(new Date('2024-03-08T12:16:11.000Z'));
  });
});

describe('addHoursToDate', () => {
  it('should add 1 hour to date', () => {
    const date = new Date('2024-03-08T12:16:11.000Z');

    const result = addHoursToDate(date, 1);

    expect(result).toEqual(new Date('2024-03-08T13:16:11.000Z'));
  });

  it('should add 25 hours to date', () => {
    const date = new Date('2024-03-08T12:16:11.000Z');

    const result = addHoursToDate(date, 25);

    expect(result).toEqual(new Date('2024-03-09T13:16:11.000Z'));
  });
});
