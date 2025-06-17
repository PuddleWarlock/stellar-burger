import { deleteCookie, getCookie, setCookie } from './cookie';

const OriginalDate = global.Date;

describe('cookie utils', () => {
  let cookieString = '';
  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-26T10:00:00.000Z'));
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  beforeEach(() => {
    cookieString = '';
    Object.defineProperty(document, 'cookie', {
      get: jest.fn(() => cookieString),
      set: jest.fn((value) => {
        cookieString = value;
      }),
      configurable: true
    });
  });

  it('setCookie - sets cookie with minimal parameters', () => {
    setCookie('testName', 'testValue');
    expect(cookieString).toBe('testName=testValue; path=/');
  });

  it('setCookie - sets cookie with additional parameters (including Date object)', () => {
    const expiresDate = new OriginalDate('2024-01-27T10:00:00.000Z');
    setCookie('userPref', 'darkTheme', {
      path: '/dashboard',
      expires: expiresDate,
      secure: true
    });

    const expectedDateString = 'Sat, 27 Jan 2024 10:00:00 GMT';

    expect(cookieString).toContain('userPref=darkTheme');
    expect(cookieString).toContain('path=/dashboard');
    expect(cookieString).toContain('secure');
    expect(cookieString).toContain(`expires=${expectedDateString}`);
  });

  it('setCookie - sets cookie with number for expires', () => {
    const expiresNum = 3600; // 1 час
    setCookie('session', 'active', { expires: expiresNum });

    const expectedDateString = 'Fri, 26 Jan 2024 11:00:00 GMT';
    const expectedCookie = `session=active; path=/; expires=${expectedDateString}`;

    expect(cookieString).toBe(expectedCookie);
  });

  it('setCookie - encodes cookie value', () => {
    setCookie('name', 'value with spaces=and;semicolons');
    expect(cookieString).toBe(
      'name=value%20with%20spaces%3Dand%3Bsemicolons; path=/'
    );
  });

  it('getCookie - returns value of existing cookie', () => {
    cookieString = 'name1=value1; testCookie=testValue; name2=value2';
    const value = getCookie('testCookie');
    expect(value).toBe('testValue');
  });

  it('getCookie - returns undefined for non-existent cookie', () => {
    cookieString = 'name1=value1; name2=value2';
    const value = getCookie('nonExistent');
    expect(value).toBeUndefined();
  });

  it('getCookie - decodes cookie value', () => {
    cookieString = 'encoded=test%20value%21';
    const value = getCookie('encoded');
    expect(value).toBe('test value!');
  });

  it('deleteCookie - deletes cookie by setting expires to a past date', () => {
    deleteCookie('itemToDelete');

    const expectedDateString = 'Fri, 26 Jan 2024 09:59:59 GMT';
    const expectedCookie = `itemToDelete=; path=/; expires=${expectedDateString}`;

    expect(cookieString).toBe(expectedCookie);
  });
});
