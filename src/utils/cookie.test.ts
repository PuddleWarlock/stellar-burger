import { deleteCookie, getCookie, setCookie } from './cookie';

const OriginalDate = global.Date;

describe('cookie utils', () => {
  let cookieString = '';

  let dateSpy: jest.SpyInstance;

  beforeEach(() => {
    cookieString = '';

    Object.defineProperty(document, 'cookie', {
      get: jest.fn(() => cookieString),
      set: jest.fn((value) => {
        cookieString = value;
      }),
      configurable: true
    });

    const mockDate = new OriginalDate('2024-01-26T10:00:00.000Z');
    dateSpy = jest
      .spyOn(global, 'Date')

      .mockImplementation((dateString?: string | number | Date): Date => {
        if (dateString !== undefined) {
          return new OriginalDate(dateString);
        }

        return mockDate;
      });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('setCookie - sets cookie with minimal parameters', () => {
    setCookie('testName', 'testValue');
    const expectedCookieString = 'testName=testValue; path=/';

    expect(
      Object.getOwnPropertyDescriptor(document, 'cookie')?.set
    ).toHaveBeenCalledWith(expectedCookieString);

    expect(cookieString).toBe(expectedCookieString);
  });

  it('setCookie - sets cookie with additional parameters', () => {
    const expiresDate = new Date('2024-01-27T10:00:00.000Z');
    setCookie('userPref', 'darkTheme', {
      path: '/dashboard',
      expires: expiresDate,
      secure: true
    });

    expect(cookieString).toContain('userPref=darkTheme');
    expect(cookieString).toContain('path=/dashboard');
    expect(cookieString).toContain('secure');
    expect(cookieString).toMatch(/expires=Sat,?\sJan\s27\s2024\s10:00:00\sGMT/);
  });

  it('setCookie - sets cookie with number for expires', () => {
    const expiresNum = 3600;
    setCookie('session', 'active', { expires: expiresNum });

    expect(cookieString).toContain('session=active');
    expect(cookieString).toContain('path=/');
    expect(cookieString).toMatch(/expires=Fri,?\sJan\s26\s2024\s11:00:00\sGMT/);
  });

  it('setCookie - encodes cookie value', () => {
    setCookie('name', 'value with spaces=and;semicolons');
    const expectedCookieString =
      'name=value%20with%20spaces%3Dand%3Bsemicolons; path=/';
    expect(
      Object.getOwnPropertyDescriptor(document, 'cookie')?.set
    ).toHaveBeenCalledWith(expectedCookieString);
    expect(cookieString).toBe(expectedCookieString);
  });

  it('getCookie - returns value of existing cookie', () => {
    cookieString = 'name1=value1; testCookie=testValue; name2=value2';
    const value = getCookie('testCookie');
    expect(value).toBe('testValue');
    expect(
      Object.getOwnPropertyDescriptor(document, 'cookie')?.get
    ).toHaveBeenCalled();
  });

  it('getCookie - returns undefined for non-existent cookie', () => {
    cookieString = 'name1=value1; name2=value2';
    const value = getCookie('nonExistent');
    expect(value).toBeUndefined();
    expect(
      Object.getOwnPropertyDescriptor(document, 'cookie')?.get
    ).toHaveBeenCalled();
  });

  it('getCookie - decodes cookie value', () => {
    cookieString = 'encoded=test%20value%21';
    const value = getCookie('encoded');
    expect(value).toBe('test value!');
    expect(
      Object.getOwnPropertyDescriptor(document, 'cookie')?.get
    ).toHaveBeenCalled();
  });

  it('deleteCookie - deletes cookie by setting expires to a past date', () => {
    deleteCookie('itemToDelete');

    expect(cookieString).toContain('itemToDelete=');
    expect(cookieString).toContain('path=/');

    expect(cookieString).toMatch(/expires=Fri,?\sJan\s26\s2024\s09:59:59\sGMT/);
  });
});
